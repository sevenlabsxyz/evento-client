'use client';

import { ReusableDropdown } from '@/components/reusable-dropdown';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/utils/toast';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { DeleteConfirmation } from './delete-confirmation';

interface GalleryDropdownMenuProps {
	photoId: string;
	handleDelete: (photoId: string) => Promise<{ success: boolean }>;
}

export const GalleryDropdownMenu = ({ photoId, handleDelete }: GalleryDropdownMenuProps) => {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const handleConfirmDelete = async () => {
		setIsDeleting(true);
		try {
			const result = await handleDelete(photoId);
			if (result.success) {
				setIsDialogOpen(false);
			} else {
				toast.error('Failed to delete photo. Please try again.');
			}
		} catch (error) {
			console.error('Error deleting photo:', error);
			toast.error('Failed to delete photo. Please try again.');
		} finally {
			setIsDeleting(false);
		}
	};

	const dropdownItems = [
		{
			label: 'Delete photo',
			icon: <Trash2 className='h-4 w-4' />,
			action: () => setIsDialogOpen(true),
			destructive: true,
		},
	];

	return (
		<>
			<ReusableDropdown
				trigger={
					<Button variant='secondary' size='icon'>
						<MoreHorizontal className='h-4 w-4' />
						<span className='sr-only'>Open menu</span>
					</Button>
				}
				items={dropdownItems}
				align='right'
			/>

			<DeleteConfirmation
				isOpen={isDialogOpen}
				setIsOpen={setIsDialogOpen}
				onConfirm={handleConfirmDelete}
				isDeleting={isDeleting}
			/>
		</>
	);
};
