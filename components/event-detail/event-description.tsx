import { ExternalLink } from 'lucide-react';
import { Event } from '@/lib/types/event';

interface EventDescriptionProps {
  event: Event;
}

export default function EventDescription({ event }: EventDescriptionProps) {
  const handleExternalLink = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="py-6 border-t border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">About Event</h2>
      
      {/* Combined Event Content */}
      <div className="space-y-4 text-gray-700 leading-relaxed">
        {/* Main Description */}
        <p>{event.description}</p>

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
                className="text-orange-500 hover:text-orange-600 flex items-center gap-1"
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
                className="text-orange-500 hover:text-orange-600 flex items-center gap-1"
              >
                {event.details!.website!.replace(/^https?:\/\//, '')}
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Register Button at Bottom */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <button
          onClick={() => {
            if (event.registrationUrl) {
              window.open(event.registrationUrl, '_blank');
            }
          }}
          className="w-full py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors"
        >
          Register
        </button>
      </div>
    </div>
  );
}