'use client';

import { DetachedSheet } from '@/components/ui/detached-sheet';
import { formatSelectedTimezone } from '@/lib/utils/timezone';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TimezoneSheet from './timezone-sheet';

const WHEEL_ITEM_HEIGHT = 44;
const WHEEL_CONTAINER_HEIGHT = 176;
const WHEEL_VERTICAL_PADDING = (WHEEL_CONTAINER_HEIGHT - WHEEL_ITEM_HEIGHT) / 2;
const WHEEL_TOP_PADDING = 88; // h-22 in Tailwind (5.5rem = 88px)

interface ScrollWheelProps<T extends number | string> {
  values: T[];
  selectedValue: T;
  onValueChange: (value: T) => void;
  formatValue?: (value: T) => string;
}

function ScrollWheel<T extends number | string>({
  values,
  selectedValue,
  onValueChange,
  formatValue,
}: ScrollWheelProps<T>) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUserScrolling = useRef(false);

  // Scroll to the selected value when it changes (only when not user-scrolling)
  useEffect(() => {
    if (wheelRef.current && !isUserScrolling.current) {
      const selectedIndex = values.indexOf(selectedValue);
      if (selectedIndex >= 0) {
        // Use the working scroll calculation from the duplicate version
        const scrollTop = selectedIndex * WHEEL_ITEM_HEIGHT - WHEEL_CONTAINER_HEIGHT / 2 + WHEEL_ITEM_HEIGHT / 2;
        wheelRef.current.scrollTo({ top: Math.max(0, scrollTop), behavior: 'auto' });
      }
    }
  }, [selectedValue, values]);

  const handleScroll = useCallback(() => {
    if (!wheelRef.current) {
      return;
    }

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    isUserScrolling.current = true;

    scrollTimeoutRef.current = setTimeout(() => {
      if (!wheelRef.current) return;
      isUserScrolling.current = false;

      const scrollTop = wheelRef.current.scrollTop;
      // Use the working center calculation with the constant instead of magic number
      const centerOffset = scrollTop + WHEEL_CONTAINER_HEIGHT / 2;
      const index = Math.round((centerOffset - WHEEL_TOP_PADDING - WHEEL_ITEM_HEIGHT / 2) / WHEEL_ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(values.length - 1, index));

      if (values[clampedIndex] !== selectedValue) {
        onValueChange(values[clampedIndex]);
      }
    }, 80);
  }, [values, selectedValue, onValueChange]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className='relative h-44 overflow-hidden'>
      {/* Gradient overlays */}
      <div className='pointer-events-none absolute left-0 right-0 top-0 z-10 h-11 bg-gradient-to-b from-white to-transparent' />
      <div className='pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-11 bg-gradient-to-t from-white to-transparent' />

      {/* Selection indicator */}
      <div className='pointer-events-none absolute left-0 right-0 top-1/2 z-10 h-11 -translate-y-1/2 border-y border-gray-200/80' />

      <div
        ref={wheelRef}
        className='scrollbar-hide h-full overflow-y-auto'
        style={{
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorY: 'contain',
          touchAction: 'pan-y',
        }}
        onScroll={handleScroll}
        onWheel={(event) => event.stopPropagation()}
      >
        {/* Padding top */}
        <div className='h-22' />

        {values.map((value) => (
          <button
            key={String(value)}
            type='button'
            onClick={() => {
              onValueChange(value);
            }}
            className={`flex h-11 w-full items-center justify-center rounded-lg text-lg font-medium transition-colors ${
              selectedValue === value
                ? 'border border-gray-200 bg-gray-100 text-gray-900'
                : 'text-gray-400 hover:text-gray-500'
            }`}
            style={{
              scrollSnapAlign: 'center',
            }}
          >
            {formatValue ? formatValue(value) : value}
          </button>
        ))}

        {/* Padding bottom */}
        <div className='h-22' />
      </div>
    </div>
  );
}

interface TimePickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onTimeSelect: (time: { hour: number; minute: number; period: 'AM' | 'PM' }) => void;
  onTimezoneSelect: (timezone: string) => void;
  selectedTime?: { hour: number; minute: number; period: 'AM' | 'PM' };
  timezone: string;
  title: string;
}

