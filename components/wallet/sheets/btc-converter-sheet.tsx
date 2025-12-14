import { NumberTicker } from '@/components/ui/number-ticker';
import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { BTCPriceService } from '@/lib/services/btc-price';
import { toast } from '@/lib/utils/toast';
import { Copy, X } from 'lucide-react';
import { useEffect, useState } from 'react';

type BTCConverterSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const SATS_PER_BTC = 100_000_000;

// Helper function to format number with thousands separators
const formatWithCommas = (value: string): string => {
  const numericValue = value.replace(/,/g, '');
  const parts = numericValue.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

// Helper function to parse value and remove commas
const parseNumericValue = (value: string): string => {
  return value.replace(/,/g, '');
};

export function BTCConverterSheet({ open, onOpenChange }: BTCConverterSheetProps) {
  const [usdValue, setUsdValue] = useState<string>('10');
  const [btcValue, setBtcValue] = useState<string>('0');
  const [satsValue, setSatsValue] = useState<string>('0');
  const [btcPrice, setBtcPrice] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch BTC price on mount
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setIsLoading(true);
        const price = await BTCPriceService.fetchPrice();
        setBtcPrice(price.usd);

        // Initialize with default USD value
        handleUsdChange('10', price.usd);
      } catch (error) {
        console.error('Failed to fetch BTC price:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      fetchPrice();
    }
  }, [open]);

  const handleUsdChange = (value: string, price: number = btcPrice) => {
    setUsdValue(value);
    const usd = parseFloat(value) || 0;

    if (price > 0) {
      const btc = usd / price;
      const sats = Math.round(btc * SATS_PER_BTC);

      setBtcValue(btc.toFixed(8));
      setSatsValue(sats.toString());
    }
  };

  const handleBtcChange = (value: string) => {
    setBtcValue(value);
    const btc = parseFloat(value) || 0;

    const sats = Math.round(btc * SATS_PER_BTC);
    const usd = btc * btcPrice;

    setSatsValue(sats.toString());
    setUsdValue(usd.toFixed(2));
  };

  const handleSatsChange = (value: string) => {
    setSatsValue(value);
    const sats = parseFloat(value) || 0;

    const btc = sats / SATS_PER_BTC;
    const usd = btc * btcPrice;

    setBtcValue(btc.toFixed(8));
    setUsdValue(usd.toFixed(2));
  };

  const handleCopyUsd = async () => {
    try {
      await navigator.clipboard.writeText(usdValue);
      toast.success('USD value copied!');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleCopyBtc = async () => {
    try {
      await navigator.clipboard.writeText(btcValue);
      toast.success('BTC value copied!');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleCopySats = async () => {
    try {
      await navigator.clipboard.writeText(satsValue);
      toast.success('SATS value copied!');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  return (
    <SheetWithDetentFull.Root presented={open} onPresentedChange={onOpenChange}>
      <SheetWithDetentFull.Portal>
        <SheetWithDetentFull.View>
          <SheetWithDetentFull.Backdrop />
          <SheetWithDetentFull.Content className='grid h-full grid-rows-[1fr] md:!max-w-[500px]'>
            <SheetWithDetentFull.ScrollRoot asChild>
              <SheetWithDetentFull.ScrollView className='min-h-0'>
                <SheetWithDetentFull.ScrollContent>
                  {/* Handle */}
                  <div className='my-4 flex items-center'>
                    <SheetWithDetentFull.Handle className='mx-auto h-1 w-12 rounded-full bg-gray-300' />
                  </div>

                  {/* Header */}
                  <div className='flex items-center justify-between bg-white px-4 py-3'>
                    <div className='flex-1'>
                      <div className='text-2xl font-bold text-gray-900'>
                        $<NumberTicker value={btcPrice} />
                      </div>
                      <div className='text-sm text-gray-500'>Current BTC Price</div>
                    </div>
                    <button onClick={() => onOpenChange(false)}>
                      <X className='h-5 w-5 text-gray-500' />
                    </button>
                  </div>

                  {/* Content */}
                  <div className='bg-white px-4 py-6'>
                    {isLoading ? (
                      <div className='flex items-center justify-center py-12'>
                        <div className='text-gray-500'>Loading BTC price...</div>
                      </div>
                    ) : (
                      <div className='space-y-2'>
                        {/* USD Input */}
                        <div className='space-y-2'>
                          <label className='block text-sm font-medium text-gray-700'>USD</label>
                          <div className='relative'>
                            <span className='absolute left-4 top-1/2 -translate-y-1/2 text-lg text-gray-500'>
                              $
                            </span>
                            <input
                              type='text'
                              value={formatWithCommas(usdValue)}
                              onChange={(e) => {
                                const parsed = parseNumericValue(e.target.value);
                                handleUsdChange(parsed);
                              }}
                              className='w-full rounded-xl border border-gray-200 bg-gray-50 py-4 pl-8 pr-12 text-lg font-semibold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                              placeholder='0.00'
                            />
                            <button
                              onClick={handleCopyUsd}
                              className='absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700'
                            >
                              <Copy className='h-4 w-4' />
                            </button>
                          </div>
                        </div>

                        {/* BTC Input */}
                        <div className='space-y-2'>
                          <label className='block text-sm font-medium text-gray-700'>BTC</label>
                          <div className='relative'>
                            <span className='absolute left-4 top-1/2 -translate-y-1/2 text-lg text-gray-500'>
                              ₿
                            </span>
                            <input
                              type='number'
                              value={btcValue}
                              onChange={(e) => handleBtcChange(e.target.value)}
                              className='w-full rounded-xl border border-gray-200 bg-gray-50 py-4 pl-8 pr-12 text-lg font-semibold focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500'
                              placeholder='0.00000000'
                              step='0.00000001'
                            />
                            <button
                              onClick={handleCopyBtc}
                              className='absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700'
                            >
                              <Copy className='h-4 w-4' />
                            </button>
                          </div>
                        </div>

                        {/* SATS Input */}
                        <div className='space-y-2'>
                          <label className='block text-sm font-medium text-gray-700'>
                            Satoshis (sats)
                          </label>
                          <div className='relative'>
                            <input
                              type='text'
                              value={formatWithCommas(satsValue)}
                              onChange={(e) => {
                                const parsed = parseNumericValue(e.target.value);
                                handleSatsChange(parsed);
                              }}
                              className='w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 pr-12 text-lg font-semibold focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500'
                              placeholder='0'
                            />
                            <button
                              onClick={handleCopySats}
                              className='absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700'
                            >
                              <Copy className='h-4 w-4' />
                            </button>
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
