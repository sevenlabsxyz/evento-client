import { DOCS_MCP_TOOLS_URL } from '@/lib/constants/external-links';
import { CalendarDays, CalendarSearch, LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { MCP_TOOLS, type McpTool } from './mcp-content';
import { McpDocsLink, McpSectionHeader } from './mcp-section-header';

const TOOL_ICONS: Record<McpTool['name'], LucideIcon> = {
  'list-events': CalendarSearch,
  'get-event': CalendarDays,
};

function ToolCard({ tool }: { tool: McpTool }) {
  const t = useTranslations('developers.mcp');
  const Icon = TOOL_ICONS[tool.name];
  const [method, ...pathParts] = tool.route.split(' ');

  return (
    <article className='flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 transition-colors duration-200 hover:border-gray-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700 md:p-6'>
      <div className='flex items-start gap-4'>
        <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400'>
          <Icon className='h-5 w-5' aria-hidden='true' />
        </span>
        <div className='min-w-0'>
          <h3 className='font-mono text-lg font-semibold text-gray-900 dark:text-neutral-100'>
            {tool.name}
          </h3>
          <p className='mt-0.5 text-sm text-gray-600 dark:text-neutral-400'>
            {t(`tools.descriptions.${tool.messageKey}`)}
          </p>
        </div>
      </div>

      <div className='mt-5 flex min-w-0 items-center gap-2 overflow-hidden rounded-xl bg-gray-50 px-3 py-2 dark:bg-neutral-800'>
        <span className='shrink-0 rounded-md bg-emerald-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'>
          {method}
        </span>
        <code className='truncate font-mono text-xs text-gray-700 dark:text-neutral-300'>
          {pathParts.join(' ')}
        </code>
      </div>

      <h4 className='mt-5 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-neutral-500'>
        {t('tools.inputs')}
      </h4>
      <dl className='mt-2 divide-y divide-gray-100 dark:divide-neutral-800'>
        {tool.inputs.map((input) => (
          <div key={input.name} className='flex items-center justify-between gap-3 py-2.5'>
            <dt className='min-w-0'>
              <code className='font-mono text-sm font-medium text-gray-900 dark:text-neutral-100'>
                {input.name}
              </code>
              <span className='ml-2 font-mono text-xs text-gray-500 dark:text-neutral-500'>
                {input.type}
              </span>
            </dt>
            <dd
              className={
                input.required
                  ? 'shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:bg-red-950/50 dark:text-red-400'
                  : 'shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-neutral-800 dark:text-neutral-400'
              }
            >
              {input.required ? t('required') : t('optional')}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

export function McpToolsGrid() {
  const t = useTranslations('developers.mcp.tools');

  return (
    <section id='tools' aria-labelledby='mcp-tools-heading' className='scroll-mt-6'>
      <McpSectionHeader
        id='mcp-tools-heading'
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
        action={<McpDocsLink href={DOCS_MCP_TOOLS_URL}>{t('reference')}</McpDocsLink>}
      />
      <ul className='mt-8 grid gap-5 md:grid-cols-2'>
        {MCP_TOOLS.map((tool) => (
          <li key={tool.name}>
            <ToolCard tool={tool} />
          </li>
        ))}
      </ul>
    </section>
  );
}
