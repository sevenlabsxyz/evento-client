import { Event } from '@/lib/types/event';
import { ExternalLink } from 'lucide-react';

interface EventDescriptionProps {
  event: Event;
  isOwner?: boolean;
}

export default function EventDescription({
  event,
  isOwner,
}: EventDescriptionProps) {
  const handleExternalLink = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="border-t border-gray-100 py-6">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">About Event</h2>

      {/* Combined Event Content */}
      <div className="space-y-4 leading-relaxed text-gray-700">
        {/* Main Description */}
        <div
          dangerouslySetInnerHTML={{ __html: event.description }}
          className="prose prose-gray max-w-none break-words"
          style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
        />

        {/* Objective */}
        {event.details?.objective && (
          <div>
            <h3 className="mb-2 font-semibold text-gray-900">Objective</h3>
            <p>{event.details.objective}</p>
          </div>
        )}

        {/* Participants */}
        {event.details?.participants && (
          <div>
            <h3 className="mb-2 font-semibold text-gray-900">Participants</h3>
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
                className="flex items-center gap-1 text-red-500 hover:text-red-600"
              >
                View participant profiles
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Website */}
          {event.details?.website && (
            <div>
              <button
                onClick={() => handleExternalLink(event.details!.website!)}
                className="flex items-center gap-1 text-red-500 hover:text-red-600"
              >
                {event.details!.website!.replace(/^https?:\/\//, '')}
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Register Button at Bottom */}
      {!isOwner ? (
        <div className="fixed bottom-0 left-0 right-0 z-20 mt-8 bg-white border-t border-gray-100 p-6">
          <button
            onClick={() => {
              if (event.registrationUrl) {
                window.open(event.registrationUrl, '_blank');
              }
            }}
            className="w-full rounded-xl bg-red-500 py-3 font-semibold text-white transition-colors hover:bg-red-600"
          >
            RSVP
          </button>
        </div>
      ) : null}
    </div>
  );
}
