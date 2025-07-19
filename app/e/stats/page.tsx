"use client";

import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/lib/hooks/useAuth";
import { Share, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function StatsPage() {
  const { isLoading: isCheckingAuth } = useRequireAuth();
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
        <svg width={size} height={size} className="-rotate-90 transform">
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

  if (isCheckingAuth) {
    return (
      <div className="md:max-w-sm max-w-full mx-auto bg-white min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center pb-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-full bg-gray-100 md:max-w-sm">
      {/* Header */}
      <div className="relative bg-gray-900 pb-8 pt-12">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 rounded-full text-white hover:bg-gray-800"
          onClick={() => router.back()}
        >
          <X className="h-6 w-6" />
        </Button>

        {/* Empty State Message */}
        <div className="mt-8 px-6 text-center text-white">
          <h1 className="mb-4 text-2xl font-bold">
            No events recorded in your stats
          </h1>
          <p className="mb-12 text-gray-300">
            We will calculate it as soon as your next event is completed
          </p>

          {/* Stats Grid */}
          <div className="mb-8 grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold">{stats.events}</div>
              <div className="text-gray-300">Events</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold">{stats.countries}</div>
              <div className="text-gray-300">Countries</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold">{stats.cities}</div>
              <div className="text-gray-300">Cities</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold">{stats.categories}</div>
              <div className="text-gray-300">Categories</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold">{stats.mutuals}</div>
              <div className="text-gray-300">Mutuals</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold">0</div>
              <div className="text-gray-300">Connections</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Cards */}
      <div className="-mt-4 space-y-4 px-4 pb-6">
        {/* Total Card */}
        <div className="rounded-2xl bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Total</h2>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Share className="h-5 w-5 text-gray-600" />
            </Button>
          </div>

          <div className="mb-8 flex items-end gap-8">
            <div className="text-center">
              <div className="mb-2 text-6xl font-bold text-indigo-600">
                {stats.events}
              </div>
              <div className="font-medium text-indigo-600">Events</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-6xl font-bold text-gray-400">
                {stats.mutuals}
              </div>
              <div className="font-medium text-gray-400">Mutuals Met</div>
            </div>
          </div>

          {/* Progress Circles */}
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <CircularProgress percentage={stats.shared} />
              <div className="mt-3 font-semibold">Shared</div>
            </div>
            <div className="text-center">
              <CircularProgress percentage={stats.international} />
              <div className="mt-3 font-semibold">International</div>
            </div>
            <div className="text-center">
              <CircularProgress percentage={stats.domestic} />
              <div className="mt-3 font-semibold">Domestic</div>
            </div>
          </div>
        </div>

        {/* Countries Card */}
        <div className="rounded-2xl bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Countries</h2>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Share className="h-5 w-5 text-gray-600" />
            </Button>
          </div>

          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-end gap-4">
              <div className="text-center">
                <div className="mb-2 text-5xl font-bold text-red-500">
                  {stats.countries}
                </div>
                <div className="font-medium text-red-500">Visited</div>
              </div>
              <div className="text-center">
                <div className="mb-2 text-5xl font-bold text-gray-400">249</div>
                <div className="font-medium text-gray-400">World total</div>
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
            <h3 className="mb-4 font-medium text-gray-500">Most visited</h3>
            {/* Empty state for most visited countries */}
          </div>

          <Button variant="ghost" className="w-full text-red-500 font-semibold">
            Show Visited Countries
          </Button>
        </div>

        {/* Event Categories Card */}
        <div className="rounded-2xl bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Event Categories</h2>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Share className="h-5 w-5 text-gray-600" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-blue-600">
                {stats.categories}
              </div>
              <div className="font-medium text-blue-600">Categories</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-green-600">
                {stats.mutuals}
              </div>
              <div className="font-medium text-green-600">Mutuals</div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="mb-4 font-medium text-gray-500">
              Popular categories
            </h3>
            <div className="text-center text-sm text-gray-400">
              No event categories yet
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
