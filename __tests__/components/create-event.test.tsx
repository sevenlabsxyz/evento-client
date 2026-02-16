import { useEventFormStore } from '@/lib/stores/event-form-store';
import { act, renderHook } from '@testing-library/react';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/e/create',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

describe('Event Creation Form Validation', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useEventFormStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('form validation', () => {
    it('requires a title for form to be valid', () => {
      const { result } = renderHook(() => useEventFormStore());

      expect(result.current.isValid()).toBe(false);

      act(() => {
        result.current.setTitle('Test Event');
      });

      expect(result.current.isValid()).toBe(true);
    });

    it('trims whitespace-only titles as invalid', () => {
      const { result } = renderHook(() => useEventFormStore());

      act(() => {
        result.current.setTitle('   ');
      });

      expect(result.current.isValid()).toBe(false);
    });

    it('accepts titles with valid characters', () => {
      const { result } = renderHook(() => useEventFormStore());

      act(() => {
        result.current.setTitle('My Awesome Event 2024!');
      });

      expect(result.current.isValid()).toBe(true);
      expect(result.current.title).toBe('My Awesome Event 2024!');
    });
  });

  describe('form state management', () => {
    it('initializes with default values', () => {
      const { result } = renderHook(() => useEventFormStore());

      expect(result.current.title).toBe('');
      expect(result.current.description).toBe('<p></p>');
      expect(result.current.visibility).toBe('private');
      expect(result.current.hasCapacity).toBe(false);
    });

    it('sets and clears cover image', () => {
      const { result } = renderHook(() => useEventFormStore());

      act(() => {
        result.current.setCoverImage('https://example.com/image.jpg');
      });

      expect(result.current.coverImage).toBe('https://example.com/image.jpg');

      act(() => {
        result.current.setCoverImage('');
      });

      expect(result.current.coverImage).toBe('');
    });

    it('sets location data', () => {
      const { result } = renderHook(() => useEventFormStore());
      const locationData = {
        name: 'Central Park',
        address: '59th St to 110th St',
        city: 'New York',
        country: 'USA',
        formatted: 'Central Park, New York, USA',
      };

      act(() => {
        result.current.setLocation(locationData);
      });

      expect(result.current.location).toEqual(locationData);
    });

    it('clears location when set to null', () => {
      const { result } = renderHook(() => useEventFormStore());

      act(() => {
        result.current.setLocation({
          name: 'Test Location',
          address: '123 Main St',
          city: 'Test City',
          country: 'Test Country',
          formatted: 'Test Location, Test City',
        });
      });

      expect(result.current.location).not.toBeNull();

      act(() => {
        result.current.setLocation(null);
      });

      expect(result.current.location).toBeNull();
    });
  });

  describe('visibility settings', () => {
    it('defaults to private visibility', () => {
      const { result } = renderHook(() => useEventFormStore());

      expect(result.current.visibility).toBe('private');
    });

    it('allows changing to public visibility', () => {
      const { result } = renderHook(() => useEventFormStore());

      act(() => {
        result.current.setVisibility('public');
      });

      expect(result.current.visibility).toBe('public');
    });

    it('allows changing back to private visibility', () => {
      const { result } = renderHook(() => useEventFormStore());

      act(() => {
        result.current.setVisibility('public');
      });

      act(() => {
        result.current.setVisibility('private');
      });

      expect(result.current.visibility).toBe('private');
    });
  });

  describe('capacity settings', () => {
    it('capacity is disabled by default', () => {
      const { result } = renderHook(() => useEventFormStore());

      expect(result.current.hasCapacity).toBe(false);
      expect(result.current.capacity).toBe('');
      expect(result.current.showCapacityCount).toBe(false);
    });

    it('enables capacity with a value', () => {
      const { result } = renderHook(() => useEventFormStore());

      act(() => {
        result.current.setHasCapacity(true);
        result.current.setCapacity('100');
        result.current.setShowCapacityCount(true);
      });

      expect(result.current.hasCapacity).toBe(true);
      expect(result.current.capacity).toBe('100');
      expect(result.current.showCapacityCount).toBe(true);
    });

    it('disables capacity', () => {
      const { result } = renderHook(() => useEventFormStore());

      act(() => {
        result.current.setHasCapacity(true);
        result.current.setCapacity('50');
      });

      act(() => {
        result.current.setHasCapacity(false);
      });

      expect(result.current.hasCapacity).toBe(false);
    });
  });

  describe('date and time handling', () => {
    it('adjusts end date when start date is after end date', () => {
      const { result } = renderHook(() => useEventFormStore());

      const futureDate = new Date('2025-12-31');

      act(() => {
        result.current.setStartDate(futureDate);
      });

      expect(result.current.startDate.getTime()).toBeLessThanOrEqual(
        result.current.endDate.getTime()
      );
    });

    it('sets timezone', () => {
      const { result } = renderHook(() => useEventFormStore());

      act(() => {
        result.current.setTimezone('America/New_York');
      });

      expect(result.current.timezone).toBe('America/New_York');
    });
  });

  describe('description handling', () => {
    it('sets description content', () => {
      const { result } = renderHook(() => useEventFormStore());

      act(() => {
        result.current.setDescription('<p>This is a test event description.</p>');
      });

      expect(result.current.description).toBe('<p>This is a test event description.</p>');
    });

    it('allows empty description', () => {
      const { result } = renderHook(() => useEventFormStore());

      act(() => {
        result.current.setDescription('');
      });

      expect(result.current.description).toBe('');
    });
  });

  describe('attachment handling', () => {
    it('sets Spotify URL', () => {
      const { result } = renderHook(() => useEventFormStore());

      act(() => {
        result.current.setSpotifyUrl('https://open.spotify.com/track/123');
      });

      expect(result.current.spotifyUrl).toBe('https://open.spotify.com/track/123');
    });

    it('sets Wavlake URL', () => {
      const { result } = renderHook(() => useEventFormStore());

      act(() => {
        result.current.setWavlakeUrl('https://wavlake.com/track/456');
      });

      expect(result.current.wavlakeUrl).toBe('https://wavlake.com/track/456');
    });

    it('clears attachment URLs', () => {
      const { result } = renderHook(() => useEventFormStore());

      act(() => {
        result.current.setSpotifyUrl('https://open.spotify.com/track/123');
        result.current.setWavlakeUrl('https://wavlake.com/track/456');
      });

      act(() => {
        result.current.setSpotifyUrl('');
        result.current.setWavlakeUrl('');
      });

      expect(result.current.spotifyUrl).toBe('');
      expect(result.current.wavlakeUrl).toBe('');
    });
  });

  describe('emoji handling', () => {
    it('sets emoji for event title', () => {
      const { result } = renderHook(() => useEventFormStore());

      act(() => {
        result.current.setEmoji('🎉');
      });

      expect(result.current.emoji).toBe('🎉');
    });

    it('clears emoji', () => {
      const { result } = renderHook(() => useEventFormStore());

      act(() => {
        result.current.setEmoji('🎉');
      });

      act(() => {
        result.current.setEmoji(null);
      });

      expect(result.current.emoji).toBeNull();
    });
  });

  describe('form reset', () => {
    it('resets all form fields to defaults', () => {
      const { result } = renderHook(() => useEventFormStore());

      act(() => {
        result.current.setTitle('Test Event');
        result.current.setDescription('<p>Test description</p>');
        result.current.setVisibility('public');
        result.current.setHasCapacity(true);
        result.current.setCapacity('100');
        result.current.setShowCapacityCount(true);
        result.current.setEmoji('🎉');
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.title).toBe('');
      expect(result.current.description).toBe('<p></p>');
      expect(result.current.visibility).toBe('private');
      expect(result.current.hasCapacity).toBe(false);
      expect(result.current.capacity).toBe('');
      expect(result.current.showCapacityCount).toBe(false);
      expect(result.current.emoji).toBeNull();
    });
  });

  describe('getFormData output', () => {
    it('generates correct form data for API submission', () => {
      const { result } = renderHook(() => useEventFormStore());

      act(() => {
        result.current.setTitle('Test Event');
        result.current.setDescription('<p>Event description</p>');
        result.current.setVisibility('public');
        result.current.setEmoji('🎉');
      });

      const formData = result.current.getFormData();

      expect(formData.title).toBe('🎉 Test Event');
      expect(formData.description).toBe('<p>Event description</p>');
      expect(formData.visibility).toBe('public');
      expect(formData.status).toBe('published');
    });

    it('includes capacity settings when enabled', () => {
      const { result } = renderHook(() => useEventFormStore());

      act(() => {
        result.current.setTitle('Test Event');
        result.current.setHasCapacity(true);
        result.current.setCapacity('50');
        result.current.setShowCapacityCount(true);
      });

      const formData = result.current.getFormData();

      expect(formData.settings).toBeDefined();
      expect(formData.settings?.max_capacity).toBe(50);
      expect(formData.settings?.show_capacity_count).toBe(true);
    });

    it('omits capacity settings when disabled', () => {
      const { result } = renderHook(() => useEventFormStore());

      act(() => {
        result.current.setTitle('Test Event');
        result.current.setHasCapacity(false);
      });

      const formData = result.current.getFormData();

      expect(formData.settings).toBeUndefined();
    });
  });

  describe('change detection', () => {
    it('detects no changes when form is unchanged', () => {
      const { result } = renderHook(() => useEventFormStore());

      act(() => {
        result.current.setTitle('Original Title');
        result.current.setInitialData(result.current.getFormData());
      });

      expect(result.current.hasChanges()).toBe(false);
    });

    it('detects changes when title is modified', () => {
      const { result } = renderHook(() => useEventFormStore());

      act(() => {
        result.current.setTitle('Original Title');
        result.current.setInitialData(result.current.getFormData());
      });

      act(() => {
        result.current.setTitle('Modified Title');
      });

      expect(result.current.hasChanges()).toBe(true);
    });
  });
});
