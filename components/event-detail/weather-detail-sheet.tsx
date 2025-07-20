"use client";

import { DetachedSheet } from "@/components/ui/detached-sheet";
import { WeatherData } from "@/lib/types/weather";
import { Droplets, MoreHorizontal, Thermometer, Wind } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

// Temperature conversion helper functions
const celsiusToFahrenheit = (celsius: number): number => {
  return Math.round((celsius * 9) / 5 + 32);
};

const fahrenheitToCelsius = (fahrenheit: number): number => {
  return Math.round(((fahrenheit - 32) * 5) / 9);
};

interface WeatherDetailSheetProps {
  weather: WeatherData;
  locationName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function WeatherDetailSheet({
  weather,
  locationName,
  isOpen,
  onClose,
}: WeatherDetailSheetProps) {
  const iconUrl = `https://openweathermap.org/img/wn/${weather.icon}@2x.png`;

  // Local unit toggle state (resets when sheet reopens)
  const [displayUnit, setDisplayUnit] = useState<"F" | "C">(weather.unit);
  const [showUnitMenu, setShowUnitMenu] = useState(false);

  // Helper function to get temperature in desired unit
  const getTemperature = (
    temp: number,
    originalUnit: "F" | "C",
    targetUnit: "F" | "C"
  ): number => {
    if (originalUnit === targetUnit) return temp;

    if (originalUnit === "F" && targetUnit === "C") {
      return fahrenheitToCelsius(temp);
    } else {
      return celsiusToFahrenheit(temp);
    }
  };

  // Convert wind speed to appropriate unit (mph for F, m/s for C)
  const getWindSpeed = (
    speed: number,
    unit: "F" | "C"
  ): { speed: string; unit: string } => {
    if (unit === "F") {
      // Convert m/s to mph: multiply by 2.237
      const mph = (speed * 2.237).toFixed(1);
      return { speed: mph, unit: "mph" };
    } else {
      return { speed: speed.toFixed(1), unit: "m/s" };
    }
  };

  return (
    <DetachedSheet.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && onClose()}
    >
      <DetachedSheet.Portal>
        <DetachedSheet.View>
          <DetachedSheet.Backdrop />
          <DetachedSheet.Content>
            <div className="p-6">
              {/* Handle */}
              <div className="mb-4 flex justify-center">
                <DetachedSheet.Handle />
              </div>

              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1"></div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Current Weather
                  </h2>
                  <div className="flex-1 flex justify-end">
                    {/* Temperature Unit Menu */}
                    <div className="relative">
                      <button
                        onClick={() => setShowUnitMenu(!showUnitMenu)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <MoreHorizontal className="h-5 w-5 text-gray-600" />
                      </button>
                      
                      {showUnitMenu && (
                        <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[120px]">
                          <button
                            onClick={() => {
                              setDisplayUnit("F");
                              setShowUnitMenu(false);
                            }}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                              displayUnit === "F" ? "text-red-600 font-medium" : "text-gray-700"
                            }`}
                          >
                            <span>Fahrenheit</span>
                            {displayUnit === "F" && (
                              <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setDisplayUnit("C");
                              setShowUnitMenu(false);
                            }}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                              displayUnit === "C" ? "text-red-600 font-medium" : "text-gray-700"
                            }`}
                          >
                            <span>Celsius</span>
                            {displayUnit === "C" && (
                              <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-center text-sm text-gray-600">
                  {locationName}
                </p>
              </div>

              {/* Main Weather Display */}
              <div className="flex items-center justify-center mb-8">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Image
                      src={iconUrl}
                      alt={weather.description}
                      width={80}
                      height={80}
                      className="w-20 h-20"
                    />
                  </div>
                  <div className="text-4xl font-bold text-gray-900 mb-1">
                    {getTemperature(
                      weather.temperature,
                      weather.unit,
                      displayUnit
                    )}
                    °{displayUnit}
                  </div>
                  <div className="text-lg text-gray-600 capitalize mb-1">
                    {weather.description}
                  </div>
                  <div className="text-sm text-gray-500">
                    {weather.condition}
                  </div>
                </div>
              </div>

              {/* Weather Details - 3 Cards Side by Side */}
              <div className="grid grid-cols-3 gap-4">
                {weather.feelsLike && (
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <Thermometer className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                    <div className="text-xs font-medium text-gray-900 mb-1">
                      Feels like
                    </div>
                    <div className="text-sm font-semibold text-gray-700">
                      {getTemperature(
                        weather.feelsLike,
                        weather.unit,
                        displayUnit
                      )}
                      °{displayUnit}
                    </div>
                  </div>
                )}

                {weather.humidity && (
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <Droplets className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                    <div className="text-xs font-medium text-gray-900 mb-1">
                      Humidity
                    </div>
                    <div className="text-sm font-semibold text-gray-700">
                      {weather.humidity}%
                    </div>
                  </div>
                )}

                {weather.windSpeed && (
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <Wind className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                    <div className="text-xs font-medium text-gray-900 mb-1">
                      Wind
                    </div>
                    <div className="text-sm font-semibold text-gray-700">
                      {getWindSpeed(weather.windSpeed, displayUnit).speed}{" "}
                      {getWindSpeed(weather.windSpeed, displayUnit).unit}
                    </div>
                  </div>
                )}
              </div>

              {/* Disclaimer */}
              <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                <div className="text-xs text-blue-800">
                  <strong>Note:</strong> This shows current weather conditions
                  at the event location, not the actual weather from the event
                  date.
                </div>
              </div>
            </div>
          </DetachedSheet.Content>
        </DetachedSheet.View>
      </DetachedSheet.Portal>
    </DetachedSheet.Root>
  );
}
