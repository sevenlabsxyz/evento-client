import { DOCS_MCP_TROUBLESHOOTING_URL } from '@/lib/constants/external-links';
import { LucideIcon, RefreshCw, ShieldCheck } from 'lucide-react';

import { McpCodeBlock } from './mcp-code-block';
import {
  MCP_RELIABILITY_NOTES,
  MCP_SECURITY_NOTES,
  MCP_TEST_SNIPPET,
  MCP_TROUBLESHOOTING,
} from './mcp-content';
import { McpDocsLink, McpSectionHeader } from './mcp-section-header';

function NoteList({
  icon: Icon,
  title,
  items,
}: {
  icon: LucideIcon;
  title: string;
  items: readonly string[];
}) {
  return (
    <div className='rounded-2xl border border-gray-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900'>
      <h3 className='flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-neutral-100'>
        <Icon className='h-4 w-4 text-gray-500 dark:text-neutral-400' aria-hidden='true' />
        {title}
      </h3>
      <ul className='mt-3 space-y-2'>
        {items.map((item) => (
          <li key={item} className='flex gap-2 text-sm text-gray-600 dark:text-neutral-400'>
            <span
              className='mt-2 h-1 w-1 shrink-0 rounded-full bg-gray-400 dark:bg-neutral-500'
              aria-hidden='true'
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function McpTroubleshooting() {
  return (
    <section aria-labelledby='mcp-troubleshooting-heading'>
      <McpSectionHeader
        id='mcp-troubleshooting-heading'
        eyebrow='Troubleshooting'
        title='If something’s off'
        description='The common fixes, plus how the server behaves when requests fail.'
        action={
          <McpDocsLink href={DOCS_MCP_TROUBLESHOOTING_URL}>Testing & troubleshooting</McpDocsLink>
        }
      />

      <ul className='mt-8 grid gap-4 md:grid-cols-3'>
        {MCP_TROUBLESHOOTING.map(({ icon: Icon, title, fix }) => (
          <li
            key={title}
            className='rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-neutral-800 dark:bg-neutral-800/50'
          >
            <span className='flex h-9 w-9 items-center justify-center rounded-xl bg-white text-gray-700 shadow-sm dark:bg-neutral-800 dark:text-neutral-300 dark:shadow-none'>
              <Icon className='h-4 w-4' aria-hidden='true' />
            </span>
            <h3 className='mt-4 text-sm font-semibold text-gray-900 dark:text-neutral-100'>
              {title}
            </h3>
            <p className='mt-1 text-sm text-gray-600 dark:text-neutral-400'>{fix}</p>
          </li>
        ))}
      </ul>

      <div className='mt-4 grid gap-4 lg:grid-cols-3'>
        <NoteList icon={RefreshCw} title='Retries and errors' items={MCP_RELIABILITY_NOTES} />
        <NoteList icon={ShieldCheck} title='Keep your key safe' items={MCP_SECURITY_NOTES} />
        <div className='flex min-w-0 flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900'>
          <h3 className='text-sm font-semibold text-gray-900 dark:text-neutral-100'>
            Verify your setup
          </h3>
          <McpCodeBlock
            code={MCP_TEST_SNIPPET}
            language='bash'
            title='Terminal'
            copyLabel='Test commands'
          />
        </div>
      </div>
    </section>
  );
}
