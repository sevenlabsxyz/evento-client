'use client';

import { DetachedSheet } from '@/components/ui/detached-sheet';
import { Ticket, Users } from 'lucide-react';

interface EventTypeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onTypeSelect: (type: 'rsvp' | 'ticketed') => void;
  currentType: 'rsvp' | 'ticketed';
}

export default function EventTypeSheet({
  isOpen,
  onClose,
  onTypeSelect,
  currentType,
}: EventTypeSheetProps) {
  const handleTypeSelect = (type: 'rsvp' | 'ticketed') => {
    onTypeSelect(type);
    onClose();
  };

  return (
    <DetachedSheet.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && onClose()}
    >
      <DetachedSheet.Portal>
        <DetachedSheet.View>
          <DetachedSheet.Backdrop />
          <DetachedSheet.Content>
            <div className='p-6'>
              {/* Handle */}
              <div className='mb-4 flex justify-center'>
                <DetachedSheet.Handle />
              </div>

              {/* Header */}
              <div className='mb-6'>
                <h2 className='text-center text-xl font-semibold'>Event Type</h2>
              </div>

              {/* Type Options */}
              <div className='space-y-3'>
                {/* Free Option */}
                <button
                  onClick={() => handleTypeSelect('rsvp')}
                  className={`w-full rounded-xl border-2 p-4 transition-all ${
                    currentType === 'rsvp'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className='flex items-start gap-4'>
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        currentType === 'rsvp'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Users className='h-5 w-5' />
                    </div>
                    <div className='flex-1 text-left'>
                      <h3
                        className={`mb-1 font-semibold ${
                          currentType === 'rsvp' ? 'text-red-900' : 'text-gray-900'
                        }`}
                      >
                        Free
                      </h3>
                      <p
                        className={`text-sm ${
                          currentType === 'rsvp' ? 'text-red-700' : 'text-gray-600'
                        }`}
                      >
                        Guests can RSVP for free
                      </p>
                    </div>
                    {currentType === 'rsvp' && (
                      <div className='flex h-6 w-6 items-center justify-center rounded-full bg-red-500'>
                        <div className='h-2 w-2 rounded-full bg-white' />
                      </div>
                    )}
                  </div>
                </button>

                {/* Paid Option */}
                <button
                  onClick={() => handleTypeSelect('ticketed')}
                  className={`w-full rounded-xl border-2 p-4 transition-all ${
                    currentType === 'ticketed'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className='flex items-start gap-4'>
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        currentType === 'ticketed'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Ticket className='h-5 w-5' />
                    </div>
                    <div className='flex-1 text-left'>
                      <h3
                        className={`mb-1 font-semibold ${
                          currentType === 'ticketed' ? 'text-red-900' : 'text-gray-900'
                        }`}
                      >
                        Paid
                      </h3>
                      <p
                        className={`text-sm ${
                          currentType === 'ticketed' ? 'text-red-700' : 'text-gray-600'
                        }`}
                      >
                        Sell tickets via Lightning
                      </p>
                    </div>
                    {currentType === 'ticketed' && (
                      <div className='flex h-6 w-6 items-center justify-center rounded-full bg-red-500'>
                        <div className='h-2 w-2 rounded-full bg-white' />
                      </div>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </DetachedSheet.Content>
        </DetachedSheet.View>
      </DetachedSheet.Portal>
    </DetachedSheet.Root>
  );
}
