"use client";

import { useState, useRef, useEffect } from "react";
import { DetachedSheet } from "@/components/ui/detached-sheet";
import TimezoneSheet from "./timezone-sheet";

interface TimePickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onTimeSelect: (time: {
    hour: number;
    minute: number;
    period: "AM" | "PM";
  }) => void;
  onTimezoneSelect: (timezone: string) => void;
  selectedTime?: { hour: number; minute: number; period: "AM" | "PM" };
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
  const [hour, setHour] = useState(selectedTime?.hour || 9);
  const [minute, setMinute] = useState(selectedTime?.minute || 45);
  const [period, setPeriod] = useState<"AM" | "PM">(
    selectedTime?.period || "AM"
  );

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
        const containerHeight = 176; // h-44 = 176px
        const scrollTop = (selectedIndex * itemHeight) - (containerHeight / 2) + (itemHeight / 2);
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
                w-full h-11 flex items-center justify-center text-lg font-medium rounded-lg transition-colors
                ${selectedValue === value 
                  ? "text-gray-900 bg-gray-100 border border-gray-200" 
                  : "text-gray-400 hover:text-gray-500"
                }
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

  const [showTimezoneSheet, setShowTimezoneSheet] = useState(false);

  return (
    <DetachedSheet.Root 
      presented={isOpen} 
      onPresentedChange={(presented) => !presented && onClose()}
      forComponent="closest"
    >
      <DetachedSheet.Portal>
        <DetachedSheet.View>
          <DetachedSheet.Backdrop />
          <DetachedSheet.Content 
            stackingAnimation={{
              scale: ({ progress }) => 1 - (progress * 0.05),
              translateY: ({ progress }) => `${-20 * progress}px`,
            }}
          >
            <div className="p-6">
              {/* Handle */}
              <div className="flex justify-center mb-4">
                <DetachedSheet.Handle />
              </div>

              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <button onClick={onClose} className="text-red-500 font-medium">
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
                    className="bg-red-500 text-white px-4 py-2 rounded-xl font-medium"
                  >
                    Save
                  </button>
                </div>
              </div>

              {/* Time Wheels */}
              <div className="pb-4">
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

                  {/* AM/PM Toggle Buttons */}
                  <div className="flex flex-col gap-2 items-center justify-center h-44">
                    <button
                      onClick={() => setPeriod("AM")}
                      className={`
                        w-16 h-10 rounded-lg font-medium text-lg transition-colors border
                        ${period === "AM" 
                          ? "bg-gray-100 border-gray-300 text-gray-900" 
                          : "bg-transparent border-gray-200 text-gray-400"
                        }
                      `}
                    >
                      AM
                    </button>
                    <button
                      onClick={() => setPeriod("PM")}
                      className={`
                        w-16 h-10 rounded-lg font-medium text-lg transition-colors border
                        ${period === "PM" 
                          ? "bg-gray-100 border-gray-300 text-gray-900" 
                          : "bg-transparent border-gray-200 text-gray-400"
                        }
                      `}
                    >
                      PM
                    </button>
                  </div>
                </div>
              </div>

              {/* Timezone Button */}
              <div className="pb-4">
                <button
                  onClick={() => setShowTimezoneSheet(true)}
                  className="w-full p-3 bg-red-100 text-red-600 rounded-xl font-medium"
                >
                  Timezone: {timezone}
                </button>
              </div>

              {/* Clear Button */}
              <div className="pt-4 border-t border-gray-100">
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