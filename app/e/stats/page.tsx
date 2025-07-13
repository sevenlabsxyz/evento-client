"use client";

import { X, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function StatsPage() {
  const router = useRouter();

  // Mock data - in real app this would come from user's actual event data
  const stats = {
    events: 0,
    countries: 0,
    cities: 0,
    categories: 0,
    mutuals: 0,
    shared: 0,
    international: 0,
    domestic: 0,
  };

  const CircularProgress = ({
    percentage,
    size = 80,
  }: {
    percentage: number;
    size?: number;
  }) => {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#6366f1"
            strokeWidth="8"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-indigo-600">
            {percentage}%
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="md:max-w-sm max-w-full mx-auto bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="relative bg-gray-900 pt-12 pb-8">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-white hover:bg-gray-800 rounded-full"
          onClick={() => router.back()}
        >
          <X className="h-6 w-6" />
        </Button>

        {/* Empty State Message */}
        <div className="px-6 text-center text-white mt-8">
          <h1 className="text-2xl font-bold mb-4">
            No events recorded in your stats
          </h1>
          <p className="text-gray-300 mb-12">
            We will calculate it as soon as your next event is completed
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-8 mb-8">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{stats.events}</div>
              <div className="text-gray-300">Events</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{stats.countries}</div>
              <div className="text-gray-300">Countries</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{stats.cities}</div>
              <div className="text-gray-300">Cities</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{stats.categories}</div>
              <div className="text-gray-300">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{stats.mutuals}</div>
              <div className="text-gray-300">Mutuals</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">0</div>
              <div className="text-gray-300">Connections</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Cards */}
      <div className="px-4 -mt-4 space-y-4 pb-6">
        {/* Total Card */}
        <div className="bg-white rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Total</h2>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Share className="h-5 w-5 text-gray-600" />
            </Button>
          </div>

          <div className="flex items-end gap-8 mb-8">
            <div className="text-center">
              <div className="text-6xl font-bold text-indigo-600 mb-2">
                {stats.events}
              </div>
              <div className="text-indigo-600 font-medium">Events</div>
            </div>
            <div className="text-center">
              <div className="text-6xl font-bold text-gray-400 mb-2">
                {stats.mutuals}
              </div>
              <div className="text-gray-400 font-medium">Mutuals Met</div>
            </div>
          </div>

          {/* Progress Circles */}
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <CircularProgress percentage={stats.shared} />
              <div className="font-semibold mt-3">Shared</div>
            </div>
            <div className="text-center">
              <CircularProgress percentage={stats.international} />
              <div className="font-semibold mt-3">International</div>
            </div>
            <div className="text-center">
              <CircularProgress percentage={stats.domestic} />
              <div className="font-semibold mt-3">Domestic</div>
            </div>
          </div>
        </div>

        {/* Countries Card */}
        <div className="bg-white rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Countries</h2>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Share className="h-5 w-5 text-gray-600" />
            </Button>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-end gap-4">
              <div className="text-center">
                <div className="text-5xl font-bold text-orange-500 mb-2">
                  {stats.countries}
                </div>
                <div className="text-orange-500 font-medium">Visited</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold text-gray-400 mb-2">249</div>
                <div className="text-gray-400 font-medium">World total</div>
              </div>
            </div>
            <div className="text-center">
              <CircularProgress
                percentage={
                  stats.countries > 0
                    ? Math.round((stats.countries / 249) * 100)
                    : 0
                }
                size={100}
              />
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-gray-500 font-medium mb-4">Most visited</h3>
            {/* Empty state for most visited countries */}
          </div>

          <Button
            variant="ghost"
            className="w-full text-orange-500 font-semibold"
          >
            Show Visited Countries
          </Button>
        </div>

        {/* Event Categories Card */}
        <div className="bg-white rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Event Categories</h2>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Share className="h-5 w-5 text-gray-600" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {stats.categories}
              </div>
              <div className="text-blue-600 font-medium">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {stats.mutuals}
              </div>
              <div className="text-green-600 font-medium">Mutuals</div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-gray-500 font-medium mb-4">
              Popular categories
            </h3>
            <div className="text-center text-gray-400 text-sm">
              No event categories yet
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
