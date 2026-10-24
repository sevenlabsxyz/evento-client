import { DOCS_API_URL, DOCS_MCP_URL } from '@/lib/constants/external-links';
import { Bot, Code2, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function BuildWithEventoCard() {
  return (
    <section className='rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'>
      <div className='flex items-start gap-3'>
        <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-neutral-300'>
          <Code2 className='h-4 w-4' />
        </div>
        <div className='min-w-0'>
          <h2 className='text-sm font-semibold text-gray-900 dark:text-neutral-100'>
            Build with Evento
          </h2>
          <p className='mt-0.5 text-xs text-gray-500 dark:text-neutral-400'>
            Public API, embeds, and an MCP server for AI agents.
          </p>
        </div>
      </div>

      <div className='mt-3 grid grid-cols-2 gap-2'>
        <Button asChild variant='outline' size='sm' className='w-full gap-1.5 text-xs'>
          <a href={DOCS_API_URL} target='_blank' rel='noopener noreferrer'>
            <Code2 className='h-3.5 w-3.5' />
            API docs
            <ExternalLink className='h-3 w-3 text-gray-400 dark:text-neutral-500' />
          </a>
        </Button>
        <Button asChild variant='outline' size='sm' className='w-full gap-1.5 text-xs'>
          <a href={DOCS_MCP_URL} target='_blank' rel='noopener noreferrer'>
            <Bot className='h-3.5 w-3.5' />
            MCP setup
            <ExternalLink className='h-3 w-3 text-gray-400 dark:text-neutral-500' />
          </a>
        </Button>
      </div>
    </section>
  );
}
