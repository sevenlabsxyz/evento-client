'use client';

import { Button } from '@/components/ui/button';
import { DetachedSheet } from '@/components/ui/detached-sheet';
import { LucideIcon } from 'lucide-react';

export interface MenuOption {
  id: string;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
  disabled?: boolean;
}

interface DetachedMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
  options: MenuOption[];
  title?: string;
}

export default function DetachedMenuSheet({
  isOpen,
  onClose,
  options,
  title,
}: DetachedMenuSheetProps) {
  return (
    <DetachedSheet.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && onClose()}
    >
      <DetachedSheet.Portal>
        <DetachedSheet.View>
          <DetachedSheet.Backdrop />
          <DetachedSheet.Content className='md:!max-w-[500px]'>
            <div className='p-6 pb-24 md:pb-8'>
              {/* Handle */}
              <div className='mb-4 flex justify-center'>
                <DetachedSheet.Handle />
              </div>

              {/* Title */}
              {title && (
                <div className='mb-6 text-center'>
                  <h2 className='text-lg font-semibold text-gray-900'>{title}</h2>
                </div>
              )}

              {/* Options */}
              <div className='space-y-3'>
                {options.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <Button
                      key={option.id}
                      onClick={option.onClick}
                      variant={option.variant || 'secondary'}
                      disabled={option.disabled}
                      className='flex w-full items-center gap-4 rounded-full border border-gray-200 px-4 py-6 text-left transition-colors hover:bg-gray-50'
                    >
                      <IconComponent className='h-5 w-5' />
                      <span className='font-medium'>{option.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </DetachedSheet.Content>
        </DetachedSheet.View>
      </DetachedSheet.Portal>
    </DetachedSheet.Root>
  );
}
