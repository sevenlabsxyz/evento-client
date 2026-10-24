'use client';

import DetachedMenuSheet, { MenuOption } from '@/components/ui/detached-menu-sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { forwardRef, useState } from 'react';

interface ListActionsMenuProps {
  listName: string;
  onRename: () => void;
  /** Omit for the default list, which can't be deleted. */
  onDelete?: () => void;
  /** `overlay` sits on top of a cover image; `outline` sits in a page header. */
  appearance?: 'overlay' | 'outline';
  className?: string;
}

const TRIGGER_BASE_CLASS =
  'inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900';

const TRIGGER_APPEARANCE_CLASS = {
  overlay:
    'bg-white/95 text-gray-700 shadow-sm backdrop-blur-sm hover:bg-white hover:text-gray-900 dark:bg-neutral-900/90 dark:text-neutral-200 dark:hover:bg-neutral-900 dark:hover:text-neutral-50',
  outline:
    'h-10 w-10 border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-neutral-50',
} as const;

const MenuTrigger = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    listName: string;
    appearance: 'overlay' | 'outline';
  }
>(({ listName, appearance, className, ...props }, ref) => {
  const t = useTranslations('lists.actionsMenu');
  return (
    <button
      ref={ref}
      type='button'
      aria-label={t('ariaLabel', { name: listName })}
      className={cn(TRIGGER_BASE_CLASS, TRIGGER_APPEARANCE_CLASS[appearance], className)}
      {...props}
    >
      <MoreHorizontal className='h-5 w-5' aria-hidden='true' />
    </button>
  );
});
MenuTrigger.displayName = 'ListActionsMenuTrigger';

/** Rename/delete actions: dropdown on desktop, detached bottom sheet on mobile. */
export function ListActionsMenu({
  listName,
  onRename,
  onDelete,
  appearance = 'overlay',
  className,
}: ListActionsMenuProps) {
  const t = useTranslations('lists.actionsMenu');
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  if (isMobile) {
    const options: MenuOption[] = [
      {
        id: 'rename',
        label: t('renameList'),
        icon: Pencil,
        onClick: () => {
          setIsSheetOpen(false);
          onRename();
        },
      },
    ];
    if (onDelete) {
      options.push({
        id: 'delete',
        label: t('deleteList'),
        icon: Trash2,
        variant: 'destructive',
        onClick: () => {
          setIsSheetOpen(false);
          onDelete();
        },
      });
    }

    return (
      <>
        <MenuTrigger
          listName={listName}
          appearance={appearance}
          className={className}
          onClick={() => setIsSheetOpen(true)}
        />
        <DetachedMenuSheet
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          title={listName}
          options={options}
        />
      </>
    );
  }

  return (
    // Non-modal so focus isn't trapped when an item opens a dialog.
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <MenuTrigger listName={listName} appearance={appearance} className={className} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-44 rounded-xl p-1'>
        <DropdownMenuItem onSelect={onRename} className='gap-2 rounded-lg px-2.5 py-2'>
          <Pencil className='h-4 w-4' aria-hidden='true' />
          {t('rename')}
        </DropdownMenuItem>
        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={onDelete}
              className='gap-2 rounded-lg px-2.5 py-2 text-red-600 focus:bg-red-50 focus:text-red-700 dark:text-red-400 dark:focus:bg-red-950/40 dark:focus:text-red-300'
            >
              <Trash2 className='h-4 w-4' aria-hidden='true' />
              {t('deleteList')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
