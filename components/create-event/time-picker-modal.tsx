"use client";

import { useState, useRef, useEffect } from "react";

interface TimePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTimeSelect: (time: {
    hour: number;
    minute: number;
    period: "AM" | "PM";
  }) => void;
  onTimezoneClick: () => void;
  selectedTime?: { hour: number; minute: number; period: "AM" | "PM" };
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
  const [period, setPeriod] = useState<"AM" | "PM">(
    selectedTime?.period || "AM"
  );

  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);
  const periodRef = useRef<HTMLDivElement>(null);

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

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const periods = ["AM", "PM"];

  const formatTime = () => {
    return `${title}\n${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")} ${period}`;
  };

  const handleSave = () => {
    onTimeSelect({ hour, minute, period });
    onClose();
  };

  const handleClear = () => {
    setHour(9);
    setMinute(45);
    setPeriod("AM");
    onTimeSelect({ hour: 9, minute: 45, period: "AM" });
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
      <div className="relative h-44 overflow-hidden">
        {/* Gradient overlays */}
        <div className="absolute top-0 left-0 right-0 h-11 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-11 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />

        {/* Selection indicator */}
        <div className="absolute top-1/2 left-0 right-0 h-11 -mt-5.5 border-t border-b border-gray-200 pointer-events-none z-10" />

        <div
          ref={wheelRef}
          className="h-full overflow-y-auto scrollbar-hide"
          style={{ scrollSnapType: "y mandatory" }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
        >
          {/* Padding top */}
          <div className="h-22" />

          {values.map((value, index) => (
            <button
              key={index}
              onClick={() => onValueChange(value)}
              className={`
                w-full h-11 flex items-center justify-center text-lg font-medium
                ${selectedValue === value ? "text-gray-900" : "text-gray-400"}
              `}
              style={{ scrollSnapAlign: "center" }}
            >
              {formatValue ? formatValue(value) : value}
            </button>
          ))}

          {/* Padding bottom */}
          <div className="h-22" />
        </div>
      </div>
    );
  };

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
          <div className="flex items-center justify-between mb-6">
            <button onClick={onClose} className="text-orange-500 font-medium">
              Cancel
            </button>
            <div className="text-center">
              <h2 className="font-semibold text-lg">{title}</h2>
              <p className="text-gray-500 text-sm whitespace-pre-line">
                {`${hour.toString().padStart(2, "0")}:${minute
                  .toString()
                  .padStart(2, "0")} ${period}`}
              </p>
            </div>
            <button
              onClick={handleSave}
              className="bg-orange-500 text-white px-4 py-2 rounded-xl font-medium"
            >
              Save
            </button>
          </div>
        </div>

        {/* Time Wheels */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Hour Wheel */}
            <div className="text-center">
              <ScrollWheel
                values={hours}
                selectedValue={hour}
                onValueChange={setHour}
                formatValue={(value) => value.toString().padStart(2, "0")}
              />
            </div>

            {/* Minute Wheel */}
            <div className="text-center">
              <ScrollWheel
                values={minutes}
                selectedValue={minute}
                onValueChange={setMinute}
                formatValue={(value) => value.toString().padStart(2, "0")}
              />
            </div>

            {/* Period Wheel */}
            <div className="text-center">
              <ScrollWheel
                values={periods}
                selectedValue={period}
                onValueChange={setPeriod}
              />
            </div>
          </div>
        </div>

        {/* Timezone Button */}
        <div className="px-6 pb-4">
          <button
            onClick={onTimezoneClick}
            className="w-full p-3 bg-orange-100 text-orange-600 rounded-xl font-medium"
          >
            Timezone: {timezone}
          </button>
        </div>

        {/* Clear Button */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleClear}
            className="w-full py-3 text-red-500 font-medium"
          >
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
