'use client';

import { Event } from '@/lib/types/event';
import { ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

interface EventDescriptionProps {
  event: Event;
  isOwner?: boolean;
}

export default function EventDescription({
  event,
  isOwner,
}: EventDescriptionProps) {
  const router = useRouter();

  const handleExternalLink = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="py-6 border-t border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">About Event</h2>

      {/* Combined Event Content */}
      <div className="space-y-4 text-gray-700 leading-relaxed">
        {/* Main Description */}
        <div
          dangerouslySetInnerHTML={{ __html: event.description }}
          className="prose prose-gray max-w-none break-words"
          style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
        />

        {/* Objective */}
        {event.details?.objective && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Objective</h3>
            <p>{event.details.objective}</p>
          </div>
        )}

        {/* Participants */}
        {event.details?.participants && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Participants</h3>
            <p>{event.details.participants}</p>
          </div>
        )}

        {/* Links */}
        <div className="space-y-2">
          {/* Profile Link */}
          {event.details?.profileUrl && (
            <div>
              <button
                onClick={() => handleExternalLink(event.details!.profileUrl!)}
                className="text-red-500 hover:text-red-600 flex items-center gap-1"
              >
                View participant profiles
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Website */}
          {event.details?.website && (
            <div>
              <button
                onClick={() => handleExternalLink(event.details!.website!)}
                className="text-red-500 hover:text-red-600 flex items-center gap-1"
              >
                {event.details!.website!.replace(/^https?:\/\//, '')}
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Register Button fixed at Bottom */}
      {!isOwner && event.registrationUrl ? (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
          <button
            onClick={() => {
              if (event.registrationUrl) {
                if (event.registrationUrl.startsWith(window.location.origin)) {
                  router.push(event.registrationUrl);
                } else {
                  window.open(event.registrationUrl, '_blank');
                }
              }
            }}
            className="w-full py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors"
          >
            Register
          </button>
        </div>
      ) : null}
    </div>
  );
}
