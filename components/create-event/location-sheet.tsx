'use client';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { LocationData, useGooglePlaces } from '@/lib/hooks/use-google-places';
import { debugLog } from '@/lib/utils/debug';
import { Loader2, MapPin, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

interface LocationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: LocationData) => void;
  selectedLocation?: LocationData;
}

export type { LocationData };

export default function LocationSheet({ isOpen, onClose, onLocationSelect }: LocationSheetProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSelectingPlace, setIsSelectingPlace] = useState(false);
  const [isGettingCurrentLocation, setIsGettingCurrentLocation] = useState(false);

  const {
    predictions,
    isLoading,
    error,
    searchPlaces,
    getPlaceDetails,
    getCurrentLocation,
    clearPredictions,
    isScriptLoaded,
  } = useGooglePlaces();

  // Trigger search when query changes
  useEffect(() => {
    searchPlaces(searchQuery);
  }, [searchQuery, searchPlaces]);

  // Clear predictions when sheet closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      clearPredictions();
    }
  }, [isOpen, clearPredictions]);

  const handleLocationSelect = (location: LocationData) => {
    debugLog('LocationSheet', 'handleLocationSelect - Final location being sent to store', {
      location,
      hasGooglePlaceData: !!location.googlePlaceData,
      googlePlaceData: location.googlePlaceData,
    });
    onLocationSelect(location);
    onClose();
  };

  const handlePlaceSelect = async (placeId: string) => {
    debugLog('LocationSheet', 'handlePlaceSelect - Fetching place details', { placeId });
    setIsSelectingPlace(true);
    const locationData = await getPlaceDetails(placeId);
    setIsSelectingPlace(false);

    debugLog('LocationSheet', 'handlePlaceSelect - Place details received', {
      locationData,
      hasGooglePlaceData: !!locationData?.googlePlaceData,
    });

    if (locationData) {
      handleLocationSelect(locationData);
    }
  };

  const handleCustomLocation = () => {
    if (!searchQuery.trim()) return;

    const customLocation: LocationData = {
      name: searchQuery,
      address: searchQuery,
      city: '',
      country: '',
      formatted: searchQuery,
    };

    debugLog('LocationSheet', 'handleCustomLocation - Created custom location', customLocation);
    handleLocationSelect(customLocation);
  };

  const handleCurrentLocation = async () => {
    setIsGettingCurrentLocation(true);
    const location = await getCurrentLocation();
    setIsGettingCurrentLocation(false);

    if (location) {
      handleLocationSelect(location);
    }
  };

  // Search input as secondary header
  const searchHeader = (
    <div className='relative px-4 pb-4'>
      <Search className='absolute left-7 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400' />
      <input
        type='text'
        placeholder='Search for a place or address'
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className='h-11 w-full rounded-xl bg-gray-100 pl-11 pr-4 text-base outline-none placeholder:text-gray-400'
        autoFocus
      />
    </div>
  );

  return (
    <MasterScrollableSheet
      title='Choose Location'
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      headerSecondary={searchHeader}
      contentClassName='pb-safe'
    >
      <div className='flex flex-col'>
        {/* Current Location Option */}
        <button
          onClick={handleCurrentLocation}
          disabled={isGettingCurrentLocation}
          className='flex w-full items-center gap-3 border-b border-gray-100 px-4 py-4 text-left transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60'
        >
          <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100'>
            {isGettingCurrentLocation ? (
              <Loader2 className='h-5 w-5 animate-spin text-blue-600' />
            ) : (
              <MapPin className='h-5 w-5 text-blue-600' />
            )}
          </div>
          <div className='min-w-0 flex-1'>
            <div className='truncate font-medium text-gray-900'>
              {isGettingCurrentLocation ? 'Getting location...' : 'Use current location'}
            </div>
            <div className='truncate text-sm text-gray-500'>
              {error || "We'll use your current GPS location"}
            </div>
          </div>
        </button>

        {/* Loading State */}
        {(isLoading || isSelectingPlace) && (
          <div className='flex items-center justify-center gap-2 py-4'>
            <Loader2 className='h-5 w-5 animate-spin text-gray-400' />
            <span className='text-sm text-gray-500'>
              {isSelectingPlace ? 'Loading place details...' : 'Searching...'}
            </span>
          </div>
        )}

        {/* Search Results */}
        {searchQuery && !isLoading ? (
          <>
            {/* Google Places Results */}
            {predictions.map((prediction) => (
              <button
                key={prediction.placeId}
                onClick={() => handlePlaceSelect(prediction.placeId)}
                disabled={isSelectingPlace}
                className='flex w-full items-center gap-3 border-b border-gray-100 px-4 py-4 text-left transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60'
              >
                <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-100'>
                  <MapPin className='h-5 w-5 text-gray-500' />
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='truncate font-medium text-gray-900'>{prediction.mainText}</div>
                  <div className='truncate text-sm text-gray-500'>{prediction.secondaryText}</div>
                </div>
              </button>
            ))}

            {/* Custom Location Option - always show when there's a search query */}
            {searchQuery.trim() && (
              <button
                onClick={handleCustomLocation}
                className='flex w-full items-center gap-3 border-b border-gray-100 px-4 py-4 text-left transition-colors hover:bg-gray-50'
              >
                <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100'>
                  <Plus className='h-5 w-5 text-red-500' />
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='truncate font-medium text-gray-900'>Add "{searchQuery}"</div>
                  <div className='truncate text-sm text-gray-500'>Use as custom location</div>
                </div>
              </button>
            )}
          </>
        ) : !searchQuery && isScriptLoaded ? (
          /* Empty state - prompt to search */
          <div className='px-4 py-6 text-center'>
            <p className='text-sm text-gray-500'>
              Type to search for places or add a custom location
            </p>
          </div>
        ) : null}
      </div>
    </MasterScrollableSheet>
  );
}
