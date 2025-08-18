'use client';

import { Button } from '@/components/ui/button';
import { DetachedSheet } from '@/components/ui/detached-sheet';
import { toast } from '@/lib/utils/toast';
import { CalendarPlus, Copy } from 'lucide-react';

interface MoreOptionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCalendar: () => void;
}

export default function MoreOptionsSheet({
  isOpen,
  onClose,
  onAddToCalendar,
}: MoreOptionsSheetProps) {
  const handleAddToCalendar = () => {
    onAddToCalendar();
    onClose();
  };

  const handleCopyEventUrl = () => {
    onClose();
    navigator.clipboard.writeText(window.location.href).then(() => {
      toast.success('Event URL copied to clipboard');
    });
  };

  const options = [
    {
      id: 'add-to-calendar',
      icon: CalendarPlus,
      label: 'Add to Calendar',
      onClick: handleAddToCalendar,
      variant: 'secondary' as const,
    },
    {
      id: 'copy-event-url',
      icon: Copy,
      label: 'Copy Event URL',
      onClick: handleCopyEventUrl,
      variant: 'secondary' as const,
    },
  ];

  return (
    <DetachedSheet.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && onClose()}
    >
      <DetachedSheet.Portal>
        <DetachedSheet.View>
          <DetachedSheet.Backdrop />
          <DetachedSheet.Content>
            <div className='p-6 pb-24'>
              {/* Handle */}
              <div className='mb-4 flex justify-center'>
                <DetachedSheet.Handle />
              </div>

              {/* Options */}
              <div className='space-y-3'>
                {options.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <Button
                      key={option.id}
                      onClick={option.onClick}
                      variant={option.variant}
                      className='flex w-full items-center gap-4 rounded-xl border border-gray-200 px-4 py-6 text-left transition-colors hover:bg-gray-50'
                    >
                      <IconComponent className='h-5 w-5 text-gray-600' />
                      <span className='font-medium text-gray-900'>{option.label}</span>
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
