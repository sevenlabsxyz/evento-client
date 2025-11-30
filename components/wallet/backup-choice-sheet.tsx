'use client';

import { SheetWithDetent } from '@/components/ui/sheet-with-detent';
import { ChevronRight, Key, Shield } from 'lucide-react';

interface BackupChoiceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectSeedPhrase: () => void;
  onSelectEncryptedBackup: () => void;
}

export function BackupChoiceSheet({
  open,
  onOpenChange,
  onSelectSeedPhrase,
  onSelectEncryptedBackup,
}: BackupChoiceSheetProps) {
  return (
    <SheetWithDetent.Root presented={open} onPresentedChange={onOpenChange}>
      <SheetWithDetent.Portal>
        <SheetWithDetent.View>
          <SheetWithDetent.Backdrop />
          <SheetWithDetent.Content>
            <SheetWithDetent.Handle />

            <div className='px-4 pb-8 pt-2'>
              <h2 className='mb-6 text-center text-xl font-bold'>Choose Backup Method</h2>

              <div className='space-y-3'>
                {/* Encrypted Backup Option - Recommended */}
                <button
                  onClick={() => {
                    onOpenChange(false);
                    onSelectEncryptedBackup();
                  }}
                  className='flex w-full items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors hover:bg-gray-50'
                >
                  <div className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100'>
                    <Shield className='h-6 w-6 text-green-600' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-2'>
                      <p className='font-semibold text-gray-900'>Encrypted Backup</p>
                      <span className='rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700'>
                        Recommended
                      </span>
                    </div>
                    <p className='mt-0.5 text-sm text-gray-500'>
                      Password-protected backup string. Save to cloud storage.
                    </p>
                  </div>
                  <ChevronRight className='h-5 w-5 flex-shrink-0 text-gray-400' />
                </button>

                {/* Seed Phrase Option */}
                <button
                  onClick={() => {
                    onOpenChange(false);
                    onSelectSeedPhrase();
                  }}
                  className='flex w-full items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors hover:bg-gray-50'
                >
                  <div className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange-100'>
                    <Key className='h-6 w-6 text-orange-600' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='font-semibold text-gray-900'>View Seed Phrase</p>
                    <p className='mt-0.5 text-sm text-gray-500'>
                      Write down 12 words. For advanced users.
                    </p>
                  </div>
                  <ChevronRight className='h-5 w-5 flex-shrink-0 text-gray-400' />
                </button>
              </div>

              <p className='mt-6 text-center text-xs text-gray-400'>
                Your backup is the only way to recover your funds if you lose access to this device.
              </p>
            </div>
          </SheetWithDetent.Content>
        </SheetWithDetent.View>
      </SheetWithDetent.Portal>
    </SheetWithDetent.Root>
  );
}
