'use client';

import ProgressiveImage from '@/components/ui/progressive-image';
import { getCoverImageUrl500x500 } from '@/lib/utils/cover-images';
import { isGif } from '@/lib/utils/image';
import { Camera } from 'lucide-react';

interface CoverImageSelectorProps {
	selectedImage?: string;
	onImageClick: () => void;
}

export default function CoverImageSelector({
	selectedImage,
	onImageClick,
}: CoverImageSelectorProps) {
	return (
		<div
			className='relative aspect-square w-full cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br from-pink-300 to-pink-400'
			onClick={onImageClick}
		>
			{selectedImage ? (
				<div className='h-full w-full'>
					{isGif(selectedImage) ? (
						// For GIFs, use a regular img tag to ensure they play automatically
						<img
							src={selectedImage}
							alt='Selected GIF cover'
							className='h-full w-full object-cover'
							loading='lazy'
						/>
					) : (
						// For regular images, use the ProgressiveImage component
						<ProgressiveImage
							src={getCoverImageUrl500x500(selectedImage)}
							alt='Selected cover image'
							fill
							className='object-cover'
						/>
					)}
				</div>
			) : (
				// Default sunny character placeholder matching the screenshot
				<div className='flex h-full items-center justify-center'>
					<div className='relative'>
						{/* Simplified sun character representation */}
						<div className='relative h-32 w-32 rounded-full bg-yellow-400'>
							{/* Sun rays */}
							<div className='absolute -top-4 left-1/2 h-8 w-1 -translate-x-1/2 transform rounded-full bg-yellow-500'></div>
							<div className='absolute -bottom-4 left-1/2 h-8 w-1 -translate-x-1/2 transform rounded-full bg-yellow-500'></div>
							<div className='absolute -left-4 top-1/2 h-1 w-8 -translate-y-1/2 transform rounded-full bg-yellow-500'></div>
							<div className='absolute -right-4 top-1/2 h-1 w-8 -translate-y-1/2 transform rounded-full bg-yellow-500'></div>

							{/* Face */}
							<div className='absolute inset-0 flex items-center justify-center'>
								<div className='text-4xl'>😎</div>
							</div>

							{/* Arms and legs (simplified) */}
							<div className='absolute -bottom-2 -left-2 h-6 w-6 rounded-full bg-gray-700'></div>
							<div className='absolute -bottom-2 -right-2 h-6 w-6 rounded-full bg-gray-700'></div>
							<div className='absolute -left-4 bottom-8 h-8 w-4 rotate-45 transform rounded-full bg-gray-700'></div>
							<div className='absolute -right-4 bottom-8 h-8 w-4 -rotate-45 transform rounded-full bg-gray-700'></div>
						</div>
					</div>
				</div>
			)}

			{/* Camera icon in bottom right */}
			<div className='absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-black bg-opacity-50'>
				<Camera className='h-5 w-5 text-white' />
			</div>
		</div>
	);
}
