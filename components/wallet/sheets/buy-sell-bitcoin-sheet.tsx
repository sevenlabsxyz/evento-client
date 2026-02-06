import { CircledIconButton } from '@/components/circled-icon-button';
import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { WalletBalanceDisplay } from '@/components/wallet/wallet-balance-display';
import { GLOBAL_EXCHANGES, getExchangesForCountry, type Exchange } from '@/lib/constants/exchanges';
import { detectUserCountry } from '@/lib/utils/geo-detection';
import { logger } from '@/lib/utils/logger';
import { ArrowUpRight, Loader2, MapPin, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

type BuySellBitcoinSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BuySellBitcoinSheet({ open, onOpenChange }: BuySellBitcoinSheetProps) {
  const [countryCode, setCountryCode] = useState<string>('US');
  const [regionalExchanges, setRegionalExchanges] = useState<Exchange[]>([]);
  const [isDetecting, setIsDetecting] = useState(true);

  useEffect(() => {
    const detectCountry = async () => {
      try {
        setIsDetecting(true);
        const country = await detectUserCountry();
        setCountryCode(country);

        const { regional } = getExchangesForCountry(country);
        setRegionalExchanges(regional);
      } catch (error) {
        logger.error('Failed to detect country', {
          error: error instanceof Error ? error.message : String(error),
        });
        // Fallback to US
        const { regional } = getExchangesForCountry('US');
        setRegionalExchanges(regional);
      } finally {
        setIsDetecting(false);
      }
    };

    if (open) {
      detectCountry();
    }
  }, [open]);

  const ExchangeCard = ({ exchange }: { exchange: Exchange }) => {
    return (
      <div
        className='flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 hover:bg-gray-100'
        onClick={() => window.open(exchange.link, '_blank')}
      >
        {/* Left: Logo + Content */}
        <div className='flex items-center gap-3'>
          <div className='relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-2xl'>
            <Image src={exchange.logo} alt={exchange.name} fill className='object-cover' />
          </div>
          <div>
            <h3 className='font-semibold text-gray-900'>{exchange.name}</h3>
            <p className='text-sm text-gray-600'>{exchange.description}</p>
          </div>
        </div>

        {/* Right: Button */}
        <CircledIconButton
          className='flex-shrink-0 bg-white'
          icon={ArrowUpRight}
          onClick={() => window.open(exchange.link, '_blank')}
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
                    <SheetWithDetentFull.Handle className='mx-auto h-1 w-12 rounded-full bg-gray-300' />
                  </div>

                  {/* Header */}
                  <div className='flex items-center justify-between border-gray-200 bg-white px-4 py-3 pt-0'>
                    <h2 className='text-xl font-semibold'>Buy/Sell Bitcoin</h2>
                    <div className='flex items-center gap-3'>
                      <WalletBalanceDisplay />
                      <button onClick={() => onOpenChange(false)}>
                        <X className='h-5 w-5 text-gray-500' />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className='bg-white px-4 py-6'>
                    <div className='space-y-6'>
                      {/* Regional Exchanges */}
                      <div className='space-y-3'>
                        <div className='flex items-center gap-2'>
                          <MapPin className='h-4 w-4 text-gray-500' />
                          <h3 className='font-semibold text-gray-900'>Available in Your Region</h3>
                          {!isDetecting && (
                            <span className='text-sm text-gray-500'>({countryCode})</span>
                          )}
                        </div>

                        {isDetecting ? (
                          <div className='flex items-center justify-center py-8'>
                            <Loader2 className='h-6 w-6 animate-spin text-gray-400' />
                            <span className='ml-2 text-sm text-gray-500'>
                              Detecting your location...
                            </span>
                          </div>
                        ) : regionalExchanges.length > 0 ? (
                          <div className='space-y-3'>
                            {regionalExchanges.map((exchange) => (
                              <ExchangeCard key={exchange.id} exchange={exchange} />
                            ))}
                          </div>
                        ) : (
                          <p className='py-4 text-sm text-gray-500'>
                            No regional exchanges available for your location.
                          </p>
                        )}
                      </div>

                      {/* Global Exchanges */}
                      <div className='space-y-3'>
                        <h3 className='font-semibold text-gray-900'>Global</h3>
                        <div className='space-y-3'>
                          {GLOBAL_EXCHANGES.map((exchange) => (
                            <ExchangeCard key={exchange.id} exchange={exchange} />
                          ))}
                        </div>
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
