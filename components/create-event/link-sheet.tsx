'use client';

import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { useState } from 'react';

interface LinkSheetProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (url: string) => void;
}

export default function LinkSheet({ isOpen, onClose, onSave }: LinkSheetProps) {
	const [url, setUrl] = useState('');
	const [error, setError] = useState('');

	const validateUrl = (inputUrl: string) => {
		try {
			new URL(inputUrl);
			return true;
		} catch {
			return false;
		}
	};

	const handleSave = () => {
		if (!url.trim()) {
			setError('Please enter a URL');
			return;
		}

		if (!validateUrl(url)) {
			setError('Please enter a valid URL');
			return;
		}

		onSave(url);
		setUrl('');
		setError('');
		onClose();
	};

	const handleClose = () => {
		setUrl('');
		setError('');
		onClose();
	};

	return (
		<SheetWithDetentFull.Root
			presented={isOpen}
			onPresentedChange={(presented) => !presented && handleClose()}
		>
			<SheetWithDetentFull.Portal>
				<SheetWithDetentFull.View>
					<SheetWithDetentFull.Backdrop />
					<SheetWithDetentFull.Content>
						<div className='p-6'>
							{/* Handle */}
							<div className='mb-4 flex justify-center'>
								<SheetWithDetentFull.Handle />
							</div>

							{/* Header */}
							<div className='mb-6'>
								<h2 className='text-center text-xl font-semibold'>Add Link</h2>
							</div>

							{/* Form */}
							<div className='space-y-4'>
								<div>
									<label className='mb-2 block text-sm font-medium text-gray-700'>URL</label>
									<input
										type='url'
										value={url}
										onChange={(e) => {
											setUrl(e.target.value);
											setError('');
										}}
										placeholder='https://example.com'
										className='w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500'
										autoFocus
									/>
									{error && <p className='mt-1 text-sm text-red-600'>{error}</p>}
									<p className='mt-2 text-xs text-gray-500'>Enter any valid web URL</p>
								</div>
							</div>

							{/* Actions */}
							<div className='mt-6 flex gap-3'>
								<button
									onClick={handleClose}
									className='flex-1 rounded-xl border border-gray-300 px-4 py-3 font-medium text-gray-700 hover:bg-gray-50'
								>
									Cancel
								</button>
								<button
									onClick={handleSave}
									className='flex-1 rounded-xl bg-red-500 px-4 py-3 font-medium text-white hover:bg-red-600'
								>
									Save
								</button>
							</div>
						</div>
					</SheetWithDetentFull.Content>
				</SheetWithDetentFull.View>
			</SheetWithDetentFull.Portal>
		</SheetWithDetentFull.Root>
	);
}
