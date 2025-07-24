'use client';

import { Button } from '@/components/ui/button';
import { useRequireAuth } from '@/lib/hooks/useAuth';
import { useTopBar } from '@/lib/stores/topbar-store';
import { toast } from '@/lib/utils/toast';
import { Bookmark, ChevronRight, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SavedListsPage() {
	const { isLoading: isCheckingAuth } = useRequireAuth();
	const { setTopBar } = useTopBar();

	// Set TopBar content
	useEffect(() => {
		setTopBar({
			title: 'Saved',
			subtitle: 'Your saved events',
		});

		return () => {
			setTopBar({
				title: '',
				subtitle: '',
			});
		};
	}, [setTopBar]);

	const router = useRouter();
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [newListName, setNewListName] = useState('');
	const [savedLists, setSavedLists] = useState([
		{
			id: 1,
			name: 'Event toes',
			eventCount: 5,
			isDefault: true,
			lastUpdated: '2 days ago',
			preview: [
				'/placeholder.svg?height=40&width=40',
				'/placeholder.svg?height=40&width=40',
				'/placeholder.svg?height=40&width=40',
			],
		},
		{
			id: 2,
			name: 'Tokyo Adventures',
			eventCount: 3,
			isDefault: false,
			lastUpdated: '1 week ago',
			preview: ['/placeholder.svg?height=40&width=40', '/placeholder.svg?height=40&width=40'],
		},
		{
			id: 3,
			name: 'Food Experiences',
			eventCount: 7,
			isDefault: false,
			lastUpdated: '3 days ago',
			preview: [
				'/placeholder.svg?height=40&width=40',
				'/placeholder.svg?height=40&width=40',
				'/placeholder.svg?height=40&width=40',
			],
		},
	]);

	const handleCreateList = () => {
		if (!newListName.trim()) {
			toast.error('Please enter a list name');
			return;
		}

		const newList = {
			id: Date.now(),
			name: newListName.trim(),
			eventCount: 0,
			isDefault: false,
			lastUpdated: 'Just now',
			preview: [],
		};

		setSavedLists([...savedLists, newList]);
		setNewListName('');
		setShowCreateModal(false);
		toast.success(`"${newList.name}" list created!`);
	};

	const handleListClick = (listId: number) => {
		router.push(`/saved/${listId}`);
	};

	if (isCheckingAuth) {
		return (
			<div className='mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm'>
				<div className='flex flex-1 items-center justify-center pb-20'>
					<div className='h-8 w-8 animate-spin rounded-full border-b-2 border-red-500'></div>
				</div>
			</div>
		);
	}

	return (
		<div className='mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm'>
			{/* Content */}
			<div className='flex-1 overflow-y-auto bg-gray-50'>
				{/* Add New List Button */}
				<div className='px-4 py-4'>
					<Button
						onClick={() => setShowCreateModal(true)}
						className='w-full rounded-xl bg-red-500 py-3 font-medium text-white hover:bg-red-600'
					>
						<Plus className='mr-2 h-5 w-5' />
						Add New List
					</Button>
				</div>

				{/* Lists */}
				<div className='space-y-3 px-4 pb-6'>
					{savedLists.map((list) => (
						<div
							key={list.id}
							onClick={() => handleListClick(list.id)}
							className='cursor-pointer rounded-2xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md'
						>
							<div className='flex items-center justify-between'>
								<div className='flex-1'>
									<div className='mb-1 flex items-center gap-2'>
										<h3 className='text-lg font-bold'>{list.name}</h3>
										{list.isDefault && (
											<span className='rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800'>
												Default
											</span>
										)}
									</div>
									<p className='mb-2 text-sm text-gray-600'>
										{list.eventCount} {list.eventCount === 1 ? 'event' : 'events'} • Updated{' '}
										{list.lastUpdated}
									</p>

									{/* Preview Images */}
									{list.preview.length > 0 && (
										<div className='mb-2 flex -space-x-2'>
											{list.preview.slice(0, 3).map((image, index) => (
												<img
													key={index}
													src={image || '/placeholder.svg'}
													alt=''
													className='h-8 w-8 rounded-full border-2 border-white object-cover'
												/>
											))}
											{list.eventCount > 3 && (
												<div className='flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-xs font-medium text-gray-600'>
													+{list.eventCount - 3}
												</div>
											)}
										</div>
									)}
								</div>
								<ChevronRight className='h-5 w-5 text-gray-400' />
							</div>
						</div>
					))}
				</div>

				{/* Empty State */}
				{savedLists.length === 0 && (
					<div className='flex flex-1 items-center justify-center px-4 py-12'>
						<div className='text-center'>
							<div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100'>
								<Bookmark className='h-8 w-8 text-gray-400' />
							</div>
							<h3 className='mb-2 text-lg font-semibold text-gray-900'>No saved lists</h3>
							<p className='mb-6 text-sm text-gray-500'>
								Create your first list to start saving events.
							</p>
							<Button
								onClick={() => setShowCreateModal(true)}
								className='bg-red-500 text-white hover:bg-red-600'
							>
								Create List
							</Button>
						</div>
					</div>
				)}
			</div>

			{/* Create List Modal */}
			{showCreateModal && (
				<div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4'>
					<div className='w-full max-w-full rounded-2xl bg-white p-6 md:max-w-sm'>
						<h3 className='mb-4 text-xl font-bold'>Create New List</h3>
						<input
							type='text'
							value={newListName}
							onChange={(e) => setNewListName(e.target.value)}
							placeholder='Enter list name...'
							className='mb-4 w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500'
							autoFocus
							onKeyPress={(e) => e.key === 'Enter' && handleCreateList()}
						/>
						<div className='flex gap-3'>
							<Button
								variant='outline'
								onClick={() => {
									setShowCreateModal(false);
									setNewListName('');
								}}
								className='flex-1'
							>
								Cancel
							</Button>
							<Button
								onClick={handleCreateList}
								className='flex-1 bg-red-500 text-white hover:bg-red-600'
							>
								Create
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
