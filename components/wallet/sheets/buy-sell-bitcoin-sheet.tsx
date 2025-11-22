import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { getExchangesForCountry, type Exchange } from '@/lib/constants/exchanges';
import { detectUserCountry } from '@/lib/utils/geo-detection';
import { ExternalLink, MapPin, X } from 'lucide-react';
import { useEffect, useState } from 'react';

type BuySellBitcoinSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BuySellBitcoinSheet({ open, onOpenChange }: BuySellBitcoinSheetProps) {
  const [countryCode, setCountryCode] = useState<string>('US');
  const [supportedExchanges, setSupportedExchanges] = useState<Exchange[]>([]);
  const [otherExchanges, setOtherExchanges] = useState<Exchange[]>([]);
  const [isDetecting, setIsDetecting] = useState(true);

  useEffect(() => {
    const detectCountry = async () => {
      try {
        setIsDetecting(true);
        const country = await detectUserCountry();
        setCountryCode(country);

        const { supported, others } = getExchangesForCountry(country);
        setSupportedExchanges(supported);
        setOtherExchanges(others);
      } catch (error) {
        console.error('Failed to detect country:', error);
      } finally {
        setIsDetecting(false);
      }
    };

    if (open) {
      detectCountry();
    }
  }, [open]);

  const ExchangeCard = ({ exchange }: { exchange: Exchange }) => {
    const Icon = exchange.icon;

    return (
      <a
        href={exchange.link}
        target='_blank'
        rel='noopener noreferrer'
        className='flex items-center gap-4 rounded-2xl bg-white p-4 transition-colors hover:bg-gray-50 active:bg-gray-100'
      >
        <div
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${exchange.iconBg}`}
        >
          <Icon className={`h-6 w-6 ${exchange.iconColor}`} />
        </div>
        <div className='flex-1'>
          <h3 className='font-semibold text-gray-900'>{exchange.name}</h3>
          <p className='text-sm text-gray-500'>{exchange.description}</p>
        </div>
        <ExternalLink className='h-5 w-5 flex-shrink-0 text-gray-400' />
      </a>
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
                    <h2 className='text-xl font-semibold'>Buy/Sell Bitcoin</h2>
                    <button onClick={() => onOpenChange(false)}>
                      <X className='h-5 w-5 text-gray-500' />
                    </button>
                  </div>

                  {/* Content */}
                  <div className='bg-gray-50 px-4 py-6'>
                    {isDetecting ? (
                      <div className='flex items-center justify-center py-12'>
                        <div className='text-gray-500'>Detecting your location...</div>
                      </div>
                    ) : (
                      <div className='space-y-6'>
                        {/* Location Indicator */}
                        <div className='flex items-center gap-2 text-sm text-gray-600'>
                          <MapPin className='h-4 w-4' />
                          <span>Showing options for {countryCode}</span>
                        </div>

                        {/* Supported Exchanges */}
                        {supportedExchanges.length > 0 && (
                          <div className='space-y-3'>
                            <h3 className='font-semibold text-gray-900'>
                              Available in Your Region
                            </h3>
                            <div className='space-y-2'>
                              {supportedExchanges.map((exchange) => (
                                <ExchangeCard key={exchange.id} exchange={exchange} />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Other Exchanges */}
                        {otherExchanges.length > 0 && (
                          <div className='space-y-3'>
                            <h3 className='font-semibold text-gray-900'>Other Exchanges</h3>
                            <p className='text-sm text-gray-600'>
                              These may not be available in your region. Check their website for
                              availability.
                            </p>
                            <div className='space-y-2'>
                              {otherExchanges.map((exchange) => (
                                <ExchangeCard key={exchange.id} exchange={exchange} />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Info Card */}
                        <div className='mt-6 rounded-2xl bg-blue-50 p-4 text-sm text-blue-700'>
                          <p className='font-medium'>💡 Important</p>
                          <ul className='mt-2 list-inside list-disc space-y-1'>
                            <li>Always verify the authenticity of the exchange website</li>
                            <li>Enable 2FA for maximum security</li>
                            <li>Consider withdrawing Bitcoin to your Evento wallet</li>
                          </ul>
                        </div>
                      </div>
                    )}
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
