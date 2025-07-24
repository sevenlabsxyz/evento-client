'use client';

import { EventWithUser } from '@/lib/types/api';
import { format, parseISO } from 'date-fns';
import { EventCompactItem } from './event-compact-item';

interface EventDateGroupProps {
	date: string; // ISO date string for the day
	events: EventWithUser[];
	onBookmark?: (eventId: string) => void;
	bookmarkedEvents?: Set<string>;
}

export function EventDateGroup({
	date,
	events,
	onBookmark,
	bookmarkedEvents = new Set(),
}: EventDateGroupProps) {
	// Format the date header (e.g., "Tuesday, September 2nd")
	const formattedDate = format(parseISO(date), 'EEEE, MMMM do');

	return (
		<div className='mb-5'>
			{/* Date header */}
			<div className='mb-2 px-2'>
				<h2 className='font-medium text-gray-900'>{formattedDate}</h2>
			</div>

			{/* Events list for this date */}
			<div className='rounded-lg bg-white p-1 shadow-sm'>
				{events.map((event) => (
					<EventCompactItem
						key={event.id}
						event={event}
						onBookmark={onBookmark}
						isBookmarked={bookmarkedEvents.has(event.id)}
					/>
				))}
			</div>
		</div>
	);
}
