'use client';

import { CircledIconButton } from '@/components/circled-icon-button';
import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { VisuallyHidden } from '@silk-hq/components';
import { X } from 'lucide-react';
import { useState } from 'react';

interface MasterScrollableSheetProps {
  title: string;
  children: React.ReactNode;

  // Two usage patterns:
  // 1. Controlled: pass open + onOpenChange (parent manages state)
  // 2. Uncontrolled with trigger: pass trigger prop (sheet manages state internally)
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;

  // Header configuration (all optional with smart defaults)
  headerLeft?: React.ReactNode;
  headerCenter?: React.ReactNode;
  headerRight?: React.ReactNode;

  // Optional secondary header (renders below main header, still sticky)
  headerSecondary?: React.ReactNode;

  // Optional styling
  className?: string;
  contentClassName?: string;

  // Optional footer (renders below scroll area, sticky at bottom)
  footer?: React.ReactNode;
}

export function MasterScrollableSheet({
  title,
  children,
  open,
  onOpenChange,
  trigger,
  headerLeft,
  headerCenter,
  headerRight,
  headerSecondary,
  className,
  contentClassName,
  footer,
}: MasterScrollableSheetProps) {
  // Internal state for uncontrolled mode
  const [internalOpen, setInternalOpen] = useState(false);

  // Use controlled props if provided, otherwise use internal state
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen;

  const handleClose = () => setIsOpen?.(false);

  // Default components
  const defaultLeft = <h2 className='text-xl font-semibold'>{title}</h2>;
  const defaultRight = <CircledIconButton icon={X} onClick={handleClose} />;

  return (
    <SheetWithDetentFull.Root presented={isOpen} onPresentedChange={setIsOpen}>
      {/* Trigger - renders outside portal, opens sheet when clicked */}
      {trigger && (
        <SheetWithDetentFull.Trigger action='present' asChild>
          {trigger}
        </SheetWithDetentFull.Trigger>
      )}

      <SheetWithDetentFull.Portal>
        <SheetWithDetentFull.View>
          <SheetWithDetentFull.Backdrop />
          <SheetWithDetentFull.Content className={`flex flex-col md:!max-w-md ${className ?? ''}`}>
            {/* Handle */}
            <div className='my-4 flex items-center'>
              <SheetWithDetentFull.Handle className='mx-auto h-1 w-12 rounded-full bg-gray-300' />
            </div>

            {/* Accessibility title */}
            <VisuallyHidden.Root asChild>
              <SheetWithDetentFull.Title>{title}</SheetWithDetentFull.Title>
            </VisuallyHidden.Root>

            {/* Sticky Header - OUTSIDE scroll */}
            <div className='flex items-center justify-between gap-3 px-4 pb-4 pt-0'>
              <div className='flex-1'>{headerLeft ?? defaultLeft}</div>
              {headerCenter && <div>{headerCenter}</div>}
              <div className='flex-shrink-0'>{headerRight ?? defaultRight}</div>
            </div>

            {/* Optional Secondary Header - for filters, menus, tabs, etc. */}
            {headerSecondary}

            {/* Scrollable Content - wrapper ensures height propagates to Silk Scroll */}
            <div
              className={`min-h-0 flex-1 overflow-hidden ${footer ? 'max-h-[calc(100%-330px)]' : ''}`}
            >
              <SheetWithDetentFull.ScrollRoot className='h-full'>
                <SheetWithDetentFull.ScrollView className='h-full'>
                  <SheetWithDetentFull.ScrollContent className={contentClassName}>
                    {children}
                  </SheetWithDetentFull.ScrollContent>
                </SheetWithDetentFull.ScrollView>
              </SheetWithDetentFull.ScrollRoot>
            </div>

            {/* Optional Footer - sticky at bottom, outside scroll area */}
            {footer && (
              <div className='flex-shrink-0 border-t border-gray-200 px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]'>
                {footer}
              </div>
            )}
          </SheetWithDetentFull.Content>
        </SheetWithDetentFull.View>
      </SheetWithDetentFull.Portal>
    </SheetWithDetentFull.Root>
  );
}
