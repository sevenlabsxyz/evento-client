import { Button } from '@/components/ui/button';
import { DOCS_MCP_URL } from '@/lib/constants/external-links';
import { ArrowDown, ArrowUpRight, KeyRound, Laptop, Plug, Wrench } from 'lucide-react';

const HIGHLIGHTS = [
  { icon: Laptop, label: 'Runs locally over stdio' },
  { icon: KeyRound, label: 'Your API key on every request' },
  { icon: Wrench, label: '2 public tools' },
  { icon: Plug, label: 'Works with any stdio MCP client' },
] as const;

export function McpHero() {
  return (
    <header className='relative isolate overflow-hidden rounded-3xl border border-gray-200 bg-gray-50 px-5 py-10 dark:border-neutral-800 dark:bg-neutral-950 md:px-12 md:py-16'>
      {/* Dot grid + soft red glow; decorative only. */}
      <div
        aria-hidden='true'
        className='absolute inset-0 -z-10 text-gray-300 [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:20px_20px] [mask-image:linear-gradient(to_bottom,black,transparent)] dark:text-neutral-800'
      />
      <div
        aria-hidden='true'
        className='absolute -right-24 -top-24 -z-10 h-72 w-72 rounded-full bg-red-500/10 blur-3xl dark:bg-red-500/15'
      />

      <div className='max-w-3xl'>
        <p className='inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-600 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400'>
          <span className='h-1.5 w-1.5 rounded-full bg-red-500' aria-hidden='true' />
          MCP
        </p>
        <h1 className='mt-4 text-balance text-4xl font-bold tracking-tight text-gray-900 dark:text-neutral-100 md:text-5xl'>
          Connect Evento to your favorite agent
        </h1>
        <p className='mt-4 max-w-2xl text-pretty text-base text-gray-600 dark:text-neutral-400 md:text-lg'>
          The Evento public MCP server lets Claude Desktop, Cursor, and other MCP clients list a
          user’s events and fetch full event details — through the authenticated Evento public API,
          using your own API key.
        </p>

        <div className='mt-8 flex flex-wrap items-center gap-3'>
          <Button asChild size='lg' className='gap-2 px-6'>
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
            className='gap-2 bg-white px-6 dark:bg-neutral-900 dark:hover:bg-neutral-800'
          >
            <a href='#tools'>
              View tools
              <ArrowDown className='h-4 w-4' aria-hidden='true' />
            </a>
          </Button>
        </div>
      </div>

      <ul className='mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        {HIGHLIGHTS.map(({ icon: Icon, label }) => (
          <li
            key={label}
            className='flex items-center gap-3 rounded-2xl border border-gray-200 bg-white/80 px-4 py-3 text-sm font-medium text-gray-700 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/80 dark:text-neutral-300'
          >
            <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-neutral-300'>
              <Icon className='h-4 w-4' aria-hidden='true' />
            </span>
            {label}
          </li>
        ))}
      </ul>
    </header>
  );
}
