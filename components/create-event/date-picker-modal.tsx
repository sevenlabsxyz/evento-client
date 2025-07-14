"use client";

import { useState, useEffect } from "react";

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDateSelect: (date: Date) => void;
  selectedDate?: Date;
  title: string;
}

export default function DatePickerModal({
  isOpen,
  onClose,
  onDateSelect,
  selectedDate,
  title,
}: DatePickerModalProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  const [viewMonth, setViewMonth] = useState(currentDate.getMonth());
  const [viewYear, setViewYear] = useState(currentDate.getFullYear());

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

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
    if (!selectedDate || !day) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getFullYear() === viewYear
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

  const navigateMonth = (direction: "prev" | "next") => {
    if (direction === "prev") {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl w-full md:max-w-sm mx-2 md:mx-4 shadow-2xl">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={onClose} className="text-red-500 font-medium">
              Cancel
            </button>
            <div className="text-center">
              <h2 className="font-semibold text-lg">{title}</h2>
              <p className="text-gray-500 text-sm">
                {currentDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "2-digit",
                })}
              </p>
            </div>
            <button
              onClick={handleSave}
              className="bg-red-500 text-white px-4 py-2 rounded-xl font-medium"
            >
              Save
            </button>
          </div>

          {/* Month/Year Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth("prev")}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              ←
            </button>
            <h3 className="font-semibold text-lg">
              {monthNames[viewMonth]} {viewYear}
            </h3>
            <button
              onClick={() => navigateMonth("next")}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              →
            </button>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {daysOfWeek.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-gray-500 py-2"
              >
                {day}
              </div>
            ))}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => (
              <button
                key={index}
                onClick={() => handleDateClick(day)}
                disabled={!day}
                className={`
                  h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium
                  ${!day ? "invisible" : ""}
                  ${
                    isSelectedDate(day)
                      ? "bg-red-500 text-white"
                      : "hover:bg-gray-100"
                  }
                `}
              >
                {day}
                {/* Event indicators */}
                {day && day <= 15 && (
                  <div className="absolute mt-6 flex gap-0.5">
                    {day === 3 && (
                      <div className="w-1 h-1 bg-purple-500 rounded-full" />
                    )}
                    {day === 4 && (
                      <>
                        <div className="w-1 h-1 bg-red-500 rounded-full" />
                        <div className="w-1 h-1 bg-red-500 rounded-full" />
                        <div className="w-1 h-1 bg-red-500 rounded-full" />
                      </>
                    )}
                    {day === 5 && (
                      <>
                        <div className="w-1 h-1 bg-red-500 rounded-full" />
                        <div className="w-1 h-1 bg-red-500 rounded-full" />
                      </>
                    )}
                    {day === 9 && (
                      <div className="w-1 h-1 bg-red-500 rounded-full" />
                    )}
                    {day === 11 && (
                      <div className="w-1 h-1 bg-red-500 rounded-full" />
                    )}
                    {day === 15 && (
                      <div className="w-1 h-1 bg-red-500 rounded-full" />
                    )}
                    {day === 16 && (
                      <div className="w-1 h-1 bg-blue-500 rounded-full" />
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Clear Button */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleClear}
            className="w-full py-3 text-red-500 font-medium"
          >
            Clear Date & Time
          </button>
        </div>
      </div>
    </div>
  );
}
