import { Button } from '@/components/ui/button';
import { DOCS_MCP_URL } from '@/lib/constants/external-links';
import { ArrowUpRight, KeyRound } from 'lucide-react';
import Link from 'next/link';

import { API_KEYS_SETTINGS_PATH } from './mcp-content';

export function McpCtaBand() {
  return (
    <section
      aria-labelledby='mcp-cta-heading'
      className='relative isolate overflow-hidden rounded-3xl bg-gray-900 px-6 py-12 text-center dark:border dark:border-neutral-800 dark:bg-neutral-950 md:px-12 md:py-16'
    >
      <div
        aria-hidden='true'
        className='absolute inset-0 -z-10 text-white/10 [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]'
      />
      <div
        aria-hidden='true'
        className='absolute left-1/2 top-0 -z-10 h-64 w-[36rem] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/25 blur-3xl'
      />

      <h2
        id='mcp-cta-heading'
        className='mx-auto max-w-2xl text-balance text-3xl font-bold tracking-tight text-white md:text-4xl'
      >
        Give your agent your events
      </h2>
      <p className='mx-auto mt-3 max-w-xl text-base text-neutral-400'>
        Grab an API key, build the server, and look up Evento events right from your agent.
      </p>

      <div className='mt-8 flex flex-wrap items-center justify-center gap-3'>
        <Button
          asChild
          size='lg'
          className='gap-2 bg-white px-6 text-gray-900 hover:bg-gray-100 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100'
        >
          <a href={DOCS_MCP_URL} target='_blank' rel='noopener noreferrer'>
            Setup guide
            <ArrowUpRight className='h-4 w-4' aria-hidden='true' />
            <span className='sr-only'>(opens in a new tab)</span>
          </a>
        </Button>
        <Button
          asChild
          size='lg'
          variant='outline'
          className='gap-2 border-white/20 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white dark:border-white/20'
        >
          <Link href={API_KEYS_SETTINGS_PATH}>
            <KeyRound className='h-4 w-4' aria-hidden='true' />
            Create an API key
          </Link>
        </Button>
      </div>
    </section>
  );
}
