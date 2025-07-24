'use client';

import { DetachedSheet } from '@/components/ui/detached-sheet';
import { useEffect, useState } from 'react';

interface DatePickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onDateSelect: (date: Date) => void;
  selectedDate?: Date;
  title: string;
  referenceDate?: Date; // For showing start date in end date picker
}

export default function DatePickerSheet({
  isOpen,
  onClose,
  onDateSelect,
  selectedDate,
  title,
  referenceDate,
}: DatePickerSheetProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  const [viewMonth, setViewMonth] = useState(currentDate.getMonth());
  const [viewYear, setViewYear] = useState(currentDate.getFullYear());

  // Sync currentDate with selectedDate when prop changes or sheet opens
  useEffect(() => {
    if (isOpen) {
      const dateToUse = selectedDate || new Date();
      setCurrentDate(dateToUse);
      setViewMonth(dateToUse.getMonth());
      setViewYear(dateToUse.getFullYear());
    }
  }, [selectedDate, isOpen]);

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(viewMonth, viewYear);
    const firstDay = getFirstDayOfMonth(viewMonth, viewYear);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const isSelectedDate = (day: number) => {
    if (!day) return false;
    return (
      currentDate.getDate() === day &&
      currentDate.getMonth() === viewMonth &&
      currentDate.getFullYear() === viewYear
    );
  };

  const isToday = (day: number) => {
    if (!day) return false;
    const today = new Date();
    return (
      today.getDate() === day && today.getMonth() === viewMonth && today.getFullYear() === viewYear
    );
  };

  const isReferenceDate = (day: number) => {
    if (!day || !referenceDate) return false;
    return (
      referenceDate.getDate() === day &&
      referenceDate.getMonth() === viewMonth &&
      referenceDate.getFullYear() === viewYear
    );
  };

  const handleDateClick = (day: number) => {
    if (!day) return;
    const newDate = new Date(viewYear, viewMonth, day);
    setCurrentDate(newDate);
  };

  const handleSave = () => {
    onDateSelect(currentDate);
    onClose();
  };

  const handleClear = () => {
    onDateSelect(new Date());
    onClose();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (viewMonth === 0) {
        setViewMonth(11);
        setViewYear(viewYear - 1);
      } else {
        setViewMonth(viewMonth - 1);
      }
    } else {
      if (viewMonth === 11) {
        setViewMonth(0);
        setViewYear(viewYear + 1);
      } else {
        setViewMonth(viewMonth + 1);
      }
    }
  };

  const calendarDays = generateCalendarDays();

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
              <div className='mb-4'>
                <div className='mb-4 flex items-center justify-between'>
                  <button onClick={onClose} className='font-medium text-red-500'>
                    Cancel
                  </button>
                  <div className='text-center'>
                    <h2 className='text-lg font-semibold'>{title}</h2>
                    <p className='text-sm text-gray-500'>
                      {currentDate.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: '2-digit',
                      })}
                    </p>
                  </div>
                  <button
                    onClick={handleSave}
                    className='rounded-xl bg-red-500 px-4 py-2 font-medium text-white'
                  >
                    Save
                  </button>
                </div>

                {/* Month/Year Navigation */}
                <div className='mb-4 flex items-center justify-between'>
                  <button
                    onClick={() => navigateMonth('prev')}
                    className='rounded-lg p-2 hover:bg-gray-100'
                  >
                    ←
                  </button>
                  <h3 className='text-lg font-semibold'>
                    {monthNames[viewMonth]} {viewYear}
                  </h3>
                  <button
                    onClick={() => navigateMonth('next')}
                    className='rounded-lg p-2 hover:bg-gray-100'
                  >
                    →
                  </button>
                </div>

                {/* Days of Week Header */}
                <div className='mb-2 grid grid-cols-7 gap-1'>
                  {daysOfWeek.map((day) => (
                    <div key={day} className='py-2 text-center text-xs font-medium text-gray-500'>
                      {day}
                    </div>
                  ))}
                </div>
              </div>

              {/* Calendar Grid */}
              <div className='pb-4'>
                <div className='grid grid-cols-7 gap-1'>
                  {calendarDays.map((day, index) => (
                    <button
                      key={index}
                      onClick={() => handleDateClick(day)}
                      disabled={!day}
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-all ${!day ? 'invisible' : ''} ${
                        isSelectedDate(day)
                          ? 'bg-red-500 text-white shadow-md ring-2 ring-red-500 ring-offset-2'
                          : isReferenceDate(day)
                            ? 'bg-blue-500 text-white shadow-md ring-2 ring-blue-500 ring-offset-2'
                            : isToday(day)
                              ? 'border border-gray-200 bg-gray-100 text-black'
                              : 'hover:bg-gray-100'
                      } `}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </DetachedSheet.Content>
        </DetachedSheet.View>
      </DetachedSheet.Portal>
    </DetachedSheet.Root>
  );
}
