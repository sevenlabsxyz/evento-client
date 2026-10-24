import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ListLoadErrorProps {
  title: string;
  message: string;
  onRetry: () => void;
}

export function ListLoadError({ title, message, onRetry }: ListLoadErrorProps) {
  return (
    <div
      role='alert'
      className='rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400'
    >
      <div className='mb-1 flex items-center gap-2 text-base font-semibold'>
        <AlertTriangle className='h-5 w-5' aria-hidden='true' />
        {title}
      </div>
      <p className='mb-4 text-sm text-amber-800 dark:text-amber-400'>{message}</p>
      <Button
        type='button'
        variant='outline'
        onClick={onRetry}
        className='bg-white dark:bg-neutral-900 dark:hover:bg-neutral-800'
      >
        Try again
      </Button>
    </div>
  );
}
