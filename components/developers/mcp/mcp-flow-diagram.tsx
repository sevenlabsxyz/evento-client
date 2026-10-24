'use client';

import { DOCS_MCP_ARCHITECTURE_URL } from '@/lib/constants/external-links';
import { cn } from '@/lib/utils';
import { motion, type Transition } from 'framer-motion';
import { Bot, Database, LucideIcon, Server } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { MCP_EXECUTION_STEPS } from './mcp-content';
import { McpDocsLink, McpSectionHeader } from './mcp-section-header';

interface FlowNode {
  icon: LucideIcon;
  /** Kicker, title and detail live under `developers.mcp.flow.nodes.<key>`. */
  key: 'client' | 'server' | 'api';
  highlighted?: boolean;
}

const FLOW_NODES: FlowNode[] = [
  { icon: Bot, key: 'client' },
  { icon: Server, key: 'server', highlighted: true },
  { icon: Database, key: 'api' },
];

/** Keys under `developers.mcp.flow.connectors`. */
const CONNECTOR_LABELS = ['stdio', 'apiRequest'] as const;

const PULSE_TRANSITION: Transition = {
  duration: 2.4,
  ease: 'easeInOut',
  repeat: Infinity,
  repeatDelay: 0.6,
};

/** Pulses are hidden via `motion-reduce:` (CSS) so server and client markup always match. */
function FlowConnector({ label, delay }: { label: string; delay: number }) {
  return (
    <li className='relative flex shrink-0 items-center justify-center py-3 lg:w-28 lg:py-0 xl:w-40'>
      {/* Vertical rail when stacked, horizontal rail from lg up. */}
      <div
        aria-hidden='true'
        className='absolute inset-y-0 left-1/2 border-l-2 border-dashed border-gray-300 dark:border-neutral-700 lg:hidden'
      />
      <div
        aria-hidden='true'
        className='absolute inset-x-0 top-1/2 hidden border-t-2 border-dashed border-gray-300 dark:border-neutral-700 lg:block'
      />

      <span aria-hidden='true' className='absolute inset-0 motion-reduce:hidden'>
        <motion.span
          className='absolute left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.15)] lg:hidden'
          initial={{ top: '0%', opacity: 0 }}
          animate={{ top: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
          transition={{ ...PULSE_TRANSITION, delay }}
        />
        <motion.span
          className='absolute top-1/2 hidden h-2 w-2 -translate-y-1/2 rounded-full bg-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.15)] lg:block'
          initial={{ left: '0%', opacity: 0 }}
          animate={{ left: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
          transition={{ ...PULSE_TRANSITION, delay }}
        />
      </span>

      <span className='relative z-10 rounded-full border border-gray-200 bg-white px-3 py-1 text-center font-mono text-[11px] leading-tight text-gray-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 lg:mx-1 lg:rounded-xl'>
        {label}
      </span>
    </li>
  );
}

function FlowNodeCard({ node }: { node: FlowNode }) {
  const t = useTranslations('developers.mcp.flow.nodes');
  const Icon = node.icon;

  return (
    <li
      className={cn(
        'relative flex flex-1 flex-col rounded-2xl border bg-white p-5 dark:bg-neutral-900',
        node.highlighted
          ? 'border-red-200 shadow-[0_0_0_4px_rgba(239,68,68,0.06)] dark:border-red-900/70 dark:shadow-none'
          : 'border-gray-200 dark:border-neutral-800'
      )}
    >
      <span
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-xl',
          node.highlighted
            ? 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400'
            : 'bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-neutral-300'
        )}
      >
        <Icon className='h-5 w-5' aria-hidden='true' />
      </span>
      <p className='mt-4 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-neutral-500'>
        {t(`${node.key}.kicker`)}
      </p>
      <h3 className='mt-1 text-lg font-semibold text-gray-900 dark:text-neutral-100'>
        {t(`${node.key}.title`)}
      </h3>
      <p className='mt-1.5 text-sm text-gray-600 dark:text-neutral-400'>
        {t(`${node.key}.detail`)}
      </p>
    </li>
  );
}

export function McpFlowDiagram() {
  const t = useTranslations('developers.mcp.flow');

  return (
    <section aria-labelledby='mcp-flow-heading'>
      <McpSectionHeader
        id='mcp-flow-heading'
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
        action={<McpDocsLink href={DOCS_MCP_ARCHITECTURE_URL}>{t('architecture')}</McpDocsLink>}
      />

      <div className='mt-8 rounded-3xl border border-gray-200 bg-gray-50 p-4 dark:border-neutral-800 dark:bg-neutral-950 md:p-6'>
        <ol className='flex flex-col lg:flex-row lg:items-stretch'>
          {FLOW_NODES.map((node, index) => (
            <FlowStep key={node.key} node={node} index={index} />
          ))}
        </ol>

        <div className='mt-6 border-t border-gray-200 pt-6 dark:border-neutral-800'>
          <h3 className='text-sm font-semibold text-gray-900 dark:text-neutral-100'>
            {t('eachCall')}
          </h3>
          <ol className='mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5'>
            {MCP_EXECUTION_STEPS.map((step, index) => (
              <li
                key={step}
                className='flex gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 lg:flex-col'
              >
                <span className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold tabular-nums text-white dark:bg-neutral-100 dark:text-neutral-900'>
                  {index + 1}
                </span>
                {t(`steps.${step}`)}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function FlowStep({ node, index }: { node: FlowNode; index: number }) {
  const t = useTranslations('developers.mcp.flow.connectors');
  const connectorKey = CONNECTOR_LABELS[index - 1];
  const connectorLabel = connectorKey ? t(connectorKey) : undefined;

  return (
    <>
      {connectorLabel && <FlowConnector label={connectorLabel} delay={(index - 1) * 1.2} />}
      <FlowNodeCard node={node} />
    </>
  );
}
