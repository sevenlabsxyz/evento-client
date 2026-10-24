'use client';

import { Button } from '@/components/ui/button';
import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { AlertTriangle, Info, Shield } from 'lucide-react';

interface BetaSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BetaSheet({ open, onOpenChange }: BetaSheetProps) {
  return (
    <SheetWithDetentFull.Root
      presented={open}
      onPresentedChange={(presented) => onOpenChange(presented)}
      activeDetent={1}
      onActiveDetentChange={() => {}}
    >
      <SheetWithDetentFull.Portal>
        <SheetWithDetentFull.View>
          <SheetWithDetentFull.Backdrop />
          <SheetWithDetentFull.Content className='grid grid-rows-[min-content_1fr] md:!max-w-lg'>
            <div className='border-b border-gray-100 p-4 dark:border-neutral-800'>
              <div className='mb-4 flex justify-center'>
                <SheetWithDetentFull.Handle />
              </div>
              <div>
                <div className='mb-2 flex items-center gap-2'>
                  <h2 className='text-2xl font-bold text-gray-900 dark:text-neutral-100'>
                    Beta Software
                  </h2>
                  <span className='rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'>
                    BETA
                  </span>
                </div>
                <p className='text-gray-600 dark:text-neutral-400'>
                  Important information about the Evento Wallet
                </p>
              </div>
            </div>

            <SheetWithDetentFull.ScrollRoot asChild>
              <SheetWithDetentFull.ScrollView className='min-h-0'>
                <SheetWithDetentFull.ScrollContent className='p-4'>
                  <div className='space-y-6'>
                    {/* Warning Banner */}
                    <div className='rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40'>
                      <div className='flex items-start gap-3'>
                        <AlertTriangle className='h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400' />
                        <div>
                          <h3 className='mb-1 font-semibold text-amber-900 dark:text-amber-400'>
                            Use at Your Own Risk
                          </h3>
                          <p className='text-sm text-amber-800 dark:text-amber-400'>
                            The Evento Wallet is currently in beta testing. While we strive for
                            reliability, there may be bugs or unexpected behavior.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Information Cards */}
                    <div className='space-y-4'>
                      <div className='rounded-xl bg-white p-4 shadow-sm dark:border dark:border-neutral-800 dark:bg-neutral-800/60 dark:shadow-none'>
                        <div className='mb-3 flex items-center gap-2'>
                          <Info className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                          <h3 className='font-semibold text-gray-900 dark:text-neutral-100'>
                            What is Beta?
                          </h3>
                        </div>
                        <p className='text-sm text-gray-700 dark:text-neutral-300'>
                          Beta software is feature-complete but still being tested. You may
                          encounter bugs, performance issues, or unexpected behavior as we work to
                          improve the wallet.
                        </p>
                      </div>

                      <div className='rounded-xl bg-white p-4 shadow-sm dark:border dark:border-neutral-800 dark:bg-neutral-800/60 dark:shadow-none'>
                        <div className='mb-3 flex items-center gap-2'>
                          <Shield className='h-5 w-5 text-green-600 dark:text-green-400' />
                          <h3 className='font-semibold text-gray-900 dark:text-neutral-100'>
                            Best Practices
                          </h3>
                        </div>
                        <ul className='space-y-2 text-sm text-gray-700 dark:text-neutral-300'>
                          <li className='flex items-start gap-2'>
                            <div className='mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400 dark:bg-neutral-500'></div>
                            <span>
                              Always backup your wallet and store your recovery phrase securely
                            </span>
                          </li>
                          <li className='flex items-start gap-2'>
                            <div className='mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400 dark:bg-neutral-500'></div>
                            <span>Start with small amounts to test functionality</span>
                          </li>
                          <li className='flex items-start gap-2'>
                            <div className='mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400 dark:bg-neutral-500'></div>
                            <span>Report any issues or bugs you encounter to help us improve</span>
                          </li>
                          <li className='flex items-start gap-2'>
                            <div className='mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400 dark:bg-neutral-500'></div>
                            <span>Keep your app updated to the latest version</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Footer Note */}
                    <div className='rounded-lg bg-gray-50 p-4 text-center dark:bg-neutral-950'>
                      <p className='text-sm text-gray-600 dark:text-neutral-400'>
                        Thank you for being an early tester! Your feedback helps us build a better
                        wallet experience for everyone.
                      </p>
                    </div>

                    {/* Done Button */}
                    <Button onClick={() => onOpenChange(false)} className='w-full' size='lg'>
                      Got it
                    </Button>
                  </div>
                </SheetWithDetentFull.ScrollContent>
              </SheetWithDetentFull.ScrollView>
            </SheetWithDetentFull.ScrollRoot>
          </SheetWithDetentFull.Content>
        </SheetWithDetentFull.View>
      </SheetWithDetentFull.Portal>
    </SheetWithDetentFull.Root>
  );
}
