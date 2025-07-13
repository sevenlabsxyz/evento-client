"use client";

import {
  X,
  Calendar,
  CreditCard,
  Edit3,
  Paperclip,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { useRouter } from "next/navigation";

export default function CreatePage() {
  const router = useRouter();

  return (
    <div className="md:max-w-sm max-w-full mx-auto bg-white min-h-screen flex flex-col">
      {/* Header */}
      <PageHeader
        title="Create Event"
        subtitle="Add a new event to your itinerary"
        rightContent={
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-gray-100"
            onClick={() => router.back()}
          >
            <X className="h-5 w-5" />
          </Button>
        }
      />

      {/* Form Content */}
      <div className="flex-1 px-4 pb-20 space-y-4 bg-gray-50 overflow-y-auto pt-4">
        {/* Date & Time Module */}
        <div className="bg-white rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-4 w-4 text-gray-600" />
            </div>
            <span className="text-gray-700 font-medium w-16">Starts</span>
            <div className="flex gap-2 flex-1">
              <button className="bg-gray-100 rounded-lg px-4 py-2 text-gray-900 font-medium flex-1">
                Tue, Sep 09
              </button>
              <button className="bg-gray-100 rounded-lg px-4 py-2 text-gray-600">
                Time
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-4 w-4 text-gray-600" />
            </div>
            <span className="text-gray-700 font-medium w-16">Ends</span>
            <div className="flex gap-2 flex-1">
              <button className="bg-gray-100 rounded-lg px-4 py-2 text-gray-900 font-medium flex-1">
                Thu, Sep 11
              </button>
              <button className="bg-gray-100 rounded-lg px-4 py-2 text-gray-600">
                Time
              </button>
            </div>
          </div>
        </div>

        {/* Event Title Module */}
        <div className="bg-white rounded-2xl p-4">
          <div className="space-y-2">
            <label className="text-gray-500 text-sm font-medium">
              Event Title
            </label>
            <input
              type="text"
              placeholder="Enter event name"
              className="w-full text-gray-900 font-medium bg-transparent border-none outline-none text-lg"
              defaultValue="Hakone"
            />
          </div>
        </div>

        {/* Address Module */}
        <div className="bg-white rounded-2xl p-4">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <MapPin className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <label className="text-gray-500 text-sm font-medium block mb-1">
                Address
              </label>
              <input
                type="text"
                placeholder="Enter location"
                className="w-full text-gray-900 font-medium bg-transparent border-none outline-none"
                defaultValue="Kanagawa Hakone, Japan"
              />
            </div>
          </div>
        </div>

        {/* Total Cost Module */}
        <div className="bg-white rounded-2xl p-4">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <label className="text-gray-500 text-sm font-medium block mb-1">
                Total Cost
              </label>
              <input
                type="text"
                placeholder="Enter amount"
                className="w-full text-gray-900 font-medium bg-transparent border-none outline-none"
              />
            </div>
          </div>
        </div>

        {/* Notes Module */}
        <div className="bg-white rounded-2xl p-4">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mt-1">
              <Edit3 className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <label className="text-gray-500 text-sm font-medium block mb-2">
                Notes
              </label>
              <textarea
                placeholder="Add notes about this event..."
                className="w-full text-gray-900 bg-transparent border-none outline-none resize-none"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Attachments Module */}
        <div className="bg-white rounded-2xl p-4">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Paperclip className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <button className="text-gray-500 font-medium text-left">
                Add File, Photo or Link
              </button>
            </div>
          </div>
        </div>

        {/* Distance Module */}
        <div className="bg-white rounded-2xl p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Distance from a location
          </h3>
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
            <div className="text-center text-gray-600">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <p className="text-sm">Select a location to calculate distance</p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4">
          <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-medium">
            Create Event
          </Button>
        </div>
      </div>
    </div>
  );
}
