/**
 * Copy for the /e/mcp page. Every fact, command and snippet here mirrors the Evento MCP docs
 * (docs.evento.so/ai/*); update both together.
 */

import { DOCS_MCP_CLIENT_CONFIG_URL, DOCS_MCP_OPENCLAW_URL } from '@/lib/constants/external-links';
import { KeyRound, LucideIcon, PlugZap, ServerCrash } from 'lucide-react';

/** In-app page where developers create the API key the server needs. */
export const API_KEYS_SETTINGS_PATH = '/e/settings/api-keys';

export const MCP_REQUIRED_ENV_VARS = ['PUBLIC_API_KEY'] as const;

export const MCP_OPTIONAL_ENV_VARS = [
  'EVENTO_API_BASE_URL',
  'EVENTO_API_TIMEOUT_MS',
  'EVENTO_API_RETRY_ATTEMPTS',
  'EVENTO_API_RETRY_DELAY_MS',
  'EVENTO_SMOKE_USERNAME',
] as const;

// The docs still reference a personal fork URL that 404s; this is the public repo.
export const MCP_REPO_URL = 'https://github.com/sevenlabsxyz/evento-public-mcp';

export const MCP_INSTALL_SNIPPET = `git clone ${MCP_REPO_URL}.git
cd evento-public-mcp
npm install
npm run build
cp .env.example .env`;

export const MCP_CLIENT_CONFIG_SNIPPET = `{
  "mcpServers": {
    "evento-public": {
      "command": "node",
      "args": ["/absolute/path/to/evento-public-mcp/dist/index.js"],
      "env": {
        "PUBLIC_API_KEY": "your-evento-api-key",
        "EVENTO_API_BASE_URL": "https://evento.so"
      }
    }
  }
}`;

export const MCP_CLAUDE_SKILL_SNIPPET = `mkdir -p ~/.claude/skills/evento-public-mcp
cp /absolute/path/to/evento-public-mcp/SKILL.md ~/.claude/skills/evento-public-mcp/SKILL.md`;

export const MCP_OPENCLAW_SKILL_SNIPPET = `mkdir -p ~/.openclaw/workspace/skills/evento-public-mcp
cp /absolute/path/to/evento-public-mcp/SKILL.md ~/.openclaw/workspace/skills/evento-public-mcp/SKILL.md`;

export const MCP_TEST_SNIPPET = `npm test
npm run verify
EVENTO_SMOKE_USERNAME=your-username npm run smoke`;

export const MCP_REQUIREMENTS = [
  'Node.js 18+',
  'npm',
  'Evento developer API key',
  'Any MCP client that supports stdio',
] as const;

export type McpClientId = 'claude-desktop' | 'cursor' | 'other' | 'openclaw';

export interface McpClientGuide {
  id: McpClientId;
  label: string;
  /** Where the snippet goes, shown in the code panel header. */
  target: string;
  language: 'json' | 'bash';
  snippet: string;
  /** Names the snippet in the copy button label and toast. */
  copyLabel: string;
  steps: string[];
  docsHref: string;
  docsLabel: string;
}

export const MCP_CONFIG_BEST_PRACTICES = [
  'Use an absolute path in args',
  'Keep PUBLIC_API_KEY in client-local env config',
  'Restart the client after config changes',
] as const;

export const MCP_CLIENT_GUIDES: McpClientGuide[] = [
  {
    id: 'claude-desktop',
    label: 'Claude Desktop',
    target: 'claude_desktop_config.json',
    language: 'json',
    snippet: MCP_CLIENT_CONFIG_SNIPPET,
    copyLabel: 'Claude Desktop config',
    steps: [
      'Add the server block to claude_desktop_config.json.',
      'Point args at the absolute path of dist/index.js and set PUBLIC_API_KEY.',
      'Save, then restart Claude Desktop.',
    ],
    docsHref: DOCS_MCP_CLIENT_CONFIG_URL,
    docsLabel: 'Client configuration docs',
  },
  {
    id: 'cursor',
    label: 'Cursor',
    target: 'Cursor MCP settings',
    language: 'json',
    snippet: MCP_CLIENT_CONFIG_SNIPPET,
    copyLabel: 'Cursor config',
    steps: [
      'Add the same server block in Cursor’s MCP settings.',
      'Point args at the absolute path of dist/index.js and set PUBLIC_API_KEY.',
      'Restart Cursor.',
    ],
    docsHref: DOCS_MCP_CLIENT_CONFIG_URL,
    docsLabel: 'Client configuration docs',
  },
  {
    id: 'other',
    label: 'Other MCP clients',
    target: 'stdio server config',
    language: 'json',
    snippet: MCP_CLIENT_CONFIG_SNIPPET,
    copyLabel: 'MCP server config',
    steps: [
      'Find where your client configures stdio MCP servers.',
      'Use the same command, args, and env fields shown here.',
      'Restart the client after config changes.',
    ],
    docsHref: DOCS_MCP_CLIENT_CONFIG_URL,
    docsLabel: 'Client configuration docs',
  },
  {
    id: 'openclaw',
    label: 'OpenClaw',
    target: 'Terminal',
    language: 'bash',
    snippet: MCP_OPENCLAW_SKILL_SNIPPET,
    copyLabel: 'OpenClaw install commands',
    steps: [
      'OpenClaw reuses the Evento SKILL.md from its skills workspace.',
      'Create the skill folder and copy SKILL.md into it.',
      'If OpenClaw is already running, restart your session or gateway to pick it up.',
    ],
    docsHref: DOCS_MCP_OPENCLAW_URL,
    docsLabel: 'Add to OpenClaw guide',
  },
];

