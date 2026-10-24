'use client';

import { cn } from '@/lib/utils';
import { AnimatePresence, motion, MotionConfig, type Transition } from 'framer-motion';
import { Bot, CheckCircle2, User, Wrench } from 'lucide-react';
import { useState } from 'react';

import { MCP_EXAMPLE_PROMPTS, type McpExamplePrompt } from './mcp-content';
import { McpSectionHeader } from './mcp-section-header';

const MESSAGE_TRANSITION: Transition = { duration: 0.25, ease: [0.23, 1, 0.32, 1] };

/** Neutral bars standing in for whatever the API returns, so the mock never invents event data. */
function ResultPlaceholder({ rows }: { rows: number }) {
  return (
    <div aria-hidden='true' className='mt-3 space-y-2'>
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className='flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-2.5 dark:border-neutral-700 dark:bg-neutral-900'
        >
          <div className='h-9 w-9 shrink-0 rounded-lg bg-gray-100 dark:bg-neutral-800' />
          <div className='flex-1 space-y-1.5'>
            <div className='h-2.5 w-2/3 rounded-full bg-gray-200 dark:bg-neutral-700' />
            <div className='h-2 w-1/3 rounded-full bg-gray-100 dark:bg-neutral-800' />
          </div>
        </div>
      ))}
    </div>
  );
}

function ChatTranscript({ example }: { example: McpExamplePrompt }) {
  const rowCount = example.tool === 'get-event' ? 1 : 3;

  return (
    <div className='space-y-4'>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={MESSAGE_TRANSITION}
        className='flex justify-end gap-2'
      >
        <p className='max-w-[85%] rounded-2xl rounded-br-md bg-gray-900 px-4 py-2.5 text-sm text-white dark:bg-neutral-100 dark:text-neutral-900'>
          {example.prompt}
        </p>
        <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600 dark:bg-neutral-700 dark:text-neutral-300'>
          <User className='h-4 w-4' aria-hidden='true' />
          <span className='sr-only'>You</span>
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...MESSAGE_TRANSITION, delay: 0.15 }}
        className='flex gap-2'
      >
        <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400'>
          <Bot className='h-4 w-4' aria-hidden='true' />
          <span className='sr-only'>Agent</span>
        </span>
        <div className='min-w-0 flex-1 space-y-3'>
          <div className='overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-neutral-700 dark:bg-neutral-900'>
            <div className='flex items-center justify-between gap-3 border-b border-gray-100 px-3 py-2 dark:border-neutral-800'>
              <span className='flex min-w-0 items-center gap-2 text-xs font-medium text-gray-700 dark:text-neutral-300'>
                <Wrench className='h-3.5 w-3.5 shrink-0' aria-hidden='true' />
                <span className='truncate'>
                  Called <code className='font-mono'>{example.tool}</code>
                </span>
              </span>
              <span className='flex shrink-0 items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400'>
                <CheckCircle2 className='h-3.5 w-3.5' aria-hidden='true' />
                evento-public
              </span>
            </div>
            <pre className='overflow-x-auto bg-gray-50 px-3 py-2.5 font-mono text-xs leading-relaxed text-gray-700 dark:bg-neutral-950 dark:text-neutral-300'>
              {JSON.stringify(example.args, null, 2)}
            </pre>
            <p className='truncate border-t border-gray-100 px-3 py-2 font-mono text-[11px] text-gray-500 dark:border-neutral-800 dark:text-neutral-500'>
              → {example.route}
            </p>
          </div>

          <div className='rounded-2xl rounded-tl-md bg-gray-100 px-4 py-3 text-sm text-gray-800 dark:bg-neutral-800 dark:text-neutral-200'>
            {example.reply}
            <ResultPlaceholder rows={rowCount} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function McpExampleChat() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const example = MCP_EXAMPLE_PROMPTS[selectedIndex];

  return (
    <section aria-labelledby='mcp-examples-heading'>
      <McpSectionHeader
        id='mcp-examples-heading'
        eyebrow='In practice'
        title='Ask in plain language'
        description='Your agent picks the right tool and fills in its inputs from what you ask.'
      />

      <div className='mt-8 grid gap-6 lg:grid-cols-5 lg:items-start'>
        <div className='lg:col-span-2'>
          <p
            id='mcp-example-prompts-label'
            className='text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-neutral-500'
          >
            Try a prompt
          </p>
          <div
            role='group'
            aria-labelledby='mcp-example-prompts-label'
            className='mt-3 flex flex-col gap-2'
          >
            {MCP_EXAMPLE_PROMPTS.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.prompt}
                  type='button'
                  aria-pressed={isSelected}
                  onClick={() => setSelectedIndex(index)}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500',
                    isSelected
                      ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-700 dark:hover:bg-neutral-800'
                  )}
                >
                  <span>“{item.prompt}”</span>
                  <code
                    className={cn(
                      'shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[11px]',
                      isSelected
                        ? 'bg-white/70 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                        : 'bg-gray-100 text-gray-500 dark:bg-neutral-800 dark:text-neutral-400'
                    )}
                  >
                    {item.tool}
                  </code>
                </button>
              );
            })}
          </div>
        </div>

        <figure className='overflow-hidden rounded-3xl border border-gray-200 bg-gray-50 dark:border-neutral-800 dark:bg-neutral-950 lg:col-span-3'>
          <div className='flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900'>
            <span className='flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-neutral-100'>
              <span className='h-2 w-2 rounded-full bg-emerald-500' aria-hidden='true' />
              Your agent
            </span>
            <span className='rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-neutral-800 dark:text-neutral-400'>
              Illustrative
            </span>
          </div>
          <div className='min-h-[340px] p-4 md:p-6' aria-live='polite'>
            <MotionConfig reducedMotion='user'>
              <AnimatePresence mode='wait' initial={false}>
                <motion.div
                  key={example.prompt}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                >
                  <ChatTranscript example={example} />
                </motion.div>
              </AnimatePresence>
            </MotionConfig>
          </div>
          <figcaption className='border-t border-gray-200 px-4 py-3 text-xs text-gray-500 dark:border-neutral-800 dark:text-neutral-500'>
            Example conversation. Real answers are built from the event data the Evento API returns.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
