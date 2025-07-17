import { Event } from "@/lib/types/event";
import { MessageCircle } from "lucide-react";
import Image from "next/image";

interface EventHostProps {
  event: Event;
}

export default function EventHost({ event }: EventHostProps) {
  if (!event.hosts || event.hosts.length === 0) {
    return null;
  }

  const handleContactHost = (hostId: string) => {
    console.log("Contact host:", hostId);
  };

  return (
    <div className="border-t border-gray-100 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {event.hosts.length === 1 ? "Host" : "Hosts"}
        </h2>
        <span className="text-sm text-gray-500">Contact</span>
      </div>

      <div className="space-y-4">
        {event.hosts.map((host) => (
          <div key={host.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-full bg-gray-200">
                <Image
                  src={host.avatar}
                  alt={host.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div>
                <p className="text-sm text-gray-500">@{host.username}</p>
                <h3 className="font-semibold text-gray-900">{host.name}</h3>
              </div>
            </div>

            {event.contactEnabled && (
              <button
                onClick={() => handleContactHost(host.id)}
                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
              >
                <MessageCircle className="h-5 w-5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
