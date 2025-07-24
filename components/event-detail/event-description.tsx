import { Event } from "@/lib/types/event";
import { SubmitButton } from "@/components/ui/submit-button";

interface EventDescriptionProps {
  event: Event;
  isOwner?: boolean;
}

export default function EventDescription({
  event,
  isOwner,
}: EventDescriptionProps) {
  const handleExternalLink = (url: string) => {
    window.open(url, "_blank");
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
          style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
        />
      </div>

      {/* Register Button at Bottom */}
      {!isOwner ? (
        <div className="fixed bottom-0 left-0 right-0 z-20 mt-8 border-t border-gray-100 bg-white p-6">
          <SubmitButton
            onClick={() => {
              if (event.registrationUrl) {
                window.open(event.registrationUrl, "_blank");
              }
            }}
          >
            RSVP
          </SubmitButton>
        </div>
      ) : null}
    </div>
  );
}
