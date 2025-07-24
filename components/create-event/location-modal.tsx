'use client';

import { ChevronRight, MapPin, Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface LocationModalProps {
	isOpen: boolean;
	onClose: () => void;
	onLocationSelect: (location: LocationData) => void;
	selectedLocation?: LocationData;
}

export interface LocationData {
	name: string;
	address: string;
	city: string;
	state?: string;
	country: string;
	zipCode?: string;
	coordinates?: {
		lat: number;
		lng: number;
	};
	formatted: string; // Full formatted address for display
}

export default function LocationModal({
	isOpen,
	onClose,
	onLocationSelect,
	selectedLocation,
}: LocationModalProps) {
	const [searchQuery, setSearchQuery] = useState('');

	// Mock Google Places API results - in real app this would come from actual API
	const placesResults: LocationData[] = [
		{
			name: 'Moscone Center',
			address: '747 Howard St',
			city: 'San Francisco',
			state: 'CA',
			country: 'United States',
			zipCode: '94103',
			coordinates: { lat: 37.7849, lng: -122.4021 },
			formatted: 'Moscone Center, 747 Howard St, San Francisco, CA 94103, United States',
		},
		{
			name: 'Golden Gate Park',
			address: 'Golden Gate Park',
			city: 'San Francisco',
			state: 'CA',
			country: 'United States',
			coordinates: { lat: 37.7694, lng: -122.4862 },
			formatted: 'Golden Gate Park, San Francisco, CA, United States',
		},
		{
			name: 'Union Square',
			address: 'Union Square',
			city: 'San Francisco',
			state: 'CA',
			country: 'United States',
			coordinates: { lat: 37.788, lng: -122.4075 },
			formatted: 'Union Square, San Francisco, CA, United States',
		},
		{
			name: 'Pier 39',
			address: 'Pier 39',
			city: 'San Francisco',
			state: 'CA',
			country: 'United States',
			coordinates: { lat: 37.8086, lng: -122.4098 },
			formatted: 'Pier 39, San Francisco, CA, United States',
		},
	];

	// Filter locations based on search query
	const filteredLocations = useMemo(() => {
		if (!searchQuery.trim()) return placesResults;

		const query = searchQuery.toLowerCase();
		return placesResults.filter(
			(location) =>
				location.name.toLowerCase().includes(query) ||
				location.address.toLowerCase().includes(query) ||
				location.city.toLowerCase().includes(query) ||
				location.formatted.toLowerCase().includes(query)
		);
	}, [searchQuery, placesResults]);

	const handleLocationSelect = (location: LocationData) => {
		onLocationSelect(location);
		onClose();
	};

	const handleCustomLocation = () => {
		if (!searchQuery.trim()) return;

		// Create a custom location from the search query
		const customLocation: LocationData = {
			name: searchQuery,
			address: searchQuery,
			city: '',
			country: '',
			formatted: searchQuery,
		};

		handleLocationSelect(customLocation);
	};

	// Prevent body scroll when modal is open
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = 'unset';
		}

		return () => {
			document.body.style.overflow = 'unset';
		};
	}, [isOpen]);

	if (!isOpen) return null;

	return (
		<div className='fixed inset-0 z-50 bg-white'>
			{/* Header */}
			<div className='flex items-center justify-between border-b border-gray-200 p-4'>
				<button onClick={onClose} className='font-medium text-red-500'>
					Cancel
				</button>
				<h1 className='text-lg font-semibold'>Choose Location</h1>
				<div className='w-12'></div> {/* Spacer for centering */}
			</div>

			{/* Search Bar */}
			<div className='border-b border-gray-100 px-4 py-3'>
				<div className='relative'>
					<Search className='absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400' />
					<input
						type='text'
						placeholder='Search for a place or address'
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className='w-full rounded-xl border-none bg-gray-100 py-3 pl-10 pr-4 text-gray-700 placeholder-gray-400 outline-none'
						autoFocus
					/>
				</div>
			</div>

			{/* Location List */}
			<div className='flex-1 overflow-y-auto'>
				{/* Current Location Option */}
				<button className='w-full border-b border-gray-100 px-4 py-4 text-left hover:bg-gray-50'>
					<div className='flex items-center gap-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
							<MapPin className='h-5 w-5 text-blue-600' />
						</div>
						<div className='flex-1'>
							<p className='font-medium text-gray-900'>Use current location</p>
							<p className='text-sm text-gray-500'>We'll use your current GPS location</p>
						</div>
					</div>
				</button>

				{/* Search Results or Suggestions */}
				{searchQuery ? (
					<>
						{/* Google Places Results */}
						{filteredLocations.map((location, index) => (
							<button
								key={index}
								onClick={() => handleLocationSelect(location)}
								className='w-full border-b border-gray-100 px-4 py-4 text-left hover:bg-gray-50'
							>
								<div className='flex items-center gap-3'>
									<div className='flex h-10 w-10 items-center justify-center rounded-full bg-gray-100'>
										<MapPin className='h-5 w-5 text-gray-600' />
									</div>
									<div className='min-w-0 flex-1'>
										<p className='truncate font-medium text-gray-900'>{location.name}</p>
										<p className='truncate text-sm text-gray-500'>{location.formatted}</p>
									</div>
								</div>
							</button>
						))}

						{/* Custom Location Option */}
						{filteredLocations.length === 0 && searchQuery.trim() && (
							<button
								onClick={handleCustomLocation}
								className='w-full border-b border-gray-100 px-4 py-4 text-left hover:bg-gray-50'
							>
								<div className='flex items-center gap-3'>
									<div className='flex h-10 w-10 items-center justify-center rounded-full bg-red-100'>
										<Plus className='h-5 w-5 text-red-600' />
									</div>
									<div className='flex-1'>
										<p className='font-medium text-gray-900'>Add "{searchQuery}"</p>
										<p className='text-sm text-gray-500'>Use as custom location</p>
									</div>
								</div>
							</button>
						)}
					</>
				) : (
					/* Default Suggestions */
					<>
						<div className='px-4 py-3'>
							<h3 className='text-sm font-semibold text-gray-900'>Suggested</h3>
						</div>
						{placesResults.slice(0, 4).map((location, index) => (
							<button
								key={index}
								onClick={() => handleLocationSelect(location)}
								className='w-full border-b border-gray-100 px-4 py-4 text-left hover:bg-gray-50'
							>
								<div className='flex items-center justify-between'>
									<div className='flex items-center gap-3'>
										<div className='flex h-10 w-10 items-center justify-center rounded-full bg-gray-100'>
											<MapPin className='h-5 w-5 text-gray-600' />
										</div>
										<div className='min-w-0 flex-1'>
											<p className='font-medium text-gray-900'>{location.name}</p>
											<p className='text-sm text-gray-500'>
												{location.city}, {location.state}
											</p>
										</div>
									</div>
									<ChevronRight className='h-4 w-4 text-gray-400' />
								</div>
							</button>
						))}
					</>
				)}

				{searchQuery && filteredLocations.length === 0 && !searchQuery.trim() && (
					<div className='flex items-center justify-center py-12'>
						<p className='text-gray-500'>No locations found</p>
					</div>
				)}
			</div>
		</div>
	);
}
