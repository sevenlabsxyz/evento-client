'use client';

import { DetachedSheet } from '@/components/ui/detached-sheet';
import { Check, Ticket, UserCheck } from 'lucide-react';

type EventType = 'rsvp' | 'registration' | 'ticketed';

interface EventTypeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onTypeSelect: (type: EventType) => void;
  currentType: EventType;
}

export default function EventTypeSheet({
  isOpen,
  onClose,
  onTypeSelect,
  currentType,
}: EventTypeSheetProps) {
  const handleTypeSelect = (type: EventType) => {
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
              <div className='mb-4 flex justify-center'>
                <DetachedSheet.Handle />
              </div>

              <div className='mb-6'>
                <h2 className='text-center text-xl font-semibold'>Event Type</h2>
              </div>

              <div className='space-y-3'>
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
                      <UserCheck className='h-5 w-5' />
                    </div>
                    <div className='flex-1 text-left'>
                      <h3
                        className={`mb-1 font-semibold ${
                          currentType === 'rsvp' ? 'text-red-900' : 'text-gray-900'
                        }`}
                      >
                        RSVP
                      </h3>
                      <p
                        className={`text-sm ${
                          currentType === 'rsvp' ? 'text-red-700' : 'text-gray-600'
                        }`}
                      >
                        Guests RSVP directly.
                      </p>
                    </div>
                    {currentType === 'rsvp' && <Check className='h-5 w-5 text-red-600' />}
                  </div>
                </button>

                <button
                  onClick={() => handleTypeSelect('registration')}
                  className={`w-full rounded-xl border-2 p-4 transition-all ${
                    currentType === 'registration'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className='flex items-start gap-4'>
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        currentType === 'registration'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Ticket className='h-5 w-5' />
                    </div>
                    <div className='flex-1 text-left'>
                      <h3
                        className={`mb-1 font-semibold ${
                          currentType === 'registration' ? 'text-red-900' : 'text-gray-900'
                        }`}
                      >
                        Registration
                      </h3>
                      <p
                        className={`text-sm ${
                          currentType === 'registration' ? 'text-red-700' : 'text-gray-600'
                        }`}
                      >
                        Guests submit registration before attending.
                      </p>
                    </div>
                    {currentType === 'registration' && <Check className='h-5 w-5 text-red-600' />}
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
