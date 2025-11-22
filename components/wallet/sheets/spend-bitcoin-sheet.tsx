import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { X } from 'lucide-react';

type SpendBitcoinSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SpendBitcoinSheet({ open, onOpenChange }: SpendBitcoinSheetProps) {
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
                    <h2 className='text-xl font-semibold'>Spend Bitcoin</h2>
                    <button onClick={() => onOpenChange(false)}>
                      <X className='h-5 w-5 text-gray-500' />
                    </button>
                  </div>

                  {/* Content */}
                  <div className='flex items-center justify-center bg-gray-50 px-4 py-6'>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-gray-900'>Bitrefill</div>
                      <p className='mt-2 text-sm text-gray-500'>
                        Coming soon - Spend your Bitcoin on gift cards and more
                      </p>
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
