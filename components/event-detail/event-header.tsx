import Image from 'next/image';
import { Event } from '@/lib/types/event';

interface EventHeaderProps {
  event: Event;
  onImageClick: () => void;
}

export default function EventHeader({ event, onImageClick }: EventHeaderProps) {
  return (
    <div className="relative w-full aspect-square overflow-hidden cursor-pointer" onClick={onImageClick}>
      {/* Cover Image */}
      <Image
        src={event.coverImage}
        alt={event.title}
        fill
        className="object-cover"
        priority
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      
      {/* Event Title and Subtitle */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <h1 className="text-2xl font-bold mb-2 leading-tight">
          {event.title}
        </h1>
        {event.subtitle && (
          <p className="text-lg opacity-90 leading-tight">
            {event.subtitle}
          </p>
        )}
      </div>
    </div>
  );
}