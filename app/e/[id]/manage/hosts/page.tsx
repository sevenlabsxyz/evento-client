"use client";

import { useEventDetails } from "@/lib/hooks/useEventDetails";
import { ArrowLeft, Mail, Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function HostsManagementPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  // Get existing event data from API
  const { data: existingEvent, isLoading, error } = useEventDetails(eventId);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-red-500"></div>
          <p className="text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !existingEvent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            Event Not Found
          </h1>
          <p className="mb-4 text-gray-600">
            The event you're trying to manage doesn't exist.
          </p>
          <button
            onClick={() => router.back()}
            className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Mock data for current user (event creator)
  const currentUser = {
    id: "current-user-id",
    name: "Andre Neves",
    email: "andrerfneves@protonmail.com",
    avatar: "/api/placeholder/40/40",
    role: "Creator",
  };

  // Mock co-hosts data (empty for now)
  const [coHosts, setCoHosts] = useState<any[]>([]);

  const handleAddCoHost = () => {
    // TODO: Implement add co-host functionality
    console.log("Add co-host clicked");
    // This would typically open a modal or navigate to an invite screen
  };

  const handleInviteCoHost = (email: string) => {
    // TODO: Implement invite co-host functionality
    console.log("Inviting co-host:", email);
  };

  return (
    <div className="mx-auto min-h-screen max-w-full bg-white md:max-w-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="rounded-full p-2 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold">Hosts</h1>
        </div>
        <button
          onClick={handleAddCoHost}
          className="rounded-full p-2 hover:bg-gray-100"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4 p-4">
        {/* Event Creator */}
        <div className="flex items-center gap-4 rounded-2xl bg-gray-50 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500">
            <span className="text-lg font-semibold text-white">
              {currentUser.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">
                {currentUser.name}
              </h3>
              <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                {currentUser.role}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Mail className="h-3 w-3" />
              <span>{currentUser.email}</span>
            </div>
          </div>
        </div>

        {/* Co-hosts Section */}
        {coHosts.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Co-hosts</h3>
            {coHosts.map((coHost) => (
              <div
                key={coHost.id}
                className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-300">
                  <span className="text-lg font-semibold text-gray-600">
                    {coHost.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">
                      {coHost.name}
                    </h3>
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                      Co-host
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Mail className="h-3 w-3" />
                    <span>{coHost.email}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              No Co-hosts
            </h3>
            <p className="mb-6 text-sm text-gray-500">
              Add co-hosts to help you manage this event
            </p>
            <button
              onClick={handleAddCoHost}
              className="rounded-lg bg-red-500 px-6 py-2 text-white transition-colors hover:bg-red-600"
            >
              Add Co-host
            </button>
          </div>
        )}

        {/* Information Section */}
        <div className="mt-8 rounded-2xl bg-blue-50 p-4">
          <h4 className="mb-2 font-medium text-blue-900">About Co-hosts</h4>
          <p className="text-sm text-blue-700">
            Co-hosts can help you manage your event by checking in guests,
            managing the guest list, and moderating event discussions.
          </p>
        </div>
      </div>
    </div>
  );
}
