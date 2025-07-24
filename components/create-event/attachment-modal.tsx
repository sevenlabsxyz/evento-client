'use client';

import { SpotifySVGImage } from '@/components/icons/spotify';
import { WavlakeSVGImage } from '@/components/icons/wavlake';
import { Camera, Check, File, Link, X } from 'lucide-react';

interface AttachmentModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSelectType: (type: 'spotify' | 'wavlake' | 'photo' | 'file' | 'link') => void;
	spotifyUrl?: string;
	wavlakeUrl?: string;
}

export default function AttachmentModal({
	isOpen,
	onClose,
	onSelectType,
	spotifyUrl = '',
	wavlakeUrl = '',
}: AttachmentModalProps) {
	if (!isOpen) return null;

	const hasSpotify = !!spotifyUrl;
	const hasWavlake = !!wavlakeUrl;

	const options = [
		{
			type: 'spotify' as const,
			label: hasSpotify ? 'Edit Spotify' : 'Add Spotify',
			icon: <SpotifySVGImage className='h-6 w-6' />,
			description: hasSpotify
				? 'Modify Spotify track or playlist'
				: 'Add Spotify track or playlist',
			filled: hasSpotify,
			disabled: false,
		},
		{
			type: 'wavlake' as const,
			label: hasWavlake ? 'Edit Wavlake' : 'Add Wavlake',
			icon: <WavlakeSVGImage className='h-6 w-6' />,
			description: hasWavlake
				? 'Modify Wavlake track or playlist'
				: 'Add Wavlake track or playlist',
			filled: hasWavlake,
			disabled: false,
		},
		{
			type: 'photo' as const,
			label: 'Add Photo',
			icon: <Camera className='h-6 w-6' />,
			description: 'Select from your photos',
			filled: false,
			disabled: true,
		},
		{
			type: 'file' as const,
			label: 'Add File',
			icon: <File className='h-6 w-6' />,
			description: 'Upload a document',
			filled: false,
			disabled: true,
		},
		{
			type: 'link' as const,
			label: 'Add Link',
			icon: <Link className='h-6 w-6' />,
			description: 'Add any web link',
			filled: false,
			disabled: true,
		},
	];

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center'>
			{/* Backdrop */}
			<div className='absolute inset-0 bg-black bg-opacity-50' onClick={onClose} />

			{/* Modal */}
			<div className='relative mx-2 w-full rounded-3xl bg-white p-6 shadow-2xl md:mx-4 md:max-w-sm'>
				{/* Header */}
				<div className='mb-6 flex items-center justify-between'>
					<h2 className='text-xl font-semibold'>Add Attachment</h2>
					<button onClick={onClose} className='rounded-full p-2 hover:bg-gray-100'>
						<X className='h-5 w-5' />
					</button>
				</div>

				{/* Options */}
				<div className='space-y-3'>
					{options.map((option) => {
						const getButtonStyles = () => {
							if (option.disabled) {
								return 'w-full p-4 bg-gray-200 rounded-2xl flex items-center gap-4 text-left cursor-not-allowed opacity-50';
							}
							if (option.filled) {
								return 'w-full p-4 bg-green-50 border border-green-200 hover:bg-green-100 rounded-2xl flex items-center gap-4 text-left transition-colors';
							}
							return 'w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl flex items-center gap-4 text-left transition-colors';
						};

						const getIconStyles = () => {
							if (option.disabled) {
								return 'w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-gray-500';
							}
							if (option.filled) {
								return 'w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-700';
							}
							return 'w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-600';
						};

						const getTextStyles = () => {
							if (option.disabled) {
								return {
									label: 'font-medium text-gray-500',
									description: 'text-sm text-gray-400',
								};
							}
							if (option.filled) {
								return {
									label: 'font-medium text-green-900',
									description: 'text-sm text-green-700',
								};
							}
							return {
								label: 'font-medium text-gray-900',
								description: 'text-sm text-gray-500',
							};
						};

						const textStyles = getTextStyles();

						return (
							<button
								key={option.type}
								onClick={() => {
									if (!option.disabled) {
										onSelectType(option.type);
										onClose();
									}
								}}
								className={getButtonStyles()}
								disabled={option.disabled}
							>
								<div className={getIconStyles()}>{option.icon}</div>
								<div className='flex-1'>
									<p className={textStyles.label}>{option.label}</p>
									<p className={textStyles.description}>{option.description}</p>
								</div>
								{option.filled && (
									<div className='flex h-6 w-6 items-center justify-center rounded-full bg-green-500'>
										<Check className='h-4 w-4 text-white' />
									</div>
								)}
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}
