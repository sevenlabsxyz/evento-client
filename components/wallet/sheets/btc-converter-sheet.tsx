import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { BTCPriceService } from '@/lib/services/btc-price';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

type BTCConverterSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const SATS_PER_BTC = 100_000_000;

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
                    <h2 className='text-xl font-semibold'>BTC Converter</h2>
                    <button onClick={() => onOpenChange(false)}>
                      <X className='h-5 w-5 text-gray-500' />
                    </button>
                  </div>

                  {/* Content */}
                  <div className='bg-gray-50 px-4 py-6'>
                    {isLoading ? (
                      <div className='flex items-center justify-center py-12'>
                        <div className='text-gray-500'>Loading BTC price...</div>
                      </div>
                    ) : (
                      <div className='space-y-4'>
                        {/* BTC Price Display */}
                        <div className='rounded-2xl bg-white p-4 text-center shadow-sm'>
                          <div className='text-sm text-gray-500'>Current BTC Price</div>
                          <div className='text-2xl font-bold text-gray-900'>
                            $
                            {btcPrice.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </div>
                        </div>

                        {/* USD Input */}
                        <div className='space-y-2'>
                          <label className='block text-sm font-medium text-gray-700'>USD</label>
                          <div className='relative'>
                            <span className='absolute left-4 top-1/2 -translate-y-1/2 text-lg text-gray-500'>
                              $
                            </span>
                            <input
                              type='number'
                              value={usdValue}
                              onChange={(e) => handleUsdChange(e.target.value)}
                              className='w-full rounded-xl border border-gray-200 bg-white py-4 pl-8 pr-4 text-lg font-semibold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                              placeholder='0.00'
                              step='0.01'
                            />
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
                              className='w-full rounded-xl border border-gray-200 bg-white py-4 pl-8 pr-4 text-lg font-semibold focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500'
                              placeholder='0.00000000'
                              step='0.00000001'
                            />
                          </div>
                        </div>

                        {/* SATS Input */}
                        <div className='space-y-2'>
                          <label className='block text-sm font-medium text-gray-700'>
                            Satoshis
                          </label>
                          <input
                            type='number'
                            value={satsValue}
                            onChange={(e) => handleSatsChange(e.target.value)}
                            className='w-full rounded-xl border border-gray-200 bg-white px-4 py-4 text-lg font-semibold focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500'
                            placeholder='0'
                            step='1'
                          />
                        </div>

                        {/* Info Text */}
                        <div className='mt-6 rounded-xl bg-blue-50 p-4 text-sm text-blue-700'>
                          <p className='font-medium'>💡 Quick Reference</p>
                          <p className='mt-1'>1 BTC = 100,000,000 satoshis (sats)</p>
                          <p className='mt-1'>Prices update every 5 minutes</p>
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
