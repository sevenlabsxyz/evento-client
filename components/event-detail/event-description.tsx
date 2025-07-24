import { Event } from '@/lib/types/event';

interface EventDescriptionProps {
	event: Event;
}

export default function EventDescription({ event }: EventDescriptionProps) {
	if (event.description && event.description !== '<p></p>') {
		return (
			<div className='border-t border-gray-100 py-6'>
				<h2 className='mb-4 text-lg font-semibold text-gray-900'>About Event</h2>

				{/* Combined Event Content */}
				<div className='space-y-4 leading-relaxed text-gray-700'>
					{/* Main Description */}
					{event.description && (
						<div
							dangerouslySetInnerHTML={{ __html: event.description }}
							className='prose prose-gray max-w-none break-words'
							style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
						/>
					)}
				</div>
			</div>
		);
	}

	return null;
}
