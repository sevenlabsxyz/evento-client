'use client';

import { DetachedSheet } from '@/components/ui/detached-sheet';
import { CalendarPlus, ExternalLink } from 'lucide-react';

interface MoreOptionsSheetProps {
	isOpen: boolean;
	onClose: () => void;
	onAddToCalendar: () => void;
	onOpenInSafari: () => void;
}

export default function MoreOptionsSheet({
	isOpen,
	onClose,
	onAddToCalendar,
	onOpenInSafari,
}: MoreOptionsSheetProps) {
	const handleAddToCalendar = () => {
		onAddToCalendar();
		onClose();
	};

	const handleOpenInSafari = () => {
		onOpenInSafari();
		onClose();
	};

	return (
		<DetachedSheet.Root
			presented={isOpen}
			onPresentedChange={(presented) => !presented && onClose()}
		>
			<DetachedSheet.Portal>
				<DetachedSheet.View>
					<DetachedSheet.Backdrop />
					<DetachedSheet.Content>
						<div className='p-6'>
							{/* Handle */}
							<div className='mb-4 flex justify-center'>
								<DetachedSheet.Handle />
							</div>

							{/* Title */}
							<h2 className='mb-6 text-center text-lg font-semibold'>More Options</h2>

							{/* Options */}
							<div className='space-y-3'>
								<button
									onClick={handleAddToCalendar}
									className='flex w-full items-center gap-4 rounded-xl border border-gray-200 p-4 text-left transition-colors hover:bg-gray-50'
								>
									<CalendarPlus className='h-5 w-5 text-gray-600' />
									<span className='font-medium text-gray-900'>Add to Calendar</span>
								</button>

								<button
									onClick={handleOpenInSafari}
									className='flex w-full items-center gap-4 rounded-xl border border-gray-200 p-4 text-left transition-colors hover:bg-gray-50'
								>
									<ExternalLink className='h-5 w-5 text-gray-600' />
									<span className='font-medium text-gray-900'>Open in Safari</span>
								</button>
							</div>

							{/* Cancel Button */}
							<button
								onClick={onClose}
								className='mt-6 w-full rounded-xl border border-gray-200 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50'
							>
								Cancel
							</button>
						</div>
					</DetachedSheet.Content>
				</DetachedSheet.View>
			</DetachedSheet.Portal>
		</DetachedSheet.Root>
	);
}
