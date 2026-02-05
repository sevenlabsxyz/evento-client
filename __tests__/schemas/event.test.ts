import {
  eventFormSchema,
  createEventSchema,
  updateEventSchema,
  locationObjectSchema,
  googlePlaceDataSchema,
  eventLocationSchema,
  apiEventSchema,
} from '@/lib/schemas/event';
import { z } from 'zod';

describe('Event Schemas', () => {
  describe('googlePlaceDataSchema', () => {
    it('validates valid Google Place data', () => {
      const validData = {
        place_id: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
        name: 'Google Sydney',
        formatted_address: '48 Pirrama Rd, Pyrmont NSW 2009, Australia',
        address_components: [{ long_name: 'Sydney', short_name: 'Sydney', types: ['locality'] }],
        geometry: {
          location: {
            lat: -33.866489,
            lng: 151.195677,
          },
        },
      };

      const result = googlePlaceDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.place_id).toBe(validData.place_id);
        expect(result.data.geometry.location.lat).toBe(-33.866489);
      }
    });

    it('rejects data with missing required fields', () => {
      const invalidData = {
        place_id: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
        name: 'Google Sydney',
        // Missing formatted_address, address_components, geometry
      };

      const result = googlePlaceDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects data with invalid geometry coordinates', () => {
      const invalidData = {
        place_id: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
        name: 'Google Sydney',
        formatted_address: '48 Pirrama Rd, Pyrmont NSW 2009, Australia',
        address_components: [],
        geometry: {
          location: {
            lat: 'invalid', // Should be number
            lng: 151.195677,
          },
        },
      };

      const result = googlePlaceDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('locationObjectSchema', () => {
    it('validates google_place location type', () => {
      const validData = {
        type: 'google_place' as const,
        data: {
          googlePlaceData: {
            place_id: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
            name: 'Google Sydney',
            formatted_address: '48 Pirrama Rd, Pyrmont NSW 2009, Australia',
            address_components: [],
            geometry: {
              location: {
                lat: -33.866489,
                lng: 151.195677,
              },
            },
          },
        },
      };

      const result = locationObjectSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('validates manual_entry location type', () => {
      const validData = {
        type: 'manual_entry' as const,
        data: {
          name: 'My Custom Location',
        },
      };

      const result = locationObjectSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('validates existing location type', () => {
      const validData = {
        type: 'existing' as const,
        data: {
          location_id: 'loc_123456',
        },
      };

      const result = locationObjectSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects invalid location type', () => {
      const invalidData = {
        type: 'invalid_type',
        data: {
          name: 'Test',
        },
      };

      const result = locationObjectSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects mismatched type and data structure', () => {
      const invalidData = {
        type: 'manual_entry' as const,
        data: {
          location_id: 'loc_123', // Wrong data for manual_entry type
        },
      };

      const result = locationObjectSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('eventFormSchema', () => {
    const validEventData = {
      title: 'Test Event',
      description: 'This is a test event description',
      location: {
        type: 'manual_entry' as const,
        data: {
          name: 'Test Location',
        },
      },
      timezone: 'America/New_York',
      cover: null,
      start_date_day: 15,
      start_date_month: 6,
      start_date_year: 2025,
      start_date_hours: 14,
      start_date_minutes: 30,
      end_date_day: 15,
      end_date_month: 6,
      end_date_year: 2025,
      end_date_hours: 18,
      end_date_minutes: 0,
      visibility: 'public' as const,
      status: 'published' as const,
    };

    it('validates complete valid event data', () => {
      const result = eventFormSchema.safeParse(validEventData);
      expect(result.success).toBe(true);
    });

    it('rejects empty title', () => {
      const invalidData = { ...validEventData, title: '' };
      const result = eventFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Title is required');
      }
    });

    it('rejects title exceeding max length', () => {
      const invalidData = { ...validEventData, title: 'a'.repeat(201) };
      const result = eventFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects missing timezone', () => {
      const invalidData = { ...validEventData, timezone: '' };
      const result = eventFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Timezone is required');
      }
    });

    it('validates date boundaries - day', () => {
      // Test minimum day
      const minDay = { ...validEventData, start_date_day: 1 };
      expect(eventFormSchema.safeParse(minDay).success).toBe(true);

      // Test maximum day
      const maxDay = { ...validEventData, start_date_day: 31 };
      expect(eventFormSchema.safeParse(maxDay).success).toBe(true);

      // Test invalid day (too low)
      const tooLowDay = { ...validEventData, start_date_day: 0 };
      expect(eventFormSchema.safeParse(tooLowDay).success).toBe(false);

      // Test invalid day (too high)
      const tooHighDay = { ...validEventData, start_date_day: 32 };
      expect(eventFormSchema.safeParse(tooHighDay).success).toBe(false);
    });

    it('validates date boundaries - month', () => {
      // Test minimum month
      const minMonth = { ...validEventData, start_date_month: 1 };
      expect(eventFormSchema.safeParse(minMonth).success).toBe(true);

      // Test maximum month
      const maxMonth = { ...validEventData, start_date_month: 12 };
      expect(eventFormSchema.safeParse(maxMonth).success).toBe(true);

      // Test invalid month (too low)
      const tooLowMonth = { ...validEventData, start_date_month: 0 };
      expect(eventFormSchema.safeParse(tooLowMonth).success).toBe(false);

      // Test invalid month (too high)
      const tooHighMonth = { ...validEventData, start_date_month: 13 };
      expect(eventFormSchema.safeParse(tooHighMonth).success).toBe(false);
    });

    it('validates date boundaries - year', () => {
      // Test minimum year
      const minYear = { ...validEventData, start_date_year: 2024 };
      expect(eventFormSchema.safeParse(minYear).success).toBe(true);

      // Test maximum year
      const maxYear = { ...validEventData, start_date_year: 2050 };
      expect(eventFormSchema.safeParse(maxYear).success).toBe(true);

      // Test invalid year (too low)
      const tooLowYear = { ...validEventData, start_date_year: 2023 };
      expect(eventFormSchema.safeParse(tooLowYear).success).toBe(false);

      // Test invalid year (too high)
      const tooHighYear = { ...validEventData, start_date_year: 2051 };
      expect(eventFormSchema.safeParse(tooHighYear).success).toBe(false);
    });

    it('validates time boundaries - hours', () => {
      // Test minimum hours
      const minHours = { ...validEventData, start_date_hours: 0 };
      expect(eventFormSchema.safeParse(minHours).success).toBe(true);

      // Test maximum hours
      const maxHours = { ...validEventData, start_date_hours: 23 };
      expect(eventFormSchema.safeParse(maxHours).success).toBe(true);

      // Test invalid hours (too high)
      const tooHighHours = { ...validEventData, start_date_hours: 24 };
      expect(eventFormSchema.safeParse(tooHighHours).success).toBe(false);

      // Test null hours (optional)
      const nullHours = { ...validEventData, start_date_hours: null };
      expect(eventFormSchema.safeParse(nullHours).success).toBe(true);
    });

    it('validates time boundaries - minutes', () => {
      // Test minimum minutes
      const minMinutes = { ...validEventData, start_date_minutes: 0 };
      expect(eventFormSchema.safeParse(minMinutes).success).toBe(true);

      // Test maximum minutes
      const maxMinutes = { ...validEventData, start_date_minutes: 59 };
      expect(eventFormSchema.safeParse(maxMinutes).success).toBe(true);

      // Test invalid minutes (too high)
      const tooHighMinutes = { ...validEventData, start_date_minutes: 60 };
      expect(eventFormSchema.safeParse(tooHighMinutes).success).toBe(false);

      // Test null minutes (optional)
      const nullMinutes = { ...validEventData, start_date_minutes: null };
      expect(eventFormSchema.safeParse(nullMinutes).success).toBe(true);
    });

    it('validates visibility enum', () => {
      const publicEvent = { ...validEventData, visibility: 'public' as const };
      expect(eventFormSchema.safeParse(publicEvent).success).toBe(true);

      const privateEvent = { ...validEventData, visibility: 'private' as const };
      expect(eventFormSchema.safeParse(privateEvent).success).toBe(true);

      const invalidVisibility = { ...validEventData, visibility: 'invalid' };
      expect(eventFormSchema.safeParse(invalidVisibility).success).toBe(false);
    });

    it('validates status enum', () => {
      const publishedEvent = { ...validEventData, status: 'published' as const };
      expect(eventFormSchema.safeParse(publishedEvent).success).toBe(true);

      const draftEvent = { ...validEventData, status: 'draft' as const };
      expect(eventFormSchema.safeParse(draftEvent).success).toBe(true);

      const invalidStatus = { ...validEventData, status: 'invalid' };
      expect(eventFormSchema.safeParse(invalidStatus).success).toBe(false);
    });

    it('validates optional URL fields', () => {
      // Valid URLs
      const withValidUrls = {
        ...validEventData,
        spotify_url: 'https://open.spotify.com/playlist/123',
        wavlake_url: 'https://wavlake.com/track/456',
      };
      expect(eventFormSchema.safeParse(withValidUrls).success).toBe(true);

      // Empty strings are allowed
      const withEmptyUrls = {
        ...validEventData,
        spotify_url: '',
        wavlake_url: '',
      };
      expect(eventFormSchema.safeParse(withEmptyUrls).success).toBe(true);

      // Invalid URLs
      const withInvalidUrls = {
        ...validEventData,
        spotify_url: 'not-a-url',
      };
      expect(eventFormSchema.safeParse(withInvalidUrls).success).toBe(false);
    });

    it('validates optional settings object', () => {
      const withSettings = {
        ...validEventData,
        settings: {
          max_capacity: 100,
          show_capacity_count: true,
        },
      };
      expect(eventFormSchema.safeParse(withSettings).success).toBe(true);

      // Negative capacity should fail
      const withNegativeCapacity = {
        ...validEventData,
        settings: {
          max_capacity: -10,
        },
      };
      expect(eventFormSchema.safeParse(withNegativeCapacity).success).toBe(false);

      // Zero capacity should fail (must be positive)
      const withZeroCapacity = {
        ...validEventData,
        settings: {
          max_capacity: 0,
        },
      };
      expect(eventFormSchema.safeParse(withZeroCapacity).success).toBe(false);
    });

    it('validates password protection fields', () => {
      const withPassword = {
        ...validEventData,
        password_protected: true,
        password: 'secret123',
      };
      expect(eventFormSchema.safeParse(withPassword).success).toBe(true);

      const withoutPassword = {
        ...validEventData,
        password_protected: false,
      };
      expect(eventFormSchema.safeParse(withoutPassword).success).toBe(true);
    });

    it('validates null location', () => {
      const withNullLocation = {
        ...validEventData,
        location: null,
      };
      expect(eventFormSchema.safeParse(withNullLocation).success).toBe(true);
    });
  });

  describe('createEventSchema', () => {
    it('is identical to eventFormSchema', () => {
      expect(createEventSchema).toBe(eventFormSchema);
    });
  });

  describe('updateEventSchema', () => {
    const validUpdateData = {
      id: 'evt_123456',
      title: 'Updated Event',
      description: 'Updated description',
      location: null,
      timezone: 'America/New_York',
      start_date_day: 15,
      start_date_month: 6,
      start_date_year: 2025,
      start_date_hours: 14,
      start_date_minutes: 30,
      end_date_day: 15,
      end_date_month: 6,
      end_date_year: 2025,
      end_date_hours: 18,
      end_date_minutes: 0,
      visibility: 'public' as const,
      status: 'published' as const,
    };

    it('validates valid update data with ID', () => {
      const result = updateEventSchema.safeParse(validUpdateData);
      expect(result.success).toBe(true);
    });

    it('rejects update data without ID', () => {
      const { id, ...dataWithoutId } = validUpdateData;
      const result = updateEventSchema.safeParse(dataWithoutId);
      expect(result.success).toBe(false);
    });

    it('rejects empty ID', () => {
      const invalidData = { ...validUpdateData, id: '' };
      const result = updateEventSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Event ID is required');
      }
    });

    it('does not accept settings field', () => {
      const dataWithSettings = {
        ...validUpdateData,
        settings: {
          max_capacity: 100,
        },
      };
      const result = updateEventSchema.safeParse(dataWithSettings);
      // Settings should be omitted, so the parse should succeed but settings won't be in result
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as any).settings).toBeUndefined();
      }
    });
  });

  describe('eventLocationSchema', () => {
    it('validates complete location data', () => {
      const validData = {
        id: 'loc_123',
        name: 'Test Venue',
        address: '123 Main St',
        city: 'New York',
        state_province: 'NY',
        country: 'United States',
        country_code: 'US',
        postal_code: '10001',
        latitude: '40.7128',
        longitude: '-74.0060',
        location_type: 'venue',
        is_verified: true,
      };

      const result = eventLocationSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        // Check that latitude/longitude are transformed to numbers
        expect(typeof result.data.latitude).toBe('number');
        expect(typeof result.data.longitude).toBe('number');
        expect(result.data.latitude).toBe(40.7128);
        expect(result.data.longitude).toBe(-74.006);
      }
    });

    it('transforms string coordinates to numbers', () => {
      const dataWithStringCoords = {
        id: 'loc_123',
        name: 'Test Venue',
        address: null,
        city: null,
        state_province: null,
        country: null,
        country_code: null,
        postal_code: null,
        latitude: '40.7128',
        longitude: '-74.0060',
        location_type: null,
        is_verified: null,
      };

      const result = eventLocationSchema.safeParse(dataWithStringCoords);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.latitude).toBe(40.7128);
        expect(result.data.longitude).toBe(-74.006);
      }
    });

    it('accepts numeric coordinates', () => {
      const dataWithNumericCoords = {
        id: 'loc_123',
        name: 'Test Venue',
        address: null,
        city: null,
        state_province: null,
        country: null,
        country_code: null,
        postal_code: null,
        latitude: 40.7128,
        longitude: -74.006,
        location_type: null,
        is_verified: null,
      };

      const result = eventLocationSchema.safeParse(dataWithNumericCoords);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.latitude).toBe(40.7128);
        expect(result.data.longitude).toBe(-74.006);
      }
    });

    it('accepts null coordinates', () => {
      const dataWithNullCoords = {
        id: 'loc_123',
        name: 'Test Venue',
        address: null,
        city: null,
        state_province: null,
        country: null,
        country_code: null,
        postal_code: null,
        latitude: null,
        longitude: null,
        location_type: null,
        is_verified: null,
      };

      const result = eventLocationSchema.safeParse(dataWithNullCoords);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.latitude).toBeNull();
        expect(result.data.longitude).toBeNull();
      }
    });
  });

  describe('apiEventSchema', () => {
    const validApiEvent = {
      id: 'evt_123',
      created_at: '2025-01-01T00:00:00Z',
      timezone: 'America/New_York',
      title: 'Test Event',
      description: 'Test description',
      cover: 'https://example.com/cover.jpg',
      location: 'loc_123',
      event_locations: {
        id: 'loc_123',
        name: 'Test Venue',
        address: '123 Main St',
        city: 'New York',
        state_province: 'NY',
        country: 'United States',
        country_code: 'US',
        postal_code: '10001',
        latitude: '40.7128',
        longitude: '-74.0060',
        location_type: 'venue',
        is_verified: true,
      },
      start_date_day: 15,
      start_date_month: 6,
      start_date_year: 2025,
      start_date_hours: 14,
      start_date_minutes: 30,
      end_date_day: 15,
      end_date_month: 6,
      end_date_year: 2025,
      end_date_hours: 18,
      end_date_minutes: 0,
      status: 'published',
      visibility: 'public',
      creator_user_id: 'usr_123',
      user_details: {
        id: 'usr_123',
        username: 'testuser',
        image: 'https://example.com/avatar.jpg',
        verification_status: 'verified',
      },
      spotify_url: 'https://open.spotify.com/playlist/123',
      wavlake_url: null,
      contrib_cashapp: '$testuser',
      contrib_venmo: '@testuser',
      contrib_paypal: null,
      contrib_btclightning: null,
      cost: '10',
      computed_start_date: '2025-06-15T14:30:00-04:00',
      computed_end_date: '2025-06-15T18:00:00-04:00',
      password_protected: false,
      password: null,
    };

    it('validates complete API event response', () => {
      const result = apiEventSchema.safeParse(validApiEvent);
      expect(result.success).toBe(true);
    });

    it('transforms numeric cost to string', () => {
      const eventWithNumericCost = {
        ...validApiEvent,
        cost: 25,
      };

      const result = apiEventSchema.safeParse(eventWithNumericCost);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cost).toBe('25');
        expect(typeof result.data.cost).toBe('string');
      }
    });

    it('accepts null cost', () => {
      const eventWithNullCost = {
        ...validApiEvent,
        cost: null,
      };

      const result = apiEventSchema.safeParse(eventWithNullCost);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cost).toBeNull();
      }
    });

    it('accepts null user_details', () => {
      const eventWithoutUserDetails = {
        ...validApiEvent,
        user_details: null,
      };

      const result = apiEventSchema.safeParse(eventWithoutUserDetails);
      expect(result.success).toBe(true);
    });

    it('accepts null event_locations', () => {
      const eventWithoutLocation = {
        ...validApiEvent,
        event_locations: null,
      };

      const result = apiEventSchema.safeParse(eventWithoutLocation);
      expect(result.success).toBe(true);
    });

    it('accepts undefined event_locations', () => {
      const { event_locations, ...eventWithoutLocation } = validApiEvent;

      const result = apiEventSchema.safeParse(eventWithoutLocation);
      expect(result.success).toBe(true);
    });

    it('rejects missing required fields', () => {
      const { id, ...eventWithoutId } = validApiEvent;

      const result = apiEventSchema.safeParse(eventWithoutId);
      expect(result.success).toBe(false);
    });
  });
});
