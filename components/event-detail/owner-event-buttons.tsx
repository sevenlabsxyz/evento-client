'use client';

import { ReusableDropdown } from '@/components/reusable-dropdown';
import {
	Copy,
	EyeOff,
	Image,
	Link,
	Mail,
	MessageCircle,
	MoreHorizontal,
	Settings,
	UserCheck,
	UserPlus,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface OwnerEventButtonsProps {
	eventId: string;
}

export default function OwnerEventButtons({ eventId }: OwnerEventButtonsProps) {
	const router = useRouter();
	const [hideGuestList, setHideGuestList] = useState(false);

	const handleInvite = () => {
		router.push(`/e/${eventId}/invite`);
	};

	const handleChat = () => {
		router.push(`/e/messages/${eventId}`);
	};

	const handleManage = () => {
		router.push(`/e/${eventId}/manage`);
	};

	const handleEmailBlasts = () => {
		router.push(`/e/${eventId}/manage/email-blast`);
	};

	const handleGallerySettings = () => {
		router.push(`/e/${eventId}/gallery`);
	};

	const handleToggleGuestList = () => {
		setHideGuestList(!hideGuestList);
		router.push(`/e/${eventId}/manage/guests`);
	};

	const handleEventLink = () => {
		const eventUrl = `${window.location.origin}/e/${eventId}`;
		alert(`Event link: ${eventUrl}`);
	};

	const handleCopyEventLink = () => {
		const eventUrl = `${window.location.origin}/e/${eventId}`;
		navigator.clipboard.writeText(eventUrl);
		alert('Event link copied to clipboard!');
	};

	const handleCheckInGuests = () => {
		console.log('Check-in guests functionality');
	};

	return (
		<div className='grid grid-cols-4 gap-2'>
			{/* Invite Button */}
			<button
				onClick={handleInvite}
				className='flex h-16 flex-col items-center justify-center rounded-xl bg-red-500 text-white transition-colors hover:bg-red-600'
			>
				<UserPlus className='mb-1 h-5 w-5' />
				<span className='text-xs font-medium'>Invite</span>
			</button>

			{/* Chat Button */}
			<button
				onClick={handleChat}
				className='flex h-16 flex-col items-center justify-center rounded-xl bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200'
			>
				<MessageCircle className='mb-1 h-5 w-5' />
				<span className='text-xs font-medium'>Chat</span>
			</button>

			{/* Manage Button */}
			<button
				onClick={handleManage}
				className='flex h-16 flex-col items-center justify-center rounded-xl bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200'
			>
				<Settings className='mb-1 h-5 w-5' />
				<span className='text-xs font-medium'>Manage</span>
			</button>

			{/* More Button with Dropdown */}
			<ReusableDropdown
				trigger={
					<button className='flex h-16 w-full flex-col items-center justify-center rounded-xl bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200'>
						<MoreHorizontal className='mb-1 h-5 w-5' />
						<span className='text-xs font-medium'>More</span>
					</button>
				}
				items={[
					{
						label: 'Email Blasts',
						icon: <Mail className='h-4 w-4' />,
						action: handleEmailBlasts,
					},
					{
						label: 'Gallery Settings',
						icon: <Image className='h-4 w-4' />,
						action: handleGallerySettings,
					},
					{
						label: 'Hide Guest List',
						icon: <EyeOff className='h-4 w-4' />,
						action: handleToggleGuestList,
					},
					{
						label: 'Event Link',
						icon: <Link className='h-4 w-4' />,
						action: handleEventLink,
					},
					{
						label: 'Copy Event Link',
						icon: <Copy className='h-4 w-4' />,
						action: handleCopyEventLink,
					},
					{
						label: 'Check-in Guests',
						icon: <UserCheck className='h-4 w-4' />,
						action: handleCheckInGuests,
					},
				]}
				align='right'
				width='w-56'
			/>
		</div>
	);
}
