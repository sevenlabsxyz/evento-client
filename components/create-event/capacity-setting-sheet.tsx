import { SheetWithDetent } from '@/components/ui/sheet-with-detent';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface CapacitySettingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (capacity: string) => void;
  initialCapacity?: string;
}

export default function CapacitySettingSheet({
  isOpen,
  onClose,
  onSave,
  initialCapacity = '',
}: CapacitySettingSheetProps) {
  const t = useTranslations('createEvent');
  const tCommon = useTranslations('common');
  const [capacity, setCapacity] = useState(initialCapacity);
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!capacity.trim()) {
      setError(t('capacity.required'));
      return;
    }

    const num = parseInt(capacity.trim());
    if (isNaN(num) || num <= 0) {
      setError(t('capacity.invalid'));
      return;
    }

    onSave(capacity.trim());
  };

  const handleClose = () => {
    setCapacity(initialCapacity);
    setError('');
    onClose();
  };

  const quickNumbers = [5, 10, 25, 100];

  const handleQuickSelect = (num: number) => {
    setCapacity(num.toString());
    setError('');
  };

  return (
    <SheetWithDetent.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && handleClose()}
    >
      <SheetWithDetent.Portal>
        <SheetWithDetent.View>
          <SheetWithDetent.Backdrop />
          <SheetWithDetent.Content>
            <div className='p-6'>
              {/* Handle */}
              <div className='mb-4 flex justify-center'>
                <SheetWithDetent.Handle />
              </div>

              {/* Header */}
              <div className='mb-6'>
                <div className='mb-6 flex items-center justify-between'>
                  <button
                    onClick={handleClose}
                    className='font-medium text-red-500 dark:text-red-400'
                  >
                    {tCommon('actions.cancel')}
                  </button>
                  <h2 className='text-lg font-semibold'>{t('capacity.title')}</h2>
                  <button
                    onClick={handleSave}
                    className='rounded-xl bg-red-500 px-4 py-2 font-medium text-white dark:bg-red-600'
                  >
                    {tCommon('actions.save')}
                  </button>
                </div>
              </div>

              {/* Form */}
              <div className='space-y-4'>
                <div className='space-y-2'>
                  <label className='text-sm font-medium text-gray-700 dark:text-neutral-300'>
                    {t('capacity.label')}
                  </label>

                  {/* Quick select buttons */}
                  <div className='mb-3 flex gap-2'>
                    {quickNumbers.map((num) => (
                      <button
                        key={num}
                        onClick={() => handleQuickSelect(num)}
                        className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          capacity === num.toString()
                            ? 'bg-red-500 text-white dark:bg-red-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  <input
                    type='number'
                    value={capacity}
                    onChange={(e) => {
                      setCapacity(e.target.value);
                      setError('');
                    }}
                    placeholder={t('capacity.placeholder')}
                    className='w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500'
                    min='1'
                    autoFocus
                  />
                  {error && <p className='mt-1 text-sm text-red-500 dark:text-red-400'>{error}</p>}
                </div>
              </div>
            </div>
          </SheetWithDetent.Content>
        </SheetWithDetent.View>
      </SheetWithDetent.Portal>
    </SheetWithDetent.Root>
  );
}
