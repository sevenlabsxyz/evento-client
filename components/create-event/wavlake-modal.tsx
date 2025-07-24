'use client';

import { X } from 'lucide-react';
import { useState } from 'react';

interface WavlakeModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (url: string) => void;
}

export default function WavlakeModal({ isOpen, onClose, onSave }: WavlakeModalProps) {
	const [url, setUrl] = useState('');
	const [error, setError] = useState('');

	if (!isOpen) return null;

	const validateUrl = (inputUrl: string) => {
		try {
			const urlObj = new URL(inputUrl);
			return urlObj.hostname === 'wavlake.com' || urlObj.hostname === 'www.wavlake.com';
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
			setError('Please enter a valid Wavlake URL');
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
		<div className='fixed inset-0 z-50 flex items-center justify-center'>
			{/* Backdrop */}
			<div className='absolute inset-0 bg-black bg-opacity-50' onClick={handleClose} />

			{/* Modal */}
			<div className='relative mx-2 w-full rounded-3xl bg-white p-6 shadow-2xl md:mx-4 md:max-w-sm'>
				{/* Header */}
				<div className='mb-6 flex items-center justify-between'>
					<h2 className='text-xl font-semibold'>Add Wavlake Track or Playlist</h2>
					<button onClick={handleClose} className='rounded-full p-2 hover:bg-gray-100'>
						<X className='h-5 w-5' />
					</button>
				</div>

				{/* Form */}
				<div className='space-y-4'>
					<div>
						<label className='mb-2 block text-sm font-medium text-gray-700'>Wavlake URL</label>
						<input
							type='url'
							value={url}
							onChange={(e) => {
								setUrl(e.target.value);
								setError('');
							}}
							placeholder='https://wavlake.com/track/... or /playlist/...'
							className='w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500'
						/>
						{error && <p className='mt-1 text-sm text-red-600'>{error}</p>}
						<p className='mt-2 text-xs text-gray-500'>
							Paste a link to any Wavlake track or playlist
						</p>
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
		</div>
	);
}
