import { Button } from '@/components/ui/button';
import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { EARN_PARTNERS, type EarnPartner } from '@/lib/constants/earn-partners';
import { ExternalLink, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

type EarnBitcoinSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lightningAddress: string;
};

export function EarnBitcoinSheet({ open, onOpenChange, lightningAddress }: EarnBitcoinSheetProps) {
  const PartnerCard = ({ partner }: { partner: EarnPartner }) => {
    return (
      <div className='flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4'>
        {/* Left: Logo + Content */}
        <div className='flex items-start gap-3'>
          <div className='relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-2xl'>
            <Image src={partner.logo} alt={partner.name} fill className='object-cover' />
          </div>
          <div>
            <h3 className='font-semibold text-gray-900'>{partner.name}</h3>
            <p className='text-sm text-gray-600'>{partner.description}</p>
          </div>
        </div>

        {/* Right: Button */}
        <Button asChild variant='default' className='flex-shrink-0'>
          <Link href={partner.link} target='_blank' rel='noopener noreferrer'>
            {partner.ctaText}
            <ExternalLink className='ml-2 h-4 w-4' />
          </Link>
        </Button>
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
                    <SheetWithDetentFull.Handle className='mx-auto h-1 w-12 rounded-full bg-gray-300' />
                  </div>

                  {/* Header */}
                  <div className='flex items-center justify-between border-gray-200 bg-white px-4 py-3 pt-0'>
                    <h2 className='text-xl font-semibold'>Earn Bitcoin</h2>
                    <button onClick={() => onOpenChange(false)}>
                      <X className='h-5 w-5 text-gray-500' />
                    </button>
                  </div>

                  {/* Content */}
                  <div className='bg-white px-4 py-6'>
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
                      <div className='rounded-2xl border border-gray-200 bg-gray-50 p-4'>
                        <h3 className='font-semibold text-gray-900'>How It Works</h3>
                        <ol className='mt-3 space-y-2 text-sm text-gray-600'>
                          <li className='flex gap-3'>
                            <span className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white'>
                              1
                            </span>
                            <span>Use a partner app to earn Bitcoin</span>
                          </li>
                          <li className='flex gap-3'>
                            <span className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white'>
                              2
                            </span>
                            <span>
                              Send your earnings to{' '}
                              <span className='font-semibold text-gray-900'>
                                {lightningAddress}
                              </span>
                            </span>
                          </li>
                          <li className='flex gap-3'>
                            <span className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white'>
                              3
                            </span>
                            <span>Use it inside Evento</span>
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
