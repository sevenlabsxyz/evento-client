'use client';

import { DetachedSheet } from '@/components/ui/detached-sheet';
import { formatSelectedTimezone } from '@/lib/utils/timezone';
import { useEffect, useRef, useState } from 'react';
import TimezoneSheet from './timezone-sheet';

interface TimePickerSheetProps {
	isOpen: boolean;
	onClose: () => void;
	onTimeSelect: (time: { hour: number; minute: number; period: 'AM' | 'PM' }) => void;
	onTimezoneSelect: (timezone: string) => void;
	selectedTime?: { hour: number; minute: number; period: 'AM' | 'PM' };
	timezone: string;
	title: string;
}

export default function TimePickerSheet({
	isOpen,
	onClose,
	onTimeSelect,
	onTimezoneSelect,
	selectedTime,
	timezone,
	title,
}: TimePickerSheetProps) {
	const [hour, setHour] = useState(selectedTime?.hour || 9);
	const [minute, setMinute] = useState(selectedTime?.minute || 45);
	const [period, setPeriod] = useState<'AM' | 'PM'>(selectedTime?.period || 'AM');

	const hours = Array.from({ length: 12 }, (_, i) => i + 1);
	const minutes = Array.from({ length: 60 }, (_, i) => i);
	const periods = ['AM', 'PM'];

	const formatTime = () => {
		return `${title}\n${hour.toString().padStart(2, '0')}:${minute
			.toString()
			.padStart(2, '0')} ${period}`;
	};

	const handleSave = () => {
		onTimeSelect({ hour, minute, period });
		onClose();
	};

	const handleClear = () => {
		setHour(9);
		setMinute(45);
		setPeriod('AM');
		onTimeSelect({ hour: 9, minute: 45, period: 'AM' });
		onClose();
	};

	// Scroll wheel component
	const ScrollWheel = ({
		values,
		selectedValue,
		onValueChange,
		formatValue,
	}: {
		values: (number | string)[];
		selectedValue: number | string;
		onValueChange: (value: any) => void;
		formatValue?: (value: any) => string;
	}) => {
		const wheelRef = useRef<HTMLDivElement>(null);

		useEffect(() => {
			if (wheelRef.current) {
				const selectedIndex = values.indexOf(selectedValue);
				const itemHeight = 44; // Height of each item
				const containerHeight = 176; // h-44 = 176px
				const scrollTop = selectedIndex * itemHeight - containerHeight / 2 + itemHeight / 2;
				wheelRef.current.scrollTop = Math.max(0, scrollTop);
			}
		}, [selectedValue, values]);

		return (
			<div className='relative h-44 overflow-hidden'>
				{/* Gradient overlays */}
				<div className='pointer-events-none absolute left-0 right-0 top-0 z-10 h-11 bg-gradient-to-b from-white to-transparent' />
				<div className='pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-11 bg-gradient-to-t from-white to-transparent' />

				{/* Selection indicator */}
				<div className='-mt-5.5 pointer-events-none absolute left-0 right-0 top-1/2 z-10 h-11 border-b border-t border-transparent' />

				<div
					ref={wheelRef}
					className='scrollbar-hide h-full overflow-y-auto'
					style={{ scrollSnapType: 'y mandatory' }}
					onTouchStart={(e) => e.stopPropagation()}
					onTouchMove={(e) => e.stopPropagation()}
					onWheel={(e) => e.stopPropagation()}
				>
					{/* Padding top */}
					<div className='h-22' />

					{values.map((value, index) => (
						<button
							key={index}
							onClick={() => onValueChange(value)}
							className={`flex h-11 w-full items-center justify-center rounded-lg text-lg font-medium transition-colors ${
								selectedValue === value
									? 'border border-gray-200 bg-gray-100 text-gray-900'
									: 'text-gray-400 hover:text-gray-500'
							} `}
							style={{ scrollSnapAlign: 'center' }}
						>
							{formatValue ? formatValue(value) : value}
						</button>
					))}

					{/* Padding bottom */}
					<div className='h-22' />
				</div>
			</div>
		);
	};

	const [showTimezoneSheet, setShowTimezoneSheet] = useState(false);

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

							{/* Header */}
							<div className='mb-6'>
								<div className='flex items-center justify-between'>
									<button onClick={onClose} className='font-medium text-red-500'>
										Cancel
									</button>
									<div className='text-center'>
										<h2 className='text-lg font-semibold'>{title}</h2>
										<p className='whitespace-pre-line text-sm text-gray-500'>
											{`${hour.toString().padStart(2, '0')}:${minute
												.toString()
												.padStart(2, '0')} ${period}`}
										</p>
									</div>
									<button
										onClick={handleSave}
										className='rounded-xl bg-red-500 px-4 py-2 font-medium text-white'
									>
										Save
									</button>
								</div>
							</div>

							{/* Time Wheels */}
							<div className='pb-4'>
								<div className='grid grid-cols-3 gap-4'>
									{/* Hour Wheel */}
									<div className='text-center'>
										<ScrollWheel
											values={hours}
											selectedValue={hour}
											onValueChange={setHour}
											formatValue={(value) => value.toString().padStart(2, '0')}
										/>
									</div>

									{/* Minute Wheel */}
									<div className='text-center'>
										<ScrollWheel
											values={minutes}
											selectedValue={minute}
											onValueChange={setMinute}
											formatValue={(value) => value.toString().padStart(2, '0')}
										/>
									</div>

									{/* AM/PM Toggle Buttons */}
									<div className='flex h-44 flex-col items-center justify-center gap-2'>
										<button
											onClick={() => setPeriod('AM')}
											className={`h-10 w-16 rounded-lg border text-lg font-medium transition-colors ${
												period === 'AM'
													? 'border-gray-300 bg-gray-100 text-gray-900'
													: 'border-gray-200 bg-transparent text-gray-400'
											} `}
										>
											AM
										</button>
										<button
											onClick={() => setPeriod('PM')}
											className={`h-10 w-16 rounded-lg border text-lg font-medium transition-colors ${
												period === 'PM'
													? 'border-gray-300 bg-gray-100 text-gray-900'
													: 'border-gray-200 bg-transparent text-gray-400'
											} `}
										>
											PM
										</button>
									</div>
								</div>
							</div>

							{/* Timezone Button */}
							<div className='pb-4'>
								<button
									onClick={() => setShowTimezoneSheet(true)}
									className='w-full rounded-xl bg-red-100 p-3 font-medium text-red-600'
								>
									Timezone: {formatSelectedTimezone(timezone)}
								</button>
							</div>

							{/* Clear Button */}
							<div className='border-t border-gray-100 pt-4'>
								<button onClick={handleClear} className='w-full py-3 font-medium text-red-500'>
									Clear Time
								</button>
							</div>
						</div>

						<style jsx>{`
							.scrollbar-hide {
								-ms-overflow-style: none;
								scrollbar-width: none;
							}
							.scrollbar-hide::-webkit-scrollbar {
								display: none;
							}
						`}</style>

						{/* Nested Timezone Sheet */}
						<TimezoneSheet
							isOpen={showTimezoneSheet}
							onClose={() => setShowTimezoneSheet(false)}
							onTimezoneSelect={(tz) => {
								onTimezoneSelect(tz);
								setShowTimezoneSheet(false);
							}}
							selectedTimezone={timezone}
						/>
					</DetachedSheet.Content>
				</DetachedSheet.View>
			</DetachedSheet.Portal>
		</DetachedSheet.Root>
	);
}
