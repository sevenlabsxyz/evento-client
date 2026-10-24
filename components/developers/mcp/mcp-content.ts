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

/** Keys under `developers.mcp.setup.requirements`. */
export const MCP_REQUIREMENTS = ['node', 'npm', 'apiKey', 'stdioClient'] as const;

export type McpClientId = 'claude-desktop' | 'cursor' | 'other' | 'openclaw';

/** Keys under `developers.mcp.clients`. */
export type McpClientMessageKey = 'claudeDesktop' | 'cursor' | 'other' | 'openclaw';

export interface McpClientGuide {
  id: McpClientId;
  /** Label, snippet target, copy label, steps and docs label live under `developers.mcp.clients.<messageKey>`. */
  messageKey: McpClientMessageKey;
  language: 'json' | 'bash';
  snippet: string;
  docsHref: string;
}

/** Keys under `developers.mcp.clients.steps`. */
export const MCP_CLIENT_STEP_KEYS = ['s1', 's2', 's3'] as const;

/** Keys under `developers.mcp.clients.bestPractices`. */
export const MCP_CONFIG_BEST_PRACTICES = ['absolutePath', 'localEnv', 'restart'] as const;

export const MCP_CLIENT_GUIDES: McpClientGuide[] = [
  {
    id: 'claude-desktop',
    messageKey: 'claudeDesktop',
    language: 'json',
    snippet: MCP_CLIENT_CONFIG_SNIPPET,
    docsHref: DOCS_MCP_CLIENT_CONFIG_URL,
  },
  {
    id: 'cursor',
    messageKey: 'cursor',
    language: 'json',
    snippet: MCP_CLIENT_CONFIG_SNIPPET,
    docsHref: DOCS_MCP_CLIENT_CONFIG_URL,
  },
  {
    id: 'other',
    messageKey: 'other',
    language: 'json',
    snippet: MCP_CLIENT_CONFIG_SNIPPET,
    docsHref: DOCS_MCP_CLIENT_CONFIG_URL,
  },
  {
    id: 'openclaw',
    messageKey: 'openclaw',
    language: 'bash',
    snippet: MCP_OPENCLAW_SKILL_SNIPPET,
    docsHref: DOCS_MCP_OPENCLAW_URL,
  },
];

export interface McpToolInput {
  name: string;
  type: string;
  required: boolean;
}

export interface McpTool {
  name: 'list-events' | 'get-event';
  /** Description lives under `developers.mcp.tools.descriptions.<messageKey>`. */
  messageKey: 'listEvents' | 'getEvent';
  route: string;
  inputs: McpToolInput[];
}

export const MCP_TOOLS: McpTool[] = [
  {
    name: 'list-events',
    messageKey: 'listEvents',
    route: 'GET /public/v1/users/{username}/events',
    inputs: [
      { name: 'username', type: 'string', required: true },
      { name: 'type', type: 'upcoming | past | profile', required: false },
      { name: 'limit', type: 'number', required: false },
    ],
  },
  {
    name: 'get-event',
    messageKey: 'getEvent',
    route: 'GET /public/v1/events/{eventId}',
    inputs: [{ name: 'eventId', type: 'string', required: true }],
  },
];

export interface McpExamplePrompt {
  /** Prompt and illustrative agent reply live under `developers.mcp.examples.prompts.<messageKey>`; the page never invents the returned event data. */
  messageKey: 'userEvents' | 'myUpcoming' | 'getEvent';
  tool: McpTool['name'];
  args: Record<string, string>;
  route: string;
}

/** Prompts are the documented examples; args show how each maps onto the tool's inputs. */
export const MCP_EXAMPLE_PROMPTS: McpExamplePrompt[] = [
  {
    messageKey: 'userEvents',
    tool: 'list-events',
    args: { username: 'satoshi' },
    route: 'GET /public/v1/users/satoshi/events',
  },
  {
    messageKey: 'myUpcoming',
    tool: 'list-events',
    args: { username: 'your-username', type: 'upcoming' },
    route: 'GET /public/v1/users/your-username/events',
  },
  {
    messageKey: 'getEvent',
    tool: 'get-event',
    args: { eventId: 'evt_abc123' },
    route: 'GET /public/v1/events/evt_abc123',
  },
];

/** Keys under `developers.mcp.flow.steps`. */
export const MCP_EXECUTION_STEPS = ['list', 'call', 'validate', 'request', 'normalize'] as const;

export interface McpTroubleshootingItem {
  icon: LucideIcon;
  /** Title and fix live under `developers.mcp.troubleshooting.items.<messageKey>`. */
  messageKey: 'missingKey' | 'toolsHidden' | 'apiErrors';
}

export const MCP_TROUBLESHOOTING: McpTroubleshootingItem[] = [
  { icon: KeyRound, messageKey: 'missingKey' },
  { icon: PlugZap, messageKey: 'toolsHidden' },
  { icon: ServerCrash, messageKey: 'apiErrors' },
];

/** Keys under `developers.mcp.troubleshooting.reliability.items`. */
export const MCP_RELIABILITY_NOTES = [
  'statusRetries',
  'networkRetries',
  'isError',
  'noPersistence',
] as const;

/** Keys under `developers.mcp.troubleshooting.security.items`. */
export const MCP_SECURITY_NOTES = ['localEnv', 'rotate', 'monitor'] as const;
