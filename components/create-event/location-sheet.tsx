'use client';
import { SheetWithDetent } from '@/components/ui/sheet-with-detent';
import { VisuallyHidden } from '@silk-hq/components';
import { ChevronRight, MapPin, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import './location-sheet.css';

interface LocationSheetProps {
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

export default function LocationSheet({
  isOpen,
  onClose,
  onLocationSelect,
  selectedLocation,
}: LocationSheetProps) {
  const [activeDetent, setActiveDetent] = useState(0);
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
      formatted:
        'Moscone Center, 747 Howard St, San Francisco, CA 94103, United States',
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
  }, [searchQuery]);

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

  const handleCurrentLocation = () => {
    // In a real app, this would request GPS location
    const currentLocation: LocationData = {
      name: 'Current Location',
      address: 'Your current location',
      city: '',
      country: '',
      formatted: 'Current Location',
    };

    handleLocationSelect(currentLocation);
  };

  return (
    <SheetWithDetent.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && onClose()}
      activeDetent={activeDetent}
      onActiveDetentChange={setActiveDetent}
    >
      <SheetWithDetent.Portal>
        <SheetWithDetent.View>
          <SheetWithDetent.Backdrop />
          <SheetWithDetent.Content className="LocationSheet-content">
            <div className="LocationSheet-header">
              <SheetWithDetent.Handle className="LocationSheet-handle" />
              <VisuallyHidden.Root asChild>
                <SheetWithDetent.Title className="LocationSheet-title">
                  Choose Location
                </SheetWithDetent.Title>
              </VisuallyHidden.Root>
              <div className="LocationSheet-searchContainer">
                <Search className="LocationSheet-searchIcon" />
                <input
                  className="LocationSheet-input"
                  type="text"
                  placeholder="Search for a place or address"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setActiveDetent(2)}
                  autoFocus
                />
              </div>
            </div>
            <SheetWithDetent.ScrollRoot asChild>
              <SheetWithDetent.ScrollView className="LocationSheet-scrollView">
                <SheetWithDetent.ScrollContent className="LocationSheet-scrollContent">
                  {/* Current Location Option */}
                  <button
                    onClick={handleCurrentLocation}
                    className="LocationSheet-locationItem LocationSheet-currentLocation"
                  >
                    <div className="LocationSheet-locationIcon LocationSheet-locationIcon--blue">
                      <MapPin className="LocationSheet-icon" />
                    </div>
                    <div className="LocationSheet-locationDetails">
                      <div className="LocationSheet-locationName">
                        Use current location
                      </div>
                      <div className="LocationSheet-locationAddress">
                        We'll use your current GPS location
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
                          className="LocationSheet-locationItem"
                        >
                          <div className="LocationSheet-locationIcon">
                            <MapPin className="LocationSheet-icon" />
                          </div>
                          <div className="LocationSheet-locationDetails">
                            <div className="LocationSheet-locationName">
                              {location.name}
                            </div>
                            <div className="LocationSheet-locationAddress">
                              {location.formatted}
                            </div>
                          </div>
                        </button>
                      ))}

                      {/* Custom Location Option */}
                      {filteredLocations.length === 0 && searchQuery.trim() && (
                        <button
                          onClick={handleCustomLocation}
                          className="LocationSheet-locationItem"
                        >
                          <div className="LocationSheet-locationIcon LocationSheet-locationIcon--red">
                            <Plus className="LocationSheet-icon" />
                          </div>
                          <div className="LocationSheet-locationDetails">
                            <div className="LocationSheet-locationName">
                              Add "{searchQuery}"
                            </div>
                            <div className="LocationSheet-locationAddress">
                              Use as custom location
                            </div>
                          </div>
                        </button>
                      )}
                    </>
                  ) : (
                    /* Default Suggestions */
                    <>
                      <div className="LocationSheet-sectionTitle">
                        Suggested
                      </div>
                      {placesResults.slice(0, 4).map((location, index) => (
                        <button
                          key={index}
                          onClick={() => handleLocationSelect(location)}
                          className="LocationSheet-locationItem LocationSheet-locationItem--withChevron"
                        >
                          <div className="LocationSheet-locationIcon">
                            <MapPin className="LocationSheet-icon" />
                          </div>
                          <div className="LocationSheet-locationDetails">
                            <div className="LocationSheet-locationName">
                              {location.name}
                            </div>
                            <div className="LocationSheet-locationAddress">
                              {location.city}, {location.state}
                            </div>
                          </div>
                          <ChevronRight className="LocationSheet-chevron" />
                        </button>
                      ))}
                    </>
                  )}

                  {searchQuery &&
                    filteredLocations.length === 0 &&
                    !searchQuery.trim() && (
                      <div className="LocationSheet-noResults">
                        No locations found
                      </div>
                    )}
                </SheetWithDetent.ScrollContent>
              </SheetWithDetent.ScrollView>
            </SheetWithDetent.ScrollRoot>
          </SheetWithDetent.Content>
        </SheetWithDetent.View>
      </SheetWithDetent.Portal>
    </SheetWithDetent.Root>
  );
}
