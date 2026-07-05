import { CircledIconButton } from '@/components/circled-icon-button';
import { CashAppSVGIcon } from '@/components/icons/cashapp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { WalletBalanceDisplay } from '@/components/wallet/wallet-balance-display';
import { GLOBAL_EXCHANGES, getExchangesForCountry, type Exchange } from '@/lib/constants/exchanges';
import { breezSDK } from '@/lib/services/breez-sdk';
import { BTCPriceService } from '@/lib/services/btc-price';
import { detectUserCountry } from '@/lib/utils/geo-detection';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import { ArrowUpRight, CheckCircle2, Loader2, MapPin, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

type BuySellBitcoinSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cashAppEnabled?: boolean;
  onFundingStarted?: () => void | Promise<void>;
};

const CASH_APP_USD_PRESETS = [10, 25, 50, 100];

export function BuySellBitcoinSheet({
  open,
  onOpenChange,
  cashAppEnabled = false,
  onFundingStarted,
}: BuySellBitcoinSheetProps) {
  const [countryCode, setCountryCode] = useState<string>('US');
  const [regionalExchanges, setRegionalExchanges] = useState<Exchange[]>([]);
  const [isDetecting, setIsDetecting] = useState(true);
  const [amountUsd, setAmountUsd] = useState('25');
  const [amountSats, setAmountSats] = useState<number | null>(null);
  const [isConvertingAmount, setIsConvertingAmount] = useState(false);
  const [isStartingCashApp, setIsStartingCashApp] = useState(false);
  const [hasOpenedCashApp, setHasOpenedCashApp] = useState(false);
  const [cashAppUrl, setCashAppUrl] = useState<string | null>(null);

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

  useEffect(() => {
    if (!open || !cashAppEnabled) {
      return;
    }

    const usd = Number(amountUsd);
    if (!Number.isFinite(usd) || usd <= 0) {
      setAmountSats(null);
      return;
    }

    let isMounted = true;

    async function convertAmount() {
      try {
        setIsConvertingAmount(true);
        const sats = await BTCPriceService.usdToSats(usd);
        if (isMounted) {
          setAmountSats(sats);
        }
      } catch (error) {
        logger.error('Failed to convert Cash App buy amount', {
          error: error instanceof Error ? error.message : String(error),
        });
        if (isMounted) {
          setAmountSats(null);
        }
      } finally {
        if (isMounted) {
          setIsConvertingAmount(false);
        }
      }
    }

    convertAmount();

    return () => {
      isMounted = false;
    };
  }, [amountUsd, cashAppEnabled, open]);

  const handleStartCashAppBuy = async () => {
    if (!amountSats || amountSats <= 0) {
      toast.error('Enter an amount to buy');
      return;
    }

    if (!breezSDK.isConnected()) {
      toast.error('Unlock your wallet first');
      return;
    }

    try {
      setIsStartingCashApp(true);
      const response = await breezSDK.buyBitcoinWithCashApp(amountSats);
      setCashAppUrl(response.url);
      setHasOpenedCashApp(true);

      const popup = window.open(response.url, '_blank');
      if (popup) {
        popup.opener = null;
      } else {
        toast.info('Cash App is ready. Tap Open Cash App to continue.');
      }

      await onFundingStarted?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start Cash App purchase');
    } finally {
      setIsStartingCashApp(false);
    }
  };

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
                    <h2 className='text-xl font-semibold'>
                      {cashAppEnabled ? 'Buy Bitcoin' : 'Buy/Sell Bitcoin'}
                    </h2>
                    <div className='flex items-center gap-3'>
                      <WalletBalanceDisplay />
                      <button onClick={() => onOpenChange(false)}>
                        <X className='h-5 w-5 text-gray-500' />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className='bg-white px-4 py-6'>
                    {cashAppEnabled ? (
                      <div className='space-y-6'>
                        <div className='rounded-2xl border border-gray-200 bg-gray-50 p-4'>
                          <div className='flex items-center gap-3'>
                            <div className='flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl'>
                              <CashAppSVGIcon className='h-12 w-12' />
                            </div>
                            <div>
                              <h3 className='font-semibold text-gray-900'>Cash App</h3>
                              <p className='text-sm text-gray-600'>
                                Buy Bitcoin in Cash App and send it to your Evento wallet.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className='space-y-3'>
                          <h3 className='font-semibold text-gray-900'>Amount</h3>
                          <div className='grid grid-cols-4 gap-2'>
                            {CASH_APP_USD_PRESETS.map((preset) => (
                              <Button
                                key={preset}
                                type='button'
                                variant={amountUsd === String(preset) ? 'default' : 'outline'}
                                className='h-11 rounded-full'
                                onClick={() => setAmountUsd(String(preset))}
                              >
                                ${preset}
                              </Button>
                            ))}
                          </div>
                          <div className='relative'>
                            <span className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-500'>
                              $
                            </span>
                            <Input
                              inputMode='decimal'
                              min='1'
                              type='number'
                              value={amountUsd}
                              onChange={(event) => setAmountUsd(event.target.value)}
                              className='h-12 rounded-full pl-8 text-base'
                            />
                          </div>
                          <p className='text-sm text-gray-600'>
                            {isConvertingAmount ? (
                              <span className='inline-flex items-center gap-2'>
                                <Loader2 className='h-4 w-4 animate-spin' />
                                Estimating sats...
                              </span>
                            ) : amountSats ? (
                              `Estimated ${amountSats.toLocaleString()} sats`
                            ) : (
                              'Enter a USD amount to estimate sats.'
                            )}
                          </p>
                        </div>

                        <div className='rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900'>
                          Cash App will open to complete the purchase. Bitcoin arrives after the
                          network confirms it, and your balance updates when the deposit is claimed.
                        </div>

                        {hasOpenedCashApp && (
                          <div className='flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4'>
                            <CheckCircle2 className='mt-0.5 h-5 w-5 flex-shrink-0 text-green-600' />
                            <div>
                              <h3 className='font-semibold text-green-900'>Waiting for deposit</h3>
                              <p className='text-sm text-green-800'>
                                You can leave this screen. Evento will update your balance when the
                                Bitcoin lands.
                              </p>
                              {cashAppUrl && (
                                <Button
                                  type='button'
                                  variant='outline'
                                  className='mt-3 h-10 rounded-full border-green-200 bg-white'
                                  onClick={() => {
                                    const popup = window.open(cashAppUrl, '_blank');
                                    if (popup) {
                                      popup.opener = null;
                                    }
                                  }}
                                >
                                  Open Cash App
                                </Button>
                              )}
                            </div>
                          </div>
                        )}

                        <Button
                          type='button'
                          className='h-12 w-full rounded-full font-semibold'
                          disabled={!amountSats || isConvertingAmount || isStartingCashApp}
                          onClick={handleStartCashAppBuy}
                        >
                          {isStartingCashApp ? (
                            <>
                              <Loader2 className='h-5 w-5 animate-spin' />
                              Opening Cash App
                            </>
                          ) : (
                            <>
                              <CashAppSVGIcon className='h-5 w-5' />
                              Continue with Cash App
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className='space-y-6'>
                        {/* Regional Exchanges */}
                        <div className='space-y-3'>
                          <div className='flex items-center gap-2'>
                            <MapPin className='h-4 w-4 text-gray-500' />
                            <h3 className='font-semibold text-gray-900'>
                              Available in Your Region
                            </h3>
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