export interface McpToolInput {
  name: string;
  type: string;
  required: boolean;
}

export interface McpTool {
  name: 'list-events' | 'get-event';
  description: string;
  route: string;
  inputs: McpToolInput[];
}

export const MCP_TOOLS: McpTool[] = [
  {
    name: 'list-events',
    description: 'Lists events for a user.',
    route: 'GET /public/v1/users/{username}/events',
    inputs: [
      { name: 'username', type: 'string', required: true },
      { name: 'type', type: 'upcoming | past | profile', required: false },
      { name: 'limit', type: 'number', required: false },
    ],
  },
  {
    name: 'get-event',
    description: 'Fetches event details by ID.',
    route: 'GET /public/v1/events/{eventId}',
    inputs: [{ name: 'eventId', type: 'string', required: true }],
  },
];

export interface McpExamplePrompt {
  prompt: string;
  tool: McpTool['name'];
  args: Record<string, string>;
  route: string;
  /** Illustrative agent lead-in; the page never invents the returned event data. */
  reply: string;
}

/** Prompts are the documented examples; args show how each maps onto the tool's inputs. */
export const MCP_EXAMPLE_PROMPTS: McpExamplePrompt[] = [
  {
    prompt: 'Show events for satoshi',
    tool: 'list-events',
    args: { username: 'satoshi' },
    route: 'GET /public/v1/users/satoshi/events',
    reply: 'Here are the events I found for satoshi:',
  },
  {
    prompt: 'List my upcoming events',
    tool: 'list-events',
    args: { username: 'your-username', type: 'upcoming' },
    route: 'GET /public/v1/users/your-username/events',
    reply: 'Here’s what’s coming up for you:',
  },
  {
    prompt: 'Get event evt_abc123',
    tool: 'get-event',
    args: { eventId: 'evt_abc123' },
    route: 'GET /public/v1/events/evt_abc123',
    reply: 'Here are the details for evt_abc123:',
  },
];

export const MCP_EXECUTION_STEPS = [
  'Your client calls tools/list and the server returns the Evento tools.',
  'Your client calls tools/call with a tool name and arguments.',
  'The executor validates the arguments and fills in the route placeholders.',
  'It sends an authenticated API request with a timeout and retry policy.',
  'The success or error payload is normalized back into an MCP response.',
] as const;

export interface McpTroubleshootingItem {
  icon: LucideIcon;
  title: string;
  fix: string;
}

export const MCP_TROUBLESHOOTING: McpTroubleshootingItem[] = [
  {
    icon: KeyRound,
    title: 'Missing API key',
    fix: 'Set PUBLIC_API_KEY in the MCP client’s env block.',
  },
  {
    icon: PlugZap,
    title: 'Tools not visible',
    fix: 'Run npm run build, confirm dist/index.js exists, use an absolute path in args, then restart the client.',
  },
  {
    icon: ServerCrash,
    title: 'API errors',
    fix: 'Check the key’s scope and EVENTO_API_BASE_URL, then run the smoke check with a known username.',
  },
];

export const MCP_RELIABILITY_NOTES = [
  'Retries 408, 429 and 5xx responses',
  'Retries timeouts, DNS failures and connection resets',
  'Failed calls return isError: true with a structured payload',
  'No database access and no persistence in the MCP layer',
] as const;

export const MCP_SECURITY_NOTES = [
  'Keep API keys in local env config, never in source control',
  'Rotate keys periodically',
  'Monitor usage against rate limits',
] as const;
