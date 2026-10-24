import { DOCS_MCP_URL } from '@/lib/constants/external-links';
import { KeyRound } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { McpClientPicker } from './mcp-client-picker';
import { McpCodeBlock } from './mcp-code-block';
import {
  API_KEYS_SETTINGS_PATH,
  MCP_INSTALL_SNIPPET,
  MCP_OPTIONAL_ENV_VARS,
  MCP_REPO_URL,
  MCP_REQUIRED_ENV_VARS,
  MCP_REQUIREMENTS,
} from './mcp-content';
import { McpDocsLink, McpSectionHeader } from './mcp-section-header';

function SetupStep({
  number,
  title,
  description,
  isLast = false,
  children,
}: {
  number: number;
  title: string;
  description: ReactNode;
  isLast?: boolean;
  children: ReactNode;
}) {
  return (
    <li className='relative md:pl-14'>
      {!isLast && (
        // Timeline rail linking this step's badge to the next one on wider screens.
        <span
          aria-hidden='true'
          className='absolute -bottom-12 left-[15px] top-10 hidden w-px bg-gray-200 dark:bg-neutral-800 md:block'
        />
      )}
      <div className='flex items-center gap-3 md:block'>
        <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold tabular-nums text-white dark:bg-neutral-100 dark:text-neutral-900 md:absolute md:left-0 md:top-0'>
          {number}
        </span>
        <h3 className='text-lg font-semibold text-gray-900 dark:text-neutral-100'>{title}</h3>
      </div>
      <p className='mt-1 text-sm text-gray-600 dark:text-neutral-400'>{description}</p>
      <div className='mt-5'>{children}</div>
    </li>
  );
}

function EnvVarChip({ name, required }: { name: string; required: boolean }) {
  const t = useTranslations('developers.mcp');

  return (
    <li className='flex items-center justify-between gap-3 rounded-xl px-3 py-2 odd:bg-gray-50 dark:odd:bg-neutral-800/60'>
      <code className='truncate font-mono text-xs text-gray-800 dark:text-neutral-200'>{name}</code>
      <span
        className={
          required
            ? 'shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:bg-red-950/50 dark:text-red-400'
            : 'shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-neutral-800 dark:text-neutral-400'
        }
      >
        {required ? t('required') : t('optional')}
      </span>
    </li>
  );
}

export function McpSetupSection() {
  const t = useTranslations('developers.mcp');

  return (
    <section aria-labelledby='mcp-setup-heading'>
      <McpSectionHeader
        id='mcp-setup-heading'
        eyebrow={t('setup.eyebrow')}
        title={t('setup.title')}
        description={t('setup.description')}
        action={
          <div className='flex items-center gap-4'>
            <McpDocsLink href={MCP_REPO_URL}>GitHub</McpDocsLink>
            <McpDocsLink href={DOCS_MCP_URL}>{t('setup.quickstart')}</McpDocsLink>
          </div>
        }
      />

      <ul className='mt-6 flex flex-wrap gap-2' aria-label={t('setup.requirementsLabel')}>
        {MCP_REQUIREMENTS.map((requirement) => (
          <li
            key={requirement}
            className='rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300'
          >
            {t(`setup.requirements.${requirement}`)}
          </li>
        ))}
      </ul>

      <ol className='mt-8 space-y-12'>
        <SetupStep
          number={1}
          title={t('setup.build.title')}
          description={t.rich('setup.build.description', {
            code: (chunks) => <code className='font-mono text-xs'>{chunks}</code>,
          })}
        >
          <div className='grid gap-5 lg:grid-cols-5'>
            <McpCodeBlock
              className='min-w-0 lg:col-span-3'
              code={MCP_INSTALL_SNIPPET}
              language='bash'
              title={t('terminal')}
              copyLabel={t('setup.build.copyLabel')}
            />

            <div className='flex min-w-0 flex-col rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 lg:col-span-2'>
              <h4 className='text-sm font-semibold text-gray-900 dark:text-neutral-100'>
                {t('setup.build.environment')}
              </h4>
              <ul className='mt-3 space-y-1'>
                {MCP_REQUIRED_ENV_VARS.map((name) => (
                  <EnvVarChip key={name} name={name} required />
                ))}
                {MCP_OPTIONAL_ENV_VARS.map((name) => (
                  <EnvVarChip key={name} name={name} required={false} />
                ))}
              </ul>
              <Link
                href={API_KEYS_SETTINGS_PATH}
                className='mt-4 inline-flex items-center gap-2 self-start rounded-full text-sm font-medium text-red-600 transition-colors hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-red-400 dark:hover:text-red-300'
              >
                <KeyRound className='h-4 w-4' aria-hidden='true' />
                {t('createApiKey')}
              </Link>
            </div>
          </div>
        </SetupStep>

        <SetupStep
          number={2}
          title={t('setup.connect.title')}
          description={t('setup.connect.description')}
          isLast
        >
          <McpClientPicker />
        </SetupStep>
      </ol>
    </section>
  );
}
