'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check } from 'lucide-react';

import { McpCodeBlock } from './mcp-code-block';
import { MCP_CLIENT_GUIDES, MCP_CONFIG_BEST_PRACTICES, type McpClientId } from './mcp-content';
import { McpDocsLink } from './mcp-section-header';

const DEFAULT_CLIENT: McpClientId = 'claude-desktop';

export function McpClientPicker() {
  return (
    <Tabs defaultValue={DEFAULT_CLIENT}>
      <div className='scrollbar-hide -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0'>
        <TabsList
          aria-label='Choose your MCP client'
          className='h-auto w-fit gap-1 rounded-full border border-gray-200 bg-white p-1 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none'
        >
          {MCP_CLIENT_GUIDES.map((guide) => (
            <TabsTrigger
              key={guide.id}
              value={guide.id}
              className='rounded-full px-4 py-2 text-gray-500 transition-colors duration-200 hover:text-gray-900 focus-visible:ring-red-500 data-[state=active]:bg-gray-100 data-[state=active]:text-red-600 data-[state=active]:shadow-none dark:text-neutral-400 dark:hover:text-neutral-100 dark:data-[state=active]:bg-neutral-800 dark:data-[state=active]:text-red-400'
            >
              {guide.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {MCP_CLIENT_GUIDES.map((guide) => (
        <TabsContent
          key={guide.id}
          value={guide.id}
          className='mt-5 rounded-2xl focus-visible:ring-red-500 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-900'
        >
          <div className='grid gap-5 lg:grid-cols-5'>
            <div className='min-w-0 lg:col-span-2'>
              <ol className='space-y-3'>
                {guide.steps.map((step, index) => (
                  <li key={step} className='flex gap-3 text-sm text-gray-600 dark:text-neutral-400'>
                    <span className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-xs font-semibold tabular-nums text-gray-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'>
                      {index + 1}
                    </span>
                    <span className='pt-0.5'>{step}</span>
                  </li>
                ))}
              </ol>

              {guide.language === 'json' && (
                <ul className='mt-5 space-y-2 rounded-2xl border border-gray-200 bg-white p-4 text-sm dark:border-neutral-800 dark:bg-neutral-900'>
                  {MCP_CONFIG_BEST_PRACTICES.map((tip) => (
                    <li
                      key={tip}
                      className='flex items-start gap-2 text-gray-600 dark:text-neutral-400'
                    >
                      <Check
                        className='mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400'
                        aria-hidden='true'
                      />
                      {tip}
                    </li>
                  ))}
                </ul>
              )}

              <div className='mt-5'>
                <McpDocsLink href={guide.docsHref}>{guide.docsLabel}</McpDocsLink>
              </div>
            </div>

            <McpCodeBlock
              className='min-w-0 lg:col-span-3'
              code={guide.snippet}
              language={guide.language}
              title={guide.target}
              copyLabel={guide.copyLabel}
            />
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