export default function TimePickerSheet({
  isOpen,
  onClose,
  onTimeSelect,
  onTimezoneSelect,
  selectedTime,
  timezone,
  title,
}: TimePickerSheetProps) {
  const [hour, setHour] = useState(selectedTime?.hour ?? 9);
  const [minute, setMinute] = useState(selectedTime?.minute ?? 45);
  const [period, setPeriod] = useState<'AM' | 'PM'>(selectedTime?.period ?? 'AM');

  // Memoize arrays to prevent recreation on every render
  const hours = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const minutes = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);

  useEffect(() => {
    if (!isOpen) return;

    setHour(selectedTime?.hour ?? 9);
    setMinute(selectedTime?.minute ?? 45);
    setPeriod(selectedTime?.period ?? 'AM');
  }, [isOpen, selectedTime]);

  const handleSave = () => {
    onTimeSelect({ hour, minute, period });
    onClose();
  };

  const handleClear = () => {
    setHour(9);
    setMinute(45);
    setPeriod('AM');
    onTimeSelect({ hour: 9, minute: 45, period: 'AM' });
    onClose();
  };


  const [showTimezoneSheet, setShowTimezoneSheet] = useState(false);

  return (
    <DetachedSheet.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && onClose()}
    >
      <DetachedSheet.Portal>
        <DetachedSheet.View>
          <DetachedSheet.Backdrop />
          <DetachedSheet.Content>
            <div className='p-6'>
              {/* Handle */}
              <div className='mb-4 flex justify-center'>
                <DetachedSheet.Handle />
              </div>

              {/* Header */}
              <div className='mb-6'>
                <div className='flex items-center justify-between'>
                  <button type='button' onClick={onClose} className='font-medium text-red-500'>
                    Cancel
                  </button>
                  <div className='text-center'>
                    <h2 className='text-lg font-semibold'>{title}</h2>
                    <p className='whitespace-pre-line text-sm text-gray-500'>
                      {`${hour.toString().padStart(2, '0')}:${minute
                        .toString()
                        .padStart(2, '0')} ${period}`}
                    </p>
                  </div>
                  <button
                    type='button'
                    onClick={handleSave}
                    className='rounded-xl bg-red-500 px-4 py-2 font-medium text-white'
                  >
                    Save
                  </button>
                </div>
              </div>

              {/* Time Wheels */}
              <div className='pb-4'>
                <div className='grid grid-cols-3 gap-4'>
                  {/* Hour Wheel */}
                  <div className='text-center'>
                    <ScrollWheel
                      values={hours}
                      selectedValue={hour}
                      onValueChange={setHour}
                      formatValue={(value) => value.toString().padStart(2, '0')}
                    />
                  </div>

                  {/* Minute Wheel */}
                  <div className='text-center'>
                    <ScrollWheel
                      values={minutes}
                      selectedValue={minute}
                      onValueChange={setMinute}
                      formatValue={(value) => value.toString().padStart(2, '0')}
                    />
                  </div>

                  {/* AM/PM Toggle Buttons */}
                  <div className='flex h-44 flex-col items-center justify-center gap-2'>
                    <button
                      type='button'
                      onClick={() => setPeriod('AM')}
                      className={`h-10 w-16 rounded-lg border text-lg font-medium transition-colors ${
                        period === 'AM'
                          ? 'border-gray-300 bg-gray-100 text-gray-900'
                          : 'border-gray-200 bg-transparent text-gray-400'
                      } `}
                    >
                      AM
                    </button>
                    <button
                      type='button'
                      onClick={() => setPeriod('PM')}
                      className={`h-10 w-16 rounded-lg border text-lg font-medium transition-colors ${
                        period === 'PM'
                          ? 'border-gray-300 bg-gray-100 text-gray-900'
                          : 'border-gray-200 bg-transparent text-gray-400'
                      } `}
                    >
                      PM
                    </button>
                  </div>
                </div>
              </div>

              {/* Timezone Button */}
              <div className='pb-4'>
                <button
                  type='button'
                  onClick={() => setShowTimezoneSheet(true)}
                  className='w-full rounded-xl bg-red-100 p-3 font-medium text-red-600'
                >
                  Timezone: {formatSelectedTimezone(timezone)}
                </button>
              </div>

              {/* Clear Button */}
              <div className='border-t border-gray-100 pt-4'>
                <button
                  type='button'
                  onClick={handleClear}
                  className='w-full py-3 font-medium text-red-500'
                >
                  Clear Time
                </button>
              </div>
            </div>

            <style jsx>{`
              .scrollbar-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
                -webkit-overflow-scrolling: touch;
                overscroll-behavior: contain;
              }
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}</style>

            {/* Nested Timezone Sheet */}
            <TimezoneSheet
              isOpen={showTimezoneSheet}
              onClose={() => setShowTimezoneSheet(false)}
              onTimezoneSelect={(tz) => {
                onTimezoneSelect(tz);
                setShowTimezoneSheet(false);
              }}
              selectedTimezone={timezone}
            />
          </DetachedSheet.Content>
        </DetachedSheet.View>
      </DetachedSheet.Portal>
    </DetachedSheet.Root>
  );
}
