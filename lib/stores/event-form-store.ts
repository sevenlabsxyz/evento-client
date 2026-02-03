import { LocationData } from '@/lib/hooks/use-google-places';
import { ApiEvent, EventFormData } from '@/lib/schemas/event';
import { debugError, debugLog } from '@/lib/utils/debug';
import { buildTitleWithEmoji, extractEmojiFromTitle } from '@/lib/utils/emoji';
import {
  TimeFormat,
  apiToDate,
  apiToTime,
  dateToApiFormat,
  getDefaultEventDateTime,
  timeToApiFormat,
} from '@/lib/utils/event-date';
import { getOptimizedImageUrl } from '@/lib/utils/image';
import { parseLocationString } from '@/lib/utils/location';
import { create } from 'zustand';

interface EventFormState {
  // Initial data for change detection
  initialData: Partial<EventFormData> | null;

  // Basic fields
  title: string;
  description: string;
  coverImage: string;

  // Emoji for title
  emoji: string | null;

  // Location
  location: LocationData | null;

  // Dates and times
  startDate: Date;
  endDate: Date;
  startTime: TimeFormat;
  endTime: TimeFormat;
  timezone: string;

  // Visibility and settings
  visibility: 'public' | 'private';
  hasCapacity: boolean;
  capacity: string;

  // Password protection
  passwordProtected: boolean;
  password: string | null;

  // Attachments and links
  spotifyUrl: string;
  wavlakeUrl: string;
  attachments: Array<{ type: string; url?: string; data?: any }>;

  // Contribution methods
  contribCashapp: string;
  contribVenmo: string;
  contribPaypal: string;
  contribBtclightning: string;
  cost: string;

  // Actions
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setCoverImage: (image: string) => void;
  setEmoji: (emoji: string | null) => void;
  setLocation: (location: LocationData | null) => void;
  setStartDate: (date: Date) => void;
  setEndDate: (date: Date) => void;
  setStartTime: (time: TimeFormat) => void;
  setEndTime: (time: TimeFormat) => void;
  setTimezone: (timezone: string) => void;
  setVisibility: (visibility: 'public' | 'private') => void;
  setHasCapacity: (hasCapacity: boolean) => void;
  setCapacity: (capacity: string) => void;
  setPasswordProtected: (passwordProtected: boolean) => void;
  setPassword: (password: string | null) => void;
  setPasswordProtection: (enabled: boolean, password: string | null) => void;
  setSpotifyUrl: (url: string) => void;
  setWavlakeUrl: (url: string) => void;
  setAttachments: (attachments: Array<{ type: string; url?: string; data?: any }>) => void;
  setContribCashapp: (value: string) => void;
  setContribVenmo: (value: string) => void;
  setContribPaypal: (value: string) => void;
  setContribBtclightning: (value: string) => void;
  setCost: (cost: string) => void;

  // Utility methods
  populateFromApiEvent: (event: ApiEvent) => void;
  getFormData: () => EventFormData;
  reset: () => void;
  isValid: () => boolean;
  hasChanges: () => boolean;
  setInitialData: (data: Partial<EventFormData>) => void;
}

// Helper to extract relative path from Supabase URL
function extractRelativePath(url: string): string {
  // If it's already a relative path, return as-is
  if (!url.includes('://')) {
    return url;
  }

  // Extract path from Supabase storage URL
  const supabasePattern = /\/storage\/v1\/object\/public\/cdn\/(.*?)(?:\?|$)/;
  const match = url.match(supabasePattern);
  if (match) {
    return match[1];
  }

  // Return original URL if it's not a Supabase URL
  return url;
}

// Get smart defaults for event creation
const defaultDateTime = getDefaultEventDateTime();

const initialState = {
  initialData: null,
  title: '',
  description: '<p></p>',
  coverImage: '',
  emoji: null,
  location: null,
  startDate: defaultDateTime.startDate,
  endDate: defaultDateTime.endDate,
  startTime: defaultDateTime.startTime,
  endTime: defaultDateTime.endTime,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  visibility: 'private' as const,
  hasCapacity: false,
  capacity: '',
  passwordProtected: false,
  password: null as string | null,
  spotifyUrl: '',
  wavlakeUrl: '',
  attachments: [],
  contribCashapp: '',
  contribVenmo: '',
  contribPaypal: '',
  contribBtclightning: '',
  cost: '',
};

