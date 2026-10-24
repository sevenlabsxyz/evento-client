import { CircledIconButton } from '@/components/circled-icon-button';
import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { EARN_PARTNERS, type EarnPartner } from '@/lib/constants/earn-partners';
import { ArrowUpRight, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

type EarnBitcoinSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lightningAddress: string;
};

export function EarnBitcoinSheet({ open, onOpenChange, lightningAddress }: EarnBitcoinSheetProps) {
  const t = useTranslations('walletFlows');
  const PartnerCard = ({ partner }: { partner: EarnPartner }) => {
    return (
      <div
        className='flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 hover:bg-gray-100 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-800'
        onClick={() => window.open(partner.link, '_blank')}
      >
        {/* Left: Logo + Content */}
        <div className='flex items-start gap-3'>
          <div className='relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-2xl'>
            <Image src={partner.logo} alt={partner.name} fill className='object-cover' />
          </div>
          <div>
            <h3 className='font-semibold text-gray-900 dark:text-neutral-100'>{partner.name}</h3>
            <p className='text-sm text-gray-600 dark:text-neutral-400'>{partner.description}</p>
          </div>
        </div>

        {/* Right: Button */}
        <CircledIconButton
          className='flex-shrink-0 bg-white dark:bg-neutral-900'
          icon={ArrowUpRight}
          onClick={() => window.open(partner.link, '_blank')}
        />
      </div>
    );
  };

  return (
    <SheetWithDetentFull.Root presented={open} onPresentedChange={onOpenChange}>
      <SheetWithDetentFull.Portal>
        <SheetWithDetentFull.View>
          <SheetWithDetentFull.Backdrop />
          <SheetWithDetentFull.Content className='grid h-full grid-rows-[1fr] md:!max-w-[700px]'>
            <SheetWithDetentFull.ScrollRoot asChild>
              <SheetWithDetentFull.ScrollView className='min-h-0'>
                <SheetWithDetentFull.ScrollContent>
                  {/* Handle */}
                  <div className='my-4 flex items-center'>
                    <SheetWithDetentFull.Handle className='mx-auto h-1 w-12 rounded-full bg-gray-300 dark:bg-neutral-600' />
                  </div>

                  {/* Header */}
                  <div className='flex items-center justify-between border-gray-200 bg-white px-4 py-3 pt-0 dark:border-neutral-800 dark:bg-neutral-900'>
                    <h2 className='text-xl font-semibold'>{t('earnBitcoinSheet.title')}</h2>
                    <button onClick={() => onOpenChange(false)}>
                      <X className='h-5 w-5 text-gray-500 dark:text-neutral-400' />
                    </button>
                  </div>

                  {/* Content */}
                  <div className='bg-white px-4 py-6 dark:bg-neutral-900'>
                    <div className='space-y-6'>
                      {/* Partners List */}
                      <div className='space-y-3'>
                        <div className='space-y-3'>
                          {EARN_PARTNERS.map((partner) => (
                            <PartnerCard key={partner.id} partner={partner} />
                          ))}
                        </div>
                      </div>

                      {/* How It Works */}
                      <div className='rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-neutral-800 dark:bg-neutral-950'>
                        <h3 className='font-semibold text-gray-900 dark:text-neutral-100'>
                          {t('earnBitcoinSheet.howItWorks')}
                        </h3>
                        <ol className='mt-3 space-y-2 text-sm text-gray-600 dark:text-neutral-400'>
                          <li className='flex gap-3'>
                            <span className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white dark:bg-neutral-100 dark:text-neutral-900'>
                              1
                            </span>
                            <span>{t('earnBitcoinSheet.step1')}</span>
                          </li>
                          <li className='flex gap-3'>
                            <span className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white dark:bg-neutral-100 dark:text-neutral-900'>
                              2
                            </span>
                            <span>
                              {t.rich('earnBitcoinSheet.step2', {
                                address: lightningAddress,
                                strong: (chunks) => (
                                  <span className='font-semibold text-gray-900 dark:text-neutral-100'>
                                    {chunks}
                                  </span>
                                ),
                              })}
                            </span>
                          </li>
                          <li className='flex gap-3'>
                            <span className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white dark:bg-neutral-100 dark:text-neutral-900'>
                              3
                            </span>
                            <span>{t('earnBitcoinSheet.step3')}</span>
                          </li>
                        </ol>
                      </div>
                    </div>
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
