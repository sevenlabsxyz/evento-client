'use client';

import { useEffect, useRef, useState } from 'react';

interface TimePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTimeSelect: (time: { hour: number; minute: number; period: 'AM' | 'PM' }) => void;
  onTimezoneClick: () => void;
  selectedTime?: { hour: number; minute: number; period: 'AM' | 'PM' };
  timezone: string;
  title: string;
}

export default function TimePickerModal({
  isOpen,
  onClose,
  onTimeSelect,
  onTimezoneClick,
  selectedTime,
  timezone,
  title,
}: TimePickerModalProps) {
  const [hour, setHour] = useState(selectedTime?.hour || 9);
  const [minute, setMinute] = useState(selectedTime?.minute || 45);
  const [period, setPeriod] = useState<'AM' | 'PM'>(selectedTime?.period || 'AM');

  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);
  const periodRef = useRef<HTMLDivElement>(null);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const periods = ['AM', 'PM'];

  const formatTime = () => {
    return `${title}\n${hour.toString().padStart(2, '0')}:${minute
      .toString()
      .padStart(2, '0')} ${period}`;
  };

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

  // Scroll wheel component
  const ScrollWheel = ({
    values,
    selectedValue,
    onValueChange,
    formatValue,
  }: {
    values: (number | string)[];
    selectedValue: number | string;
    onValueChange: (value: any) => void;
    formatValue?: (value: any) => string;
  }) => {
    const wheelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (wheelRef.current) {
        const selectedIndex = values.indexOf(selectedValue);
        const itemHeight = 44; // Height of each item
        const scrollTop = selectedIndex * itemHeight - itemHeight * 2; // Center the selected item
        wheelRef.current.scrollTop = Math.max(0, scrollTop);
      }
    }, [selectedValue, values]);

    return (
      <div className='relative h-44 overflow-hidden'>
        {/* Gradient overlays */}
        <div className='pointer-events-none absolute left-0 right-0 top-0 z-10 h-11 bg-gradient-to-b from-white to-transparent' />
        <div className='pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-11 bg-gradient-to-t from-white to-transparent' />

        {/* Selection indicator */}
        <div className='-mt-5.5 pointer-events-none absolute left-0 right-0 top-1/2 z-10 h-11 border-b border-t border-gray-200' />

        <div
          ref={wheelRef}
          className='scrollbar-hide h-full overflow-y-auto'
          style={{ scrollSnapType: 'y mandatory' }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
        >
          {/* Padding top */}
          <div className='h-22' />

          {values.map((value, index) => (
            <button
              key={index}
              onClick={() => onValueChange(value)}
              className={`flex h-11 w-full items-center justify-center text-lg font-medium ${selectedValue === value ? 'text-gray-900' : 'text-gray-400'} `}
              style={{ scrollSnapAlign: 'center' }}
            >
              {formatValue ? formatValue(value) : value}
            </button>
          ))}

          {/* Padding bottom */}
          <div className='h-22' />
        </div>
      </div>
    );
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center overflow-hidden'>
      {/* Backdrop */}
      <div className='absolute inset-0 bg-black bg-opacity-50' onClick={onClose} />

      {/* Modal */}
      <div className='relative mx-2 w-full rounded-3xl bg-white shadow-2xl md:mx-4 md:max-w-sm'>
        {/* Header */}
        <div className='p-6 pb-4'>
          <div className='mb-6 flex items-center justify-between'>
            <button onClick={onClose} className='font-medium text-red-500'>
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
              onClick={handleSave}
              className='rounded-xl bg-red-500 px-4 py-2 font-medium text-white'
            >
              Save
            </button>
          </div>
        </div>

        {/* Time Wheels */}
        <div className='px-6 pb-4'>
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

            {/* Period Wheel */}
            <div className='text-center'>
              <ScrollWheel values={periods} selectedValue={period} onValueChange={setPeriod} />
            </div>
          </div>
        </div>

        {/* Timezone Button */}
        <div className='px-6 pb-4'>
          <button
            onClick={onTimezoneClick}
            className='w-full rounded-xl bg-red-100 p-3 font-medium text-red-600'
          >
            Timezone: {timezone}
          </button>
        </div>

        {/* Clear Button */}
        <div className='border-t border-gray-100 p-4'>
          <button onClick={handleClear} className='w-full py-3 font-medium text-red-500'>
            Clear Time
          </button>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
