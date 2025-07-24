'use client';

import { DetachedSheet } from '@/components/ui/detached-sheet';
import { Globe, Lock } from 'lucide-react';

interface EventVisibilitySheetProps {
  isOpen: boolean;
  onClose: () => void;
  onVisibilitySelect: (visibility: 'public' | 'private') => void;
  currentVisibility: 'public' | 'private';
}

export default function EventVisibilitySheet({
  isOpen,
  onClose,
  onVisibilitySelect,
  currentVisibility,
}: EventVisibilitySheetProps) {
  const handleVisibilitySelect = (visibility: 'public' | 'private') => {
    onVisibilitySelect(visibility);
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
                <h2 className='text-center text-xl font-semibold'>Event Visibility</h2>
              </div>

              {/* Visibility Options */}
              <div className='space-y-3'>
                {/* Public Option */}
                <button
                  onClick={() => handleVisibilitySelect('public')}
                  className={`w-full rounded-xl border-2 p-4 transition-all ${
                    currentVisibility === 'public'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className='flex items-start gap-4'>
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        currentVisibility === 'public'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Globe className='h-5 w-5' />
                    </div>
                    <div className='flex-1 text-left'>
                      <h3
                        className={`mb-1 font-semibold ${
                          currentVisibility === 'public' ? 'text-red-900' : 'text-gray-900'
                        }`}
                      >
                        Public
                      </h3>
                      <p
                        className={`text-sm ${
                          currentVisibility === 'public' ? 'text-red-700' : 'text-gray-600'
                        }`}
                      >
                        Anyone can find and join this event
                      </p>
                    </div>
                    {currentVisibility === 'public' && (
                      <div className='flex h-6 w-6 items-center justify-center rounded-full bg-red-500'>
                        <div className='h-2 w-2 rounded-full bg-white' />
                      </div>
                    )}
                  </div>
                </button>

                {/* Private Option */}
                <button
                  onClick={() => handleVisibilitySelect('private')}
                  className={`w-full rounded-xl border-2 p-4 transition-all ${
                    currentVisibility === 'private'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className='flex items-start gap-4'>
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        currentVisibility === 'private'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Lock className='h-5 w-5' />
                    </div>
                    <div className='flex-1 text-left'>
                      <h3
                        className={`mb-1 font-semibold ${
                          currentVisibility === 'private' ? 'text-red-900' : 'text-gray-900'
                        }`}
                      >
                        Private
                      </h3>
                      <p
                        className={`text-sm ${
                          currentVisibility === 'private' ? 'text-red-700' : 'text-gray-600'
                        }`}
                      >
                        Only people with the link can join
                      </p>
                    </div>
                    {currentVisibility === 'private' && (
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
