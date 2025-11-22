import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { EARN_PARTNERS, type EarnPartner } from '@/lib/constants/earn-partners';
import { ExternalLink, X, Zap } from 'lucide-react';

type EarnBitcoinSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EarnBitcoinSheet({ open, onOpenChange }: EarnBitcoinSheetProps) {
  const PartnerCard = ({ partner }: { partner: EarnPartner }) => {
    const Icon = partner.icon;

    return (
      <div className='rounded-2xl bg-white p-4 shadow-sm'>
        <div className='flex items-start gap-4'>
          <div
            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${partner.iconBg}`}
          >
            <Icon className={`h-6 w-6 ${partner.iconColor}`} />
          </div>
          <div className='flex-1'>
            <div className='flex items-start justify-between'>
              <div>
                <h3 className='font-semibold text-gray-900'>{partner.name}</h3>
                <p className='mt-1 text-sm text-gray-600'>{partner.description}</p>
              </div>
            </div>
            <div className='mt-3 flex items-center justify-between'>
              <div className='flex items-center gap-1 text-sm font-medium text-orange-600'>
                <Zap className='h-4 w-4' />
                <span>{partner.earnings}</span>
              </div>
              <a
                href={partner.link}
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800'
              >
                {partner.ctaText}
                <ExternalLink className='h-4 w-4' />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <SheetWithDetentFull.Root presented={open} onPresentedChange={onOpenChange}>
      <SheetWithDetentFull.Portal>
        <SheetWithDetentFull.View>
          <SheetWithDetentFull.Backdrop />
          <SheetWithDetentFull.Content className='grid h-full grid-rows-[1fr]'>
            <SheetWithDetentFull.ScrollRoot asChild>
              <SheetWithDetentFull.ScrollView className='min-h-0'>
                <SheetWithDetentFull.ScrollContent>
                  {/* Handle */}
                  <div className='my-4 flex items-center'>
                    <SheetWithDetentFull.Handle className='mx-auto h-1 w-12 rounded-full bg-gray-300' />
                  </div>

                  {/* Header */}
                  <div className='flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3'>
                    <h2 className='text-xl font-semibold'>Earn Bitcoin</h2>
                    <button onClick={() => onOpenChange(false)}>
                      <X className='h-5 w-5 text-gray-500' />
                    </button>
                  </div>

                  {/* Content */}
                  <div className='bg-gray-50 px-4 py-6'>
                    <div className='space-y-6'>
                      {/* Hero Section */}
                      <div className='rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-500 p-6 text-white'>
                        <h3 className='text-xl font-bold'>Stack Sats Daily</h3>
                        <p className='mt-2 text-sm text-orange-50'>
                          Earn Bitcoin through our trusted partners. All earnings can be sent
                          directly to your Evento wallet.
                        </p>
                      </div>

                      {/* Partners List */}
                      <div className='space-y-3'>
                        <h3 className='font-semibold text-gray-900'>Our Partners</h3>
                        <div className='space-y-3'>
                          {EARN_PARTNERS.map((partner) => (
                            <PartnerCard key={partner.id} partner={partner} />
                          ))}
                        </div>
                      </div>

                      {/* How It Works */}
                      <div className='rounded-2xl bg-white p-4 shadow-sm'>
                        <h3 className='font-semibold text-gray-900'>How It Works</h3>
                        <ol className='mt-3 space-y-2 text-sm text-gray-600'>
                          <li className='flex gap-3'>
                            <span className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white'>
                              1
                            </span>
                            <span>Choose a partner and sign up through their platform</span>
                          </li>
                          <li className='flex gap-3'>
                            <span className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white'>
                              2
                            </span>
                            <span>
                              Participate by shopping, creating content, or using their services
                            </span>
                          </li>
                          <li className='flex gap-3'>
                            <span className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white'>
                              3
                            </span>
                            <span>
                              Earn Bitcoin rewards that you can send to your Evento wallet
                            </span>
                          </li>
                        </ol>
                      </div>

                      {/* Info */}
                      <div className='rounded-2xl bg-blue-50 p-4 text-sm text-blue-700'>
                        <p className='font-medium'>💡 Pro Tip</p>
                        <p className='mt-1'>
                          Combine multiple earning methods to maximize your Bitcoin stack. Every sat
                          counts!
                        </p>
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
