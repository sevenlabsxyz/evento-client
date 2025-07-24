import { Event } from '@/lib/types/event';
import Image from 'next/image';

interface EventHeaderProps {
	event: Event;
	onImageClick: () => void;
}

export default function EventHeader({ event, onImageClick }: EventHeaderProps) {
	return (
		<div
			className='relative aspect-square w-full cursor-pointer overflow-hidden'
			onClick={onImageClick}
		>
			{/* Cover Image */}
			<Image src={event.coverImage} alt={event.title} fill className='object-cover' priority />

			{/* Gradient Overlay */}
			<div className='absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent' />

			{/* Event Title and Subtitle */}
			<div className='absolute bottom-0 left-0 right-0 p-4 text-white'>
				<h1 className='mb-2 text-2xl font-bold leading-tight'>{event.title}</h1>
				{event.subtitle && <p className='text-lg leading-tight opacity-90'>{event.subtitle}</p>}
			</div>
		</div>
	);
}
