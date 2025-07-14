'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Mail } from 'lucide-react';
import { getEventById } from '@/lib/data/sample-events';

export default function HostsManagementPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  
  // Get existing event data
  const existingEvent = getEventById(eventId);
  
  if (!existingEvent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
          <p className="text-gray-600 mb-4">The event you're trying to manage doesn't exist.</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Mock data for current user (event creator)
  const currentUser = {
    id: 'current-user-id',
    name: 'Andre Neves',
    email: 'andrerfneves@protonmail.com',
    avatar: '/api/placeholder/40/40',
    role: 'Creator'
  };

  // Mock co-hosts data (empty for now)
  const [coHosts, setCoHosts] = useState<any[]>([]);

  const handleAddCoHost = () => {
    // TODO: Implement add co-host functionality
    console.log('Add co-host clicked');
    // This would typically open a modal or navigate to an invite screen
  };

  const handleInviteCoHost = (email: string) => {
    // TODO: Implement invite co-host functionality
    console.log('Inviting co-host:', email);
  };

  return (
    <div className="md:max-w-sm max-w-full mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold">Hosts</h1>
        </div>
        <button
          onClick={handleAddCoHost}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Event Creator */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-lg">
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{currentUser.name}</h3>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                {currentUser.role}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Mail className="w-3 h-3" />
              <span>{currentUser.email}</span>
            </div>
          </div>
        </div>

        {/* Co-hosts Section */}
        {coHosts.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Co-hosts</h3>
            {coHosts.map((coHost) => (
              <div key={coHost.id} className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-2xl">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-semibold text-lg">
                    {coHost.name.split(' ').map((n: string) => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{coHost.name}</h3>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      Co-host
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Mail className="w-3 h-3" />
                    <span>{coHost.email}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Co-hosts</h3>
            <p className="text-gray-500 text-sm mb-6">
              Add co-hosts to help you manage this event
            </p>
            <button
              onClick={handleAddCoHost}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Add Co-host
            </button>
          </div>
        )}

        {/* Information Section */}
        <div className="mt-8 p-4 bg-blue-50 rounded-2xl">
          <h4 className="font-medium text-blue-900 mb-2">About Co-hosts</h4>
          <p className="text-sm text-blue-700">
            Co-hosts can help you manage your event by checking in guests, managing the guest list, and moderating event discussions.
          </p>
        </div>
      </div>
    </div>
  );
}