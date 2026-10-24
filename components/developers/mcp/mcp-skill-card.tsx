import { Button } from '@/components/ui/button';
import { DOCS_MCP_OPENCLAW_URL, DOCS_MCP_SKILL_URL } from '@/lib/constants/external-links';
import { ArrowUpRight, Check, FileText, X } from 'lucide-react';

import { McpCodeBlock } from './mcp-code-block';
import { MCP_CLAUDE_SKILL_SNIPPET } from './mcp-content';
import { McpDocsLink } from './mcp-section-header';

const SKILL_USE_CASES = [
  'List events for a username',
  'Get event details from an evt_* ID',
  'Configure MCP client settings for Evento',
  'Troubleshoot missing tools or auth failures',
] as const;

const SKILL_NON_GOALS = [
  'Admin-only API routes',
  'Direct database access',
  'Bypassing API key authentication',
] as const;

export function McpSkillCard() {
  return (
    <section
      aria-labelledby='mcp-skill-heading'
      className='overflow-hidden rounded-3xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
    >
      <div className='grid lg:grid-cols-2'>
        <div className='p-6 md:p-8'>
          <span className='flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-neutral-300'>
            <FileText className='h-5 w-5' aria-hidden='true' />
          </span>
          <p className='mt-5 text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400'>
            Agent skill
          </p>
          <h2
            id='mcp-skill-heading'
            className='mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-neutral-100'
          >
            Teach your agent with SKILL.md
          </h2>
          <p className='mt-2 text-base text-gray-600 dark:text-neutral-400'>
            A maintained skill file tells your agent when to reach for the Evento tools and how to
            use them safely.
          </p>

          <div className='mt-6 grid gap-5 sm:grid-cols-2'>
            <div>
              <h3 className='text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-neutral-500'>
                Use it to
              </h3>
              <ul className='mt-2 space-y-2'>
                {SKILL_USE_CASES.map((item) => (
                  <li
                    key={item}
                    className='flex items-start gap-2 text-sm text-gray-700 dark:text-neutral-300'
                  >
                    <Check
                      className='mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400'
                      aria-hidden='true'
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className='text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-neutral-500'>
                Not for
              </h3>
              <ul className='mt-2 space-y-2'>
                {SKILL_NON_GOALS.map((item) => (
                  <li
                    key={item}
                    className='flex items-start gap-2 text-sm text-gray-700 dark:text-neutral-300'
                  >
                    <X
                      className='mt-0.5 h-4 w-4 shrink-0 text-gray-400 dark:text-neutral-500'
                      aria-hidden='true'
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className='mt-8 flex flex-wrap items-center gap-x-5 gap-y-3'>
            <Button asChild className='gap-2 rounded-full'>
              <a href={DOCS_MCP_SKILL_URL} target='_blank' rel='noopener noreferrer'>
                Get the skill
                <ArrowUpRight className='h-4 w-4' aria-hidden='true' />
                <span className='sr-only'>(opens in a new tab)</span>
              </a>
            </Button>
            <McpDocsLink href={DOCS_MCP_OPENCLAW_URL}>Use it with OpenClaw</McpDocsLink>
          </div>
        </div>

        <div className='flex flex-col justify-center gap-3 border-t border-gray-200 bg-gray-50 p-6 dark:border-neutral-800 dark:bg-neutral-950 md:p-8 lg:border-l lg:border-t-0'>
          <p className='text-sm font-medium text-gray-900 dark:text-neutral-100'>
            Install for Claude
          </p>
          <McpCodeBlock
            code={MCP_CLAUDE_SKILL_SNIPPET}
            language='bash'
            title='Terminal'
            copyLabel='Skill install commands'
          />
          <p className='text-xs text-gray-500 dark:text-neutral-500'>
            Using project-local skills? Copy it to{' '}
            <code className='font-mono'>.claude/skills/evento-public-mcp/SKILL.md</code> instead.
          </p>
        </div>
      </div>
    </section>
  );
}
