'use client';

import { DetachedSheet } from '@/components/ui/detached-sheet';
import { WeatherData } from '@/lib/types/weather';
import { Droplets, MoreHorizontal, Sun, Thermometer, Wind } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// Temperature conversion helper functions
const celsiusToFahrenheit = (celsius: number): number => {
	return Math.round((celsius * 9) / 5 + 32);
};

const fahrenheitToCelsius = (fahrenheit: number): number => {
	return Math.round(((fahrenheit - 32) * 5) / 9);
};

interface WeatherDetailSheetProps {
	weather: WeatherData;
	locationName: string;
	isOpen: boolean;
	onClose: () => void;
}

export default function WeatherDetailSheet({
	weather,
	locationName,
	isOpen,
	onClose,
}: WeatherDetailSheetProps) {
	const iconUrl = `https://openweathermap.org/img/wn/${weather.icon}@2x.png`;

	// Local unit toggle state (resets when sheet reopens)
	const [displayUnit, setDisplayUnit] = useState<'F' | 'C'>(weather.unit);
	const [showUnitMenu, setShowUnitMenu] = useState(false);
	const [iconError, setIconError] = useState(false); // Track image load errors
	const [iconLoaded, setIconLoaded] = useState(false); // Track if icon loaded successfully
	const iconRef = useRef<HTMLImageElement>(null);

	// Check if weather icon can be loaded
	useEffect(() => {
		const img = new Image();
		img.src = iconUrl;

		img.onload = () => {
			setIconLoaded(true);
			setIconError(false);
		};

		img.onerror = () => {
			setIconError(true);
			setIconLoaded(false);
			console.log('Weather icon failed to load:', iconUrl);
		};

		// Clean up
		return () => {
			img.onload = null;
			img.onerror = null;
		};
	}, [iconUrl]);

	// Helper function to get temperature in desired unit
	const getTemperature = (temp: number, originalUnit: 'F' | 'C', targetUnit: 'F' | 'C'): number => {
		if (originalUnit === targetUnit) return temp;

		if (originalUnit === 'F' && targetUnit === 'C') {
			return fahrenheitToCelsius(temp);
		} else {
			return celsiusToFahrenheit(temp);
		}
	};

	// Convert wind speed to appropriate unit (mph for F, m/s for C)
	const getWindSpeed = (speed: number, unit: 'F' | 'C'): { speed: string; unit: string } => {
		if (unit === 'F') {
			// Convert m/s to mph: multiply by 2.237
			const mph = (speed * 2.237).toFixed(1);
			return { speed: mph, unit: 'mph' };
		} else {
			return { speed: speed.toFixed(1), unit: 'm/s' };
		}
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

							{/* Header */}
							<div className='mb-6'>
								<div className='mb-2 flex items-center justify-between'>
									<div className='flex-1'></div>
									<h2 className='text-xl font-semibold text-gray-900'>Current Weather</h2>
									<div className='flex flex-1 justify-end'>
										{/* Temperature Unit Menu */}
										<div className='relative'>
											<button
												onClick={() => setShowUnitMenu(!showUnitMenu)}
												className='rounded-full p-2 transition-colors hover:bg-gray-100'
											>
												<MoreHorizontal className='h-5 w-5 text-gray-600' />
											</button>

											{showUnitMenu && (
												<div className='absolute right-0 top-full z-10 mt-1 min-w-[120px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg'>
													<button
														onClick={() => {
															setDisplayUnit('F');
															setShowUnitMenu(false);
														}}
														className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-gray-50 ${
															displayUnit === 'F' ? 'font-medium text-red-600' : 'text-gray-700'
														}`}
													>
														<span>Fahrenheit</span>
														{displayUnit === 'F' && (
															<div className='h-2 w-2 rounded-full bg-red-600'></div>
														)}
													</button>
													<button
														onClick={() => {
															setDisplayUnit('C');
															setShowUnitMenu(false);
														}}
														className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-gray-50 ${
															displayUnit === 'C' ? 'font-medium text-red-600' : 'text-gray-700'
														}`}
													>
														<span>Celsius</span>
														{displayUnit === 'C' && (
															<div className='h-2 w-2 rounded-full bg-red-600'></div>
														)}
													</button>
												</div>
											)}
										</div>
									</div>
								</div>
								<p className='text-center text-sm text-gray-600'>{locationName}</p>
							</div>

							{/* Main Weather Display */}
							<div className='mb-8 flex items-center justify-center'>
								<div className='text-center'>
									<div className='mb-2 flex items-center justify-center'>
										{!iconError && iconLoaded ? (
											<img
												ref={iconRef}
												src={iconUrl}
												alt={weather.description}
												className='h-20 w-20'
												width={80}
												height={80}
												loading='lazy'
											/>
										) : (
											<div className='flex h-20 w-20 items-center justify-center rounded-full bg-blue-50'>
												<Sun className='h-10 w-10 text-blue-400' />
											</div>
										)}
									</div>
									<div className='mb-1 text-4xl font-bold text-gray-900'>
										{getTemperature(weather.temperature, weather.unit, displayUnit)}°{displayUnit}
									</div>
									<div className='mb-1 text-lg capitalize text-gray-600'>{weather.description}</div>
									<div className='text-sm text-gray-500'>{weather.condition}</div>
								</div>
							</div>

							{/* Weather Details - 3 Cards Side by Side */}
							<div className='grid grid-cols-3 gap-4'>
								{weather.feelsLike && (
									<div className='rounded-lg bg-gray-50 p-4 text-center'>
										<Thermometer className='mx-auto mb-2 h-6 w-6 text-gray-600' />
										<div className='mb-1 text-xs font-medium text-gray-900'>Feels like</div>
										<div className='text-sm font-semibold text-gray-700'>
											{getTemperature(weather.feelsLike, weather.unit, displayUnit)}°{displayUnit}
										</div>
									</div>
								)}

								{weather.humidity && (
									<div className='rounded-lg bg-gray-50 p-4 text-center'>
										<Droplets className='mx-auto mb-2 h-6 w-6 text-gray-600' />
										<div className='mb-1 text-xs font-medium text-gray-900'>Humidity</div>
										<div className='text-sm font-semibold text-gray-700'>{weather.humidity}%</div>
									</div>
								)}

								{weather.windSpeed && (
									<div className='rounded-lg bg-gray-50 p-4 text-center'>
										<Wind className='mx-auto mb-2 h-6 w-6 text-gray-600' />
										<div className='mb-1 text-xs font-medium text-gray-900'>Wind</div>
										<div className='text-sm font-semibold text-gray-700'>
											{getWindSpeed(weather.windSpeed, displayUnit).speed}{' '}
											{getWindSpeed(weather.windSpeed, displayUnit).unit}
										</div>
									</div>
								)}
							</div>

							{/* Disclaimer */}
							<div className='mt-6 rounded-lg bg-blue-50 p-3'>
								<div className='text-xs text-blue-800'>
									<strong>Note:</strong> This shows current weather conditions at the event
									location, not the actual weather from the event date.
								</div>
							</div>
						</div>
					</DetachedSheet.Content>
				</DetachedSheet.View>
			</DetachedSheet.Portal>
		</DetachedSheet.Root>
	);
}
