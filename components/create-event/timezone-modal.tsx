'use client';

import { TimezoneData, timezones } from '@/lib/data/timezones';
import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface TimezoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTimezoneSelect: (timezone: string) => void;
  selectedTimezone?: string;
}

export type { TimezoneData };

export default function TimezoneModal({
  isOpen,
  onClose,
  onTimezoneSelect,
  selectedTimezone,
}: TimezoneModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter timezones based on search query
  const filteredTimezones = useMemo(() => {
    if (!searchQuery.trim()) return timezones;

    const query = searchQuery.toLowerCase();
    return timezones.filter(
      (tz) =>
        tz.city.toLowerCase().includes(query) ||
        tz.country.toLowerCase().includes(query) ||
        tz.offset.toLowerCase().includes(query) ||
        tz.value.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleTimezoneSelect = (timezone: TimezoneData) => {
    onTimezoneSelect(`${timezone.offset.replace('GMT', '')}`);
    onClose();
  };

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

  return (
    <div className='fixed inset-0 z-50 bg-white'>
      {/* Header */}
      <div className='flex items-center justify-between border-b border-gray-200 p-4'>
        <button onClick={onClose} className='font-medium text-red-500'>
          Cancel
        </button>
        <h1 className='text-lg font-semibold'>Select Timezone</h1>
        <div className='w-12'></div> {/* Spacer for centering */}
      </div>

      {/* Search Bar */}
      <div className='border-b border-gray-100 px-4 py-3'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400' />
          <input
            type='text'
            placeholder='Search'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full rounded-xl border-none bg-gray-100 py-3 pl-10 pr-4 text-gray-700 placeholder-gray-400 outline-none'
          />
        </div>
      </div>

      {/* Timezone List */}
      <div className='flex-1 overflow-y-auto'>
        {filteredTimezones.map((timezone, index) => (
          <button
            key={index}
            onClick={() => handleTimezoneSelect(timezone)}
            className='w-full border-b border-gray-100 px-4 py-4 text-left hover:bg-gray-50'
          >
            <div className='flex items-center justify-between'>
              <div>
                <p className='font-medium text-gray-900'>
                  {timezone.city}, {timezone.country}
                </p>
              </div>
              <span className='text-sm font-medium text-red-500'>{timezone.offset}</span>
            </div>
          </button>
        ))}

        {filteredTimezones.length === 0 && (
          <div className='flex items-center justify-center py-12'>
            <p className='text-gray-500'>No timezones found</p>
          </div>
        )}
      </div>
    </div>
  );
}
