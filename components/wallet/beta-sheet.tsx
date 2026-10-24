'use client';

import { Button } from '@/components/ui/button';
import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { AlertTriangle, Info, Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface BetaSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BetaSheet({ open, onOpenChange }: BetaSheetProps) {
  const t = useTranslations('wallet');
  const tCommon = useTranslations('common');
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
                    {t('beta.title')}
                  </h2>
                  <span className='rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'>
                    {t('beta.badge')}
                  </span>
                </div>
                <p className='text-gray-600 dark:text-neutral-400'>{t('beta.subtitle')}</p>
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
                            {t('beta.riskTitle')}
                          </h3>
                          <p className='text-sm text-amber-800 dark:text-amber-400'>
                            {t('beta.riskBody')}
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
                            {t('beta.whatIsBeta')}
                          </h3>
                        </div>
                        <p className='text-sm text-gray-700 dark:text-neutral-300'>
                          {t('beta.whatIsBetaBody')}
                        </p>
                      </div>

                      <div className='rounded-xl bg-white p-4 shadow-sm dark:border dark:border-neutral-800 dark:bg-neutral-800/60 dark:shadow-none'>
                        <div className='mb-3 flex items-center gap-2'>
                          <Shield className='h-5 w-5 text-green-600 dark:text-green-400' />
                          <h3 className='font-semibold text-gray-900 dark:text-neutral-100'>
                            {t('beta.bestPractices')}
                          </h3>
                        </div>
                        <ul className='space-y-2 text-sm text-gray-700 dark:text-neutral-300'>
                          <li className='flex items-start gap-2'>
                            <div className='mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400 dark:bg-neutral-500'></div>
                            <span>{t('beta.practiceBackup')}</span>
                          </li>
                          <li className='flex items-start gap-2'>
                            <div className='mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400 dark:bg-neutral-500'></div>
                            <span>{t('beta.practiceSmall')}</span>
                          </li>
                          <li className='flex items-start gap-2'>
                            <div className='mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400 dark:bg-neutral-500'></div>
                            <span>{t('beta.practiceReport')}</span>
                          </li>
                          <li className='flex items-start gap-2'>
                            <div className='mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400 dark:bg-neutral-500'></div>
                            <span>{t('beta.practiceUpdate')}</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Footer Note */}
                    <div className='rounded-lg bg-gray-50 p-4 text-center dark:bg-neutral-950'>
                      <p className='text-sm text-gray-600 dark:text-neutral-400'>
                        {t('beta.thanks')}
                      </p>
                    </div>

                    {/* Done Button */}
                    <Button onClick={() => onOpenChange(false)} className='w-full' size='lg'>
                      {tCommon('actions.gotIt')}
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
