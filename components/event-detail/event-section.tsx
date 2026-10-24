import { cn } from '@/lib/utils';
import { forwardRef, type ReactNode } from 'react';

interface EventSectionProps {
  id?: string;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  variant?: 'card' | 'plain';
}

/**
 * Consistent wrapper for event detail sections: heading row (title + optional
 * action), optional muted description, and a body rendered inside a card
 * (default) or plain. `id` sits on the root <section> for scroll-spy anchors.
 */
export const EventSection = forwardRef<HTMLElement, EventSectionProps>(function EventSection(
  { id, title, description, action, children, className, bodyClassName, variant = 'card' },
  ref
) {
  const hasHeader = Boolean(title || action || description);

  return (
    <section ref={ref} id={id} className={cn('scroll-mt-24', className)}>
      {hasHeader && (
        <header className='mb-3 flex items-start justify-between gap-3'>
          <div className='min-w-0'>
            {title && (
              <h2 className='text-base font-semibold text-gray-900 dark:text-neutral-100'>
                {title}
              </h2>
            )}
            {description && (
              <p className='mt-0.5 text-sm text-gray-500 dark:text-neutral-500'>{description}</p>
            )}
          </div>
          {action && <div className='flex shrink-0 items-center gap-2'>{action}</div>}
        </header>
      )}
      {variant === 'card' ? (
        <div
          className={cn(
            'rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 md:p-5',
            bodyClassName
          )}
        >
          {children}
        </div>
      ) : (
        <div className={bodyClassName}>{children}</div>
      )}
    </section>
  );
});

export default EventSection;