export const useEventFormStore = create<EventFormState>((set, get) => ({
  ...initialState,

  // Basic setters
  setTitle: (title) => set({ title }),
  setDescription: (description) => set({ description }),
  setCoverImage: (coverImage) => set({ coverImage }),
  setEmoji: (emoji) => set({ emoji }),
  setLocation: (location) => set({ location }),
  setStartDate: (startDate) =>
    set((state) => {
      // If the new start date is after the current end date,
      // automatically adjust the end date to match the start date
      const updates: Partial<EventFormState> = { startDate };

      if (startDate > state.endDate) {
        // Set end date to match start date (same day)
        updates.endDate = new Date(startDate);

        // If end time is before or equal to start time, adjust it to be 1 hour after
        const startHours = state.startTime.hour;
        const startMinutes = state.startTime.minute;
        const endHours = state.endTime.hour;
        const endMinutes = state.endTime.minute;

        const startTotalMinutes = startHours * 60 + startMinutes;
        const endTotalMinutes = endHours * 60 + endMinutes;

        if (endTotalMinutes <= startTotalMinutes) {
          // Add 1 hour to start time
          const newEndTotalMinutes = startTotalMinutes + 60;
          updates.endTime = {
            hour: Math.floor(newEndTotalMinutes / 60) % 24,
            minute: newEndTotalMinutes % 60,
            period: state.endTime.period,
          };
        }
      }

      return updates;
    }),
  setEndDate: (endDate) => set({ endDate }),
  setStartTime: (startTime) =>
    set((state) => {
      const updates: Partial<EventFormState> = { startTime };

      // If start and end dates are the same day, ensure end time is after start time
      if (state.startDate.toDateString() === state.endDate.toDateString()) {
        const startTotalMinutes = startTime.hour * 60 + startTime.minute;
        const endTotalMinutes = state.endTime.hour * 60 + state.endTime.minute;

        if (endTotalMinutes <= startTotalMinutes) {
          // Add 1 hour to the new start time
          const newEndTotalMinutes = startTotalMinutes + 60;
          updates.endTime = {
            hour: Math.floor(newEndTotalMinutes / 60) % 24,
            minute: newEndTotalMinutes % 60,
            period: state.endTime.period,
          };
        }
      }

      return updates;
    }),
  setEndTime: (endTime) => set({ endTime }),
  setTimezone: (timezone) => set({ timezone }),
  setVisibility: (visibility) => set({ visibility }),
  setHasCapacity: (hasCapacity) => set({ hasCapacity }),
  setCapacity: (capacity) => set({ capacity }),
  setPasswordProtected: (passwordProtected) => set({ passwordProtected }),
  setPassword: (password) => set({ password }),
  setPasswordProtection: (enabled, password) =>
    set({ passwordProtected: enabled, password: enabled ? password : null }),
  setSpotifyUrl: (spotifyUrl) => set({ spotifyUrl }),
  setWavlakeUrl: (wavlakeUrl) => set({ wavlakeUrl }),
  setAttachments: (attachments) => set({ attachments }),
  setContribCashapp: (contribCashapp) => set({ contribCashapp }),
  setContribVenmo: (contribVenmo) => set({ contribVenmo }),
  setContribPaypal: (contribPaypal) => set({ contribPaypal }),
  setContribBtclightning: (contribBtclightning) => set({ contribBtclightning }),
  setCost: (cost) => set({ cost }),

  // Populate from API event
  populateFromApiEvent: (event: ApiEvent) => {
    debugLog('EventFormStore', 'populateFromApiEvent called', event);

    // Check if we have the expected date fields
    debugLog('EventFormStore', 'Checking date field availability', {
      has_start_date_day: 'start_date_day' in event,
      has_start_date_month: 'start_date_month' in event,
      has_start_date_year: 'start_date_year' in event,
      has_start_date_hours: 'start_date_hours' in event,
      has_start_date_minutes: 'start_date_minutes' in event,
      start_date_day: event.start_date_day,
      start_date_month: event.start_date_month,
      start_date_year: event.start_date_year,
      start_date_hours: event.start_date_hours,
      start_date_minutes: event.start_date_minutes,
    });

    try {
      // Parse dates
      debugLog('EventFormStore', 'Parsing start date', {
        day: event.start_date_day,
        month: event.start_date_month,
        year: event.start_date_year,
      });
      const startDate = apiToDate(
        event.start_date_day,
        event.start_date_month,
        event.start_date_year
      );

      debugLog('EventFormStore', 'Parsing end date', {
        day: event.end_date_day,
        month: event.end_date_month,
        year: event.end_date_year,
      });
      const endDate = apiToDate(event.end_date_day, event.end_date_month, event.end_date_year);

      debugLog('EventFormStore', 'Parsing start time', {
        hours: event.start_date_hours,
        minutes: event.start_date_minutes,
      });
      const startTime = apiToTime(event.start_date_hours, event.start_date_minutes);

      debugLog('EventFormStore', 'Parsing end time', {
        hours: event.end_date_hours,
        minutes: event.end_date_minutes,
      });
      const endTime = apiToTime(event.end_date_hours, event.end_date_minutes);

      debugLog('EventFormStore', 'Parsed dates successfully', {
        startDate,
        endDate,
        startTime,
        endTime,
      });

      // Parse location from event_locations (new format) or legacy location string
      debugLog('EventFormStore', 'Parsing location', {
        event_locations: event.event_locations,
        legacy_location: event.location,
      });

      let location: LocationData | null = null;

      if (event.event_locations) {
        // New format: location data from event_locations table
        const loc = event.event_locations;
        location = {
          name: loc.name || '',
          address: loc.address || '',
          city: loc.city || '',
          state: loc.state_province || undefined,
          country: loc.country || '',
          zipCode: loc.postal_code || undefined,
          coordinates:
            loc.latitude && loc.longitude ? { lat: loc.latitude, lng: loc.longitude } : undefined,
          formatted: [loc.name, loc.address, loc.city, loc.state_province, loc.country]
            .filter(Boolean)
            .join(', '),
        };
        debugLog('EventFormStore', 'Parsed location from event_locations', location);
      } else if (event.location) {
        // Fallback: legacy location string
        location = parseLocationString(event.location);
        debugLog('EventFormStore', 'Parsed location from legacy string', location);
      } else {
        debugLog('EventFormStore', 'No location data found');
      }

      // Handle cover image URL
      debugLog('EventFormStore', 'Processing cover image', {
        cover: event.cover,
      });
      const coverImage = event.cover ? getOptimizedImageUrl(event.cover, 800) : '';
      debugLog('EventFormStore', 'Processed cover image', { coverImage });

      // Extract emoji from title
      const { emoji, cleanTitle } = extractEmojiFromTitle(event.title);
      debugLog('EventFormStore', 'Extracted emoji from title', {
        emoji,
        cleanTitle,
        originalTitle: event.title,
      });

      const formData = {
        title: cleanTitle,
        emoji,
        description: event.description || '<p></p>',
        coverImage,
        location,
        startDate,
        endDate,
        startTime,
        endTime,
        timezone: event.timezone,
        visibility: event.visibility as 'public' | 'private',
        passwordProtected: event.password_protected || false,
        password: event.password || null,
        spotifyUrl: event.spotify_url || '',
        wavlakeUrl: event.wavlake_url || '',
        contribCashapp: event.contrib_cashapp || '',
        contribVenmo: event.contrib_venmo || '',
        contribPaypal: event.contrib_paypal || '',
        contribBtclightning: event.contrib_btclightning || '',
        cost: event.cost || '',
      };

      debugLog('EventFormStore', 'Setting form data', formData);
      set(formData);

      // Store initial data for change detection
      debugLog('EventFormStore', 'Storing initial data for change detection');
      get().setInitialData(get().getFormData());

      debugLog('EventFormStore', 'Population complete - Current form state', get());
    } catch (error) {
      debugError('EventFormStore', 'Failed to populate from API event', error, {
        event,
      });
    }
  },

  // Get form data in API format
  getFormData: (): EventFormData => {
    const state = get();
    const startDateApi = dateToApiFormat(state.startDate);
    const endDateApi = dateToApiFormat(state.endDate);
    const startTimeApi = timeToApiFormat(state.startTime);
    const endTimeApi = timeToApiFormat(state.endTime);

    // Combine emoji and title for the final title
    const finalTitle = buildTitleWithEmoji(state.emoji, state.title);

    // Transform location to backend format
    let locationObject = null;
    debugLog('EventFormStore', 'getFormData - Raw location state', {
      hasLocation: !!state.location,
      location: state.location,
      hasGooglePlaceData: !!state.location?.googlePlaceData,
    });

    if (state.location) {
      if (state.location.googlePlaceData) {
        // Google Places selection - send raw Google data
        locationObject = {
          type: 'google_place' as const,
          data: {
            googlePlaceData: state.location.googlePlaceData,
          },
        };
        debugLog('EventFormStore', 'getFormData - Created google_place location', locationObject);
      } else {
        // Manual/custom entry - just send the name
        locationObject = {
          type: 'manual_entry' as const,
          data: {
            name: state.location.name || state.location.formatted,
          },
        };
        debugLog('EventFormStore', 'getFormData - Created manual_entry location', locationObject);
      }
    } else {
      debugLog('EventFormStore', 'getFormData - No location set, sending null');
    }

    const formData = {
      title: finalTitle,
      description: state.description,
      location: locationObject,
      timezone: state.timezone,
      cover: state.coverImage ? extractRelativePath(state.coverImage) : null,

      // Start date/time
      start_date_day: startDateApi.day,
      start_date_month: startDateApi.month,
      start_date_year: startDateApi.year,
      start_date_hours: startTimeApi.hours,
      start_date_minutes: startTimeApi.minutes,

      // End date/time
      end_date_day: endDateApi.day,
      end_date_month: endDateApi.month,
      end_date_year: endDateApi.year,
      end_date_hours: endTimeApi.hours,
      end_date_minutes: endTimeApi.minutes,

      // Settings
      visibility: state.visibility,
      status: 'published',

      // URLs
      spotify_url: state.spotifyUrl || undefined,
      wavlake_url: state.wavlakeUrl || undefined,

      // Contribution methods
      contrib_cashapp: state.contribCashapp || undefined,
      contrib_venmo: state.contribVenmo || undefined,
      contrib_paypal: state.contribPaypal || undefined,
      contrib_btclightning: state.contribBtclightning || undefined,

      // Cost
      cost: state.cost || undefined,

      // Password protection
      password_protected: state.passwordProtected,
      password: state.passwordProtected ? state.password || undefined : undefined,

      // Settings for capacity
      settings: state.hasCapacity
        ? {
            max_capacity: parseInt(state.capacity) || undefined,
            show_capacity_count: true,
          }
        : undefined,
    };

    debugLog('EventFormStore', 'getFormData - Final payload', {
      location: formData.location,
      title: formData.title,
    });

    return formData;
  },

  // Reset to initial state with fresh default date/time
  reset: () => {
    const freshDefaults = getDefaultEventDateTime();
    set({
      ...initialState,
      startDate: freshDefaults.startDate,
      endDate: freshDefaults.endDate,
      startTime: freshDefaults.startTime,
      endTime: freshDefaults.endTime,
    });
  },

  // Validation
  isValid: () => {
    const state = get();
    return !!state.title.trim();
  },

  // Change detection
  hasChanges: () => {
    const state = get();
    if (!state.initialData) return false;

    const currentData = state.getFormData();

    // Compare key fields
    return (
      currentData.title !== state.initialData.title ||
      currentData.description !== state.initialData.description ||
      currentData.cover !== state.initialData.cover ||
      currentData.location !== state.initialData.location ||
      currentData.timezone !== state.initialData.timezone ||
      currentData.visibility !== state.initialData.visibility ||
      currentData.start_date_day !== state.initialData.start_date_day ||
      currentData.start_date_month !== state.initialData.start_date_month ||
      currentData.start_date_year !== state.initialData.start_date_year ||
      currentData.start_date_hours !== state.initialData.start_date_hours ||
      currentData.start_date_minutes !== state.initialData.start_date_minutes ||
      currentData.end_date_day !== state.initialData.end_date_day ||
      currentData.end_date_month !== state.initialData.end_date_month ||
      currentData.end_date_year !== state.initialData.end_date_year ||
      currentData.end_date_hours !== state.initialData.end_date_hours ||
      currentData.end_date_minutes !== state.initialData.end_date_minutes ||
      currentData.spotify_url !== state.initialData.spotify_url ||
      currentData.wavlake_url !== state.initialData.wavlake_url ||
      currentData.contrib_cashapp !== state.initialData.contrib_cashapp ||
      currentData.contrib_venmo !== state.initialData.contrib_venmo ||
      currentData.contrib_paypal !== state.initialData.contrib_paypal ||
      currentData.contrib_btclightning !== state.initialData.contrib_btclightning ||
      currentData.cost !== state.initialData.cost ||
      currentData.password_protected !== state.initialData.password_protected ||
      currentData.password !== state.initialData.password
    );
  },

  // Set initial data for comparison
  setInitialData: (data: Partial<EventFormData>) => set({ initialData: data }),
}));
