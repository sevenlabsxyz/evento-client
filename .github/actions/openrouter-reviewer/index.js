const core = require('@actions/core');
const github = require('@actions/github');

async function getPRDiff(octokit, owner, repo, pull_number) {
  const { data: diff } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number,
    mediaType: { format: 'diff' },
  });
  return diff;
}

async function getPRDetails(octokit, owner, repo, pull_number) {
  const { data: pr } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number,
  });
  return pr;
}

async function getChangedFiles(octokit, owner, repo, pull_number) {
  const { data: files } = await octokit.rest.pulls.listFiles({
    owner,
    repo,
    pull_number,
  });
  return files;
}

async function callOpenRouter(apiKey, model, prompt, reasoningEffort = 'medium') {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com',
      'X-Title': 'OpenRouter Reviewer Action',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'system',
          content: `You are a code reviewer analyzing a Pull Request. Provide clear, actionable feedback.

Review guidelines:
- Read the actual code before making claims. Verify by tracing code paths.
- Be concise. No tables, ratings, scores, or emoji.
- Focus on bugs, regressions, security, and breaking changes.
- If unsure, say so. Do not speculate or contradict yourself.
- Do not repeat the same point in different words.
- Skip style/formatting commentary unless explicitly asked.
- Never use filler like "Great work!" or "Outstanding implementation!"

For each issue found: state the file:line, what's wrong, and why it matters in 1-3 sentences.
If there are no real issues, say "LGTM" and nothing else.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      reasoning_effort: reasoningEffort,
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function run() {
  const openRouterApiKey = core.getInput('openrouter_api_key', { required: true });
  const githubToken = core.getInput('github_token', { required: true });
  const botName = core.getInput('bot_name') || '@alfred';
  const model = core.getInput('model') || 'z-ai/glm-5';
  const autoReview = core.getInput('auto_review') === 'true';

  const payload = github.context.payload;
  const eventName = github.context.eventName;

  let commentBody = '';
  let shouldRespond = false;

  // Check if this event contains a mention of the bot (only for non-auto mode)
  if (!autoReview) {
    if (eventName === 'issue_comment') {
      commentBody = payload.comment.body || '';
      shouldRespond = commentBody.toLowerCase().includes(botName.toLowerCase());
    } else if (eventName === 'pull_request_review_comment') {
      commentBody = payload.comment.body || '';
      shouldRespond = commentBody.toLowerCase().includes(botName.toLowerCase());
    } else if (eventName === 'pull_request_review') {
      commentBody = payload.review.body || '';
      shouldRespond = commentBody.toLowerCase().includes(botName.toLowerCase());
    } else if (eventName === 'issues') {
      const issueBody = payload.issue.body || '';
      const issueTitle = payload.issue.title || '';
      shouldRespond =
        issueBody.toLowerCase().includes(botName.toLowerCase()) ||
        issueTitle.toLowerCase().includes(botName.toLowerCase());
    }

    if (!shouldRespond) {
      console.log('Bot mention not found, skipping');
      return;
    }
  }

  const octokit = github.getOctokit(githubToken);
  const { owner, repo } = github.context.repo;

  let prNumber = null;

  // Determine if this is a PR comment or issue
  if (payload.pull_request) {
    prNumber = payload.pull_request.number;
  } else if (payload.issue && payload.issue.pull_request) {
    prNumber = payload.issue.number;
  } else if (payload.comment && payload.comment.pull_request_url) {
    const prUrl = payload.comment.pull_request_url;
    prNumber = parseInt(prUrl.split('/pulls/')[1]);
  }

  if (!prNumber) {
    // Not a PR - might be a general issue or just a mention without PR context
    console.log('No PR context found, skipping');
    return;
  }

  try {
    // Get PR details
    const pr = await getPRDetails(octokit, owner, repo, prNumber);
    const files = await getChangedFiles(octokit, owner, repo, prNumber);
    const diff = await getPRDiff(octokit, owner, repo, prNumber);

    // Build context for the model
    const changedFilesSummary = files
      .map((f) => `**${f.filename}** (+${f.additions} -${f.deletions})`)
      .join('\n');

    const prompt = `## Pull Request: ${pr.title}

**Repository:** ${owner}/${repo}
**PR Number:** #${prNumber}
**Author:** @${pr.user.login}
**Branch:** ${pr.head.ref} → ${pr.base.ref}

### Changed Files (${files.length}):
${changedFilesSummary}

### PR Description:
${pr.body || 'No description provided.'}

### Diff:
${diff}

${autoReview ? 'This is an automatic review triggered on PR open/sync.' : `The user mentioned ${botName} in a comment.`}

Review this PR and provide helpful, actionable feedback.`;

    console.log('Calling OpenRouter API...');
    const review = await callOpenRouter(openRouterApiKey, model, prompt);
    console.log('Received review from OpenRouter');

    // Post the review as a comment
    const modelName = model.includes('/') ? model.split('/')[1] : model;
    const commentBody = `## ${modelName} Review\n\n${review}\n\n---\n*Reviewed by OpenRouter AI*`;

    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: commentBody,
    });
    console.log('Comment posted successfully');
  } catch (error) {
    core.setFailed(`Error: ${error.message}`);
    console.error(error);
  }
}

run();
