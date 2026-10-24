import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface ListEmptyPanelProps {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
}

/** Dashed empty/not-found panel matching the blog and hub empty states. */
export function ListEmptyPanel({ icon: Icon, title, description, children }: ListEmptyPanelProps) {
  return (
    <div className='flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center dark:border-neutral-800 dark:bg-neutral-900'>
      <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-white text-gray-500 shadow-sm dark:bg-neutral-800 dark:text-neutral-300 dark:shadow-none'>
        <Icon className='h-6 w-6' aria-hidden='true' />
      </div>
      <h2 className='mt-4 text-lg font-semibold text-gray-900 dark:text-neutral-100'>{title}</h2>
      <p className='mt-1 max-w-sm text-sm text-gray-600 dark:text-neutral-400'>{description}</p>
      {children && (
        <div className='mt-5 flex flex-col justify-center gap-2 sm:flex-row'>{children}</div>
      )}
    </div>
  );
}
