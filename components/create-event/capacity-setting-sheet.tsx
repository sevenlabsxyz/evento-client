import { SheetWithDetent } from '@/components/ui/sheet-with-detent';
import { useState } from 'react';

interface CapacitySettingSheetProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (capacity: string) => void;
	initialCapacity?: string;
}

export default function CapacitySettingSheet({
	isOpen,
	onClose,
	onSave,
	initialCapacity = '',
}: CapacitySettingSheetProps) {
	const [capacity, setCapacity] = useState(initialCapacity);
	const [error, setError] = useState('');

	const handleSave = () => {
		if (!capacity.trim()) {
			setError('Please enter a capacity number');
			return;
		}

		const num = parseInt(capacity.trim());
		if (isNaN(num) || num <= 0) {
			setError('Please enter a valid number greater than 0');
			return;
		}

		onSave(capacity.trim());
	};

	const handleClose = () => {
		setCapacity(initialCapacity);
		setError('');
		onClose();
	};

	const quickNumbers = [5, 10, 25, 100];

	const handleQuickSelect = (num: number) => {
		setCapacity(num.toString());
		setError('');
	};

	return (
		<SheetWithDetent.Root
			presented={isOpen}
			onPresentedChange={(presented) => !presented && handleClose()}
		>
			<SheetWithDetent.Portal>
				<SheetWithDetent.View>
					<SheetWithDetent.Backdrop />
					<SheetWithDetent.Content>
						<div className='p-6'>
							{/* Handle */}
							<div className='mb-4 flex justify-center'>
								<SheetWithDetent.Handle />
							</div>

							{/* Header */}
							<div className='mb-6'>
								<div className='mb-6 flex items-center justify-between'>
									<button onClick={handleClose} className='font-medium text-red-500'>
										Cancel
									</button>
									<h2 className='text-lg font-semibold'>Set Event Capacity</h2>
									<button
										onClick={handleSave}
										className='rounded-xl bg-red-500 px-4 py-2 font-medium text-white'
									>
										Save
									</button>
								</div>
							</div>

							{/* Form */}
							<div className='space-y-4'>
								<div className='space-y-2'>
									<label className='text-sm font-medium text-gray-700'>
										Maximum number of attendees
									</label>

									{/* Quick select buttons */}
									<div className='mb-3 flex gap-2'>
										{quickNumbers.map((num) => (
											<button
												key={num}
												onClick={() => handleQuickSelect(num)}
												className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
													capacity === num.toString()
														? 'bg-red-500 text-white'
														: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
												}`}
											>
												{num}
											</button>
										))}
									</div>

									<input
										type='number'
										value={capacity}
										onChange={(e) => {
											setCapacity(e.target.value);
											setError('');
										}}
										placeholder='Enter capacity'
										className='w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500'
										min='1'
										autoFocus
									/>
									{error && <p className='mt-1 text-sm text-red-500'>{error}</p>}
								</div>
							</div>
						</div>
					</SheetWithDetent.Content>
				</SheetWithDetent.View>
			</SheetWithDetent.Portal>
		</SheetWithDetent.Root>
	);
}
