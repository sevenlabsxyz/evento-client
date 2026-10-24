import { Button } from '@/components/ui/button';
import { DOCS_MCP_OPENCLAW_URL, DOCS_MCP_SKILL_URL } from '@/lib/constants/external-links';
import { ArrowUpRight, Check, FileText, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { McpCodeBlock } from './mcp-code-block';
import { MCP_CLAUDE_SKILL_SNIPPET } from './mcp-content';
import { McpDocsLink } from './mcp-section-header';

/** Keys under `developers.mcp.skill.useCases`. */
const SKILL_USE_CASES = ['listEvents', 'getEvent', 'configure', 'troubleshoot'] as const;

/** Keys under `developers.mcp.skill.nonGoals`. */
const SKILL_NON_GOALS = ['adminRoutes', 'database', 'bypassAuth'] as const;

export function McpSkillCard() {
  const t = useTranslations('developers.mcp');

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
            {t('skill.eyebrow')}
          </p>
          <h2
            id='mcp-skill-heading'
            className='mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-neutral-100'
          >
            {t('skill.title')}
          </h2>
          <p className='mt-2 text-base text-gray-600 dark:text-neutral-400'>
            {t('skill.description')}
          </p>

          <div className='mt-6 grid gap-5 sm:grid-cols-2'>
            <div>
              <h3 className='text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-neutral-500'>
                {t('skill.useItTo')}
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
                    {t(`skill.useCases.${item}`)}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className='text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-neutral-500'>
                {t('skill.notFor')}
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
                    {t(`skill.nonGoals.${item}`)}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className='mt-8 flex flex-wrap items-center gap-x-5 gap-y-3'>
            <Button asChild className='gap-2 rounded-full'>
              <a href={DOCS_MCP_SKILL_URL} target='_blank' rel='noopener noreferrer'>
                {t('skill.getSkill')}
                <ArrowUpRight className='h-4 w-4' aria-hidden='true' />
                <span className='sr-only'>{t('opensInNewTab')}</span>
              </a>
            </Button>
            <McpDocsLink href={DOCS_MCP_OPENCLAW_URL}>{t('skill.useWithOpenClaw')}</McpDocsLink>
          </div>
        </div>

        <div className='flex flex-col justify-center gap-3 border-t border-gray-200 bg-gray-50 p-6 dark:border-neutral-800 dark:bg-neutral-950 md:p-8 lg:border-l lg:border-t-0'>
          <p className='text-sm font-medium text-gray-900 dark:text-neutral-100'>
            {t('skill.installForClaude')}
          </p>
          <McpCodeBlock
            code={MCP_CLAUDE_SKILL_SNIPPET}
            language='bash'
            title={t('terminal')}
            copyLabel={t('skill.copyLabel')}
          />
          <p className='text-xs text-gray-500 dark:text-neutral-500'>
            {t.rich('skill.projectLocal', {
              code: (chunks) => <code className='font-mono'>{chunks}</code>,
            })}
          </p>
        </div>
      </div>
    </section>
  );
}
