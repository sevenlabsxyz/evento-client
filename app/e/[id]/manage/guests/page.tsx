'use client';

import { useEventDetails } from '@/lib/hooks/useEventDetails';
import { GuestStatus } from '@/lib/types/event';
import { ArrowLeft, MoreHorizontal, Search, Users } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function GuestListPage() {
	const params = useParams();
	const router = useRouter();
	const eventId = params.id as string;

	// Get existing event data from API
	const { data: existingEvent, isLoading, error } = useEventDetails(eventId);

	if (isLoading) {
		return (
			<div className='flex min-h-screen items-center justify-center bg-gray-50'>
				<div className='text-center'>
					<div className='mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-red-500'></div>
					<p className='text-gray-600'>Loading event details...</p>
				</div>
			</div>
		);
	}

	if (error || !existingEvent) {
		return (
			<div className='flex min-h-screen items-center justify-center bg-gray-50'>
				<div className='text-center'>
					<h1 className='mb-2 text-2xl font-bold text-gray-900'>Event Not Found</h1>
					<p className='mb-4 text-gray-600'>The event you're trying to manage doesn't exist.</p>
					<button
						onClick={() => router.back()}
						className='rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600'
					>
						Go Back
					</button>
				</div>
			</div>
		);
	}

	// Get guests from event data
	const guests = existingEvent.guests || [];
	const [activeTab, setActiveTab] = useState<GuestStatus>('going');
	const [searchQuery, setSearchQuery] = useState('');
	const [showMoreMenu, setShowMoreMenu] = useState(false);
	const [hideGuestList, setHideGuestList] = useState(!existingEvent.guestListSettings?.isPublic);

	// Calculate counts for each status
	const getGuestCount = (status: GuestStatus) =>
		guests.filter((guest) => guest.status === status).length;

	const tabs = [
		{ key: 'going' as const, label: 'Going', count: getGuestCount('going') },
		{
			key: 'invited' as const,
			label: 'Invited',
			count: getGuestCount('invited'),
		},
		{
			key: 'not-going' as const,
			label: 'Not Going',
			count: getGuestCount('not-going'),
		},
		{ key: 'maybe' as const, label: 'Maybe', count: getGuestCount('maybe') },
		{
			key: 'checked-in' as const,
			label: 'Checked In',
			count: getGuestCount('checked-in'),
		},
	];

	// Filter guests based on active tab and search query
	const filteredGuests = guests.filter((guest) => {
		const matchesTab = guest.status === activeTab;
		const matchesSearch =
			guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			guest.email.toLowerCase().includes(searchQuery.toLowerCase());
		return matchesTab && matchesSearch;
	});

	const handleTabChange = (tab: GuestStatus) => {
		setActiveTab(tab);
	};

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(e.target.value);
	};

	const handleToggleHideGuestList = () => {
		setHideGuestList(!hideGuestList);
	};

	const handleCloseMoreMenu = () => {
		setShowMoreMenu(false);
	};

	return (
		<div className='mx-auto min-h-screen max-w-full bg-white md:max-w-sm'>
			{/* Header */}
			<div className='flex items-center justify-between border-b border-gray-100 p-4'>
				<div className='flex items-center gap-4'>
					<button onClick={() => router.back()} className='rounded-full p-2 hover:bg-gray-100'>
						<ArrowLeft className='h-5 w-5' />
					</button>
					<h1 className='text-xl font-semibold'>Guest List</h1>
				</div>
				<div className='relative'>
					<button
						onClick={() => setShowMoreMenu(!showMoreMenu)}
						className='rounded-full p-2 hover:bg-gray-100'
					>
						<MoreHorizontal className='h-5 w-5' />
					</button>

					{/* More Menu Dropdown */}
					{showMoreMenu && (
						<>
							{/* Backdrop */}
							<div className='fixed inset-0 z-40' onClick={handleCloseMoreMenu} />

							{/* Dropdown Menu */}
							<div className='absolute right-0 top-12 z-50 min-w-48 rounded-xl border border-gray-200 bg-white p-2 shadow-lg'>
								<div className='flex items-center justify-between rounded-lg p-3 hover:bg-gray-50'>
									<div>
										<span className='font-medium text-gray-900'>Hide guest list</span>
										<p className='mt-1 text-xs text-gray-500'>Make guest list private</p>
									</div>
									<button
										onClick={handleToggleHideGuestList}
										className={`h-6 w-10 rounded-full transition-colors ${
											hideGuestList ? 'bg-red-500' : 'bg-gray-300'
										}`}
									>
										<div
											className={`h-4 w-4 rounded-full bg-white transition-transform ${
												hideGuestList ? 'translate-x-5' : 'translate-x-1'
											}`}
										/>
									</button>
								</div>
							</div>
						</>
					)}
				</div>
			</div>

			{/* Search Bar */}
			<div className='p-4'>
				<div className='relative'>
					<Search className='absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400' />
					<input
						type='text'
						placeholder='Search event guests...'
						value={searchQuery}
						onChange={handleSearchChange}
						className='w-full rounded-xl border-none bg-gray-100 py-3 pl-10 pr-4 text-gray-900 placeholder-gray-500 outline-none'
					/>
				</div>
			</div>

			{/* Tabs */}
			<div className='px-4'>
				<div className='flex space-x-1 overflow-x-auto pb-2'>
					{tabs.map((tab) => (
						<button
							key={tab.key}
							onClick={() => handleTabChange(tab.key)}
							className={`flex-shrink-0 rounded-lg px-4 py-2 font-medium transition-colors ${
								activeTab === tab.key
									? 'bg-black text-white'
									: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
							}`}
						>
							{tab.label}
							{tab.count > 0 && <span className='ml-1 text-xs'>({tab.count})</span>}
						</button>
					))}
				</div>
			</div>

			{/* Content */}
			<div className='flex-1 p-4'>
				{filteredGuests.length > 0 ? (
					<div className='space-y-3'>
						{filteredGuests.map((guest) => (
							<div key={guest.id} className='flex items-center gap-4 rounded-2xl bg-gray-50 p-4'>
								<div className='flex h-12 w-12 items-center justify-center rounded-full bg-gray-300'>
									<Image src='/assets/img/evento-sublogo.svg' alt='Evento' width={32} height={32} />
								</div>
								<div className='flex-1'>
									<h3 className='font-semibold text-gray-900'>{guest.name}</h3>
									<p className='text-sm text-gray-500'>{guest.email}</p>
									{guest.checkedInAt && (
										<p className='text-xs text-green-600'>
											Checked in at {guest.checkedInAt.toLocaleTimeString()}
										</p>
									)}
								</div>
								<div className='flex items-center gap-2'>
									{/* Status indicator */}
									<div
										className={`h-3 w-3 rounded-full ${
											guest.status === 'going'
												? 'bg-green-500'
												: guest.status === 'invited'
													? 'bg-blue-500'
													: guest.status === 'not-going'
														? 'bg-red-500'
														: guest.status === 'maybe'
															? 'bg-yellow-500'
															: 'bg-purple-500'
										}`}
									/>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className='py-16 text-center'>
						<div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100'>
							<Users className='h-8 w-8 text-gray-400' />
						</div>
						<h3 className='mb-2 text-lg font-medium text-gray-900'>No Guests</h3>
						<p className='text-sm text-gray-500'>
							{activeTab === 'going' && "No guests have confirmed they're going yet."}
							{activeTab === 'invited' && 'No guests have been invited yet.'}
							{activeTab === 'not-going' && 'No guests have declined yet.'}
							{activeTab === 'maybe' && 'No guests have responded with maybe yet.'}
							{activeTab === 'checked-in' && 'No guests have checked in yet.'}
						</p>
					</div>
				)}
			</div>

			{/* Summary Footer */}
			<div className='border-t border-gray-100 bg-gray-50 p-4'>
				<div className='flex items-center justify-between text-sm text-gray-600'>
					<span>Total Guests: {guests.length}</span>
					<span>
						{activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' ')}:{' '}
						{filteredGuests.length}
					</span>
				</div>
			</div>
		</div>
	);
}
