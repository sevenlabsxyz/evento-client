'use client';

import { SpotifySVGImage } from '@/components/icons/spotify';
import { WavlakeSVGImage } from '@/components/icons/wavlake';
import { Skeleton } from '@/components/ui/skeleton';
import { useEventDetails } from '@/lib/hooks/use-event-details';
import { useUpdateEvent } from '@/lib/hooks/use-update-event';
import type { UpdateEventData } from '@/lib/schemas/event';
import { useTopBar } from '@/lib/stores/topbar-store';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import { Check, Trash2 } from 'lucide-react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

interface EventMusic {
  spotify?: {
    url: string;
    title?: string;
    artist?: string;
  };
  wavlake?: {
    url: string;
    title?: string;
    artist?: string;
  };
}

export default function MusicManagementPage() {
  const { setTopBarForRoute, applyRouteConfig, clearRoute } = useTopBar();
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const eventId = params.id as string;

  // Get existing event data from API
  const { data: existingEvent, isLoading, error } = useEventDetails(eventId);
  const updateEventMutation = useUpdateEvent();

  // Initialize with existing event data - must be before any conditional returns
  const [musicData, setMusicData] = useState<EventMusic>({});
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [wavlakeUrl, setWavlakeUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const musicDataRef = useRef(musicData);
  const existingEventRef = useRef(existingEvent);
  const updateEventMutationRef = useRef(updateEventMutation);

  useEffect(() => {
    musicDataRef.current = musicData;
  }, [musicData]);

  useEffect(() => {
    existingEventRef.current = existingEvent;
  }, [existingEvent]);

  useEffect(() => {
    updateEventMutationRef.current = updateEventMutation;
  }, [updateEventMutation]);

  // Update musicData when existingEvent loads
  useEffect(() => {
    if (existingEvent) {
      setMusicData({
        spotify: existingEvent.spotify_url ? { url: existingEvent.spotify_url } : undefined,
        wavlake: existingEvent.wavlake_url ? { url: existingEvent.wavlake_url } : undefined,
      });
    }
  }, [existingEvent]);

  const validateSpotifyUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return (
        urlObj.hostname === 'spotify.com' ||
        urlObj.hostname === 'open.spotify.com' ||
        urlObj.hostname === 'www.spotify.com'
      );
    } catch {
      return false;
    }
  };

  const validateWavlakeUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === 'wavlake.com' || urlObj.hostname === 'www.wavlake.com';
    } catch {
      return false;
    }
  };

  const handleAddSpotify = () => {
    if (!validateSpotifyUrl(spotifyUrl)) {
      toast.error('Please enter a valid Spotify URL');
      return;
    }

    const newMusicData = {
      ...musicData,
      spotify: {
        url: spotifyUrl,
        title: 'Spotify Track', // Could be enhanced to fetch from API
        artist: 'Unknown Artist', // Could be enhanced to fetch from API
      },
    };

    setMusicData(newMusicData);
    setSpotifyUrl('');
    toast.success('Spotify track added! Click Save to update the event.');
  };

  const handleAddWavlake = () => {
    if (!validateWavlakeUrl(wavlakeUrl)) {
      toast.error('Please enter a valid Wavlake URL');
      return;
    }

    const newMusicData = {
      ...musicData,
      wavlake: {
        url: wavlakeUrl,
        title: 'Wavlake Track', // Could be enhanced to fetch from API
        artist: 'Unknown Artist', // Could be enhanced to fetch from API
      },
    };

    setMusicData(newMusicData);
    setWavlakeUrl('');
    toast.success('Wavlake track added! Click Save to update the event.');
  };

  const handleRemoveSpotify = () => {
    const newMusicData = { ...musicData };
    delete newMusicData.spotify;
    setMusicData(newMusicData);
    toast.success('Spotify track removed! Click Save to update the event.');
  };

  const handleRemoveWavlake = () => {
    const newMusicData = { ...musicData };
    delete newMusicData.wavlake;
    setMusicData(newMusicData);
    toast.success('Wavlake track removed! Click Save to update the event.');
  };

  const handleSave = useCallback(async () => {
    const currentEvent = existingEventRef.current;
    const currentMusicData = musicDataRef.current;

    if (!currentEvent) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Prepare update data
      const updateData: UpdateEventData = {
        id: eventId,
        spotify_url: currentMusicData.spotify?.url || '',
        wavlake_url: currentMusicData.wavlake?.url || '',
        // Include other required fields from existing event
        title: currentEvent.title,
        description: currentEvent.description,
        location: currentEvent.location
          ? { type: 'manual_entry' as const, data: { name: currentEvent.location } }
          : null,
        timezone: currentEvent.timezone,
        start_date_day: currentEvent.start_date_day,
        start_date_month: currentEvent.start_date_month,
        start_date_year: currentEvent.start_date_year,
        start_date_hours: currentEvent.start_date_hours,
        start_date_minutes: currentEvent.start_date_minutes,
        end_date_day: currentEvent.end_date_day,
        end_date_month: currentEvent.end_date_month,
        end_date_year: currentEvent.end_date_year,
        end_date_hours: currentEvent.end_date_hours,
        end_date_minutes: currentEvent.end_date_minutes,
        visibility: currentEvent.visibility,
        status: (currentEvent.status === 'draft'
          ? 'draft'
          : 'published') as UpdateEventData['status'],
      };

      await updateEventMutationRef.current.mutateAsync(updateData, {
        onSuccess: () => {
          toast.success('Music settings updated successfully!');
          router.push(`/e/${eventId}/manage`);
        },
        onError: () => {
          toast.error('Failed to update music settings');
        },
      });
    } catch (error) {
      logger.error('Failed to save music settings', {
        error: error instanceof Error ? error.message : String(error),
      });
      toast.error('Failed to update music settings');
    } finally {
      setIsSubmitting(false);
    }
  }, [eventId, router]);

  // Configure TopBar
  useEffect(() => {
    applyRouteConfig(pathname);
    setTopBarForRoute(pathname, {
      title: 'Music',
      leftMode: 'back',
      centerMode: 'title',
      showAvatar: false,
      buttons: [
        {
          id: 'save-music',
          icon: Check,
          onClick: () => void handleSave(),
          label: 'Save',
          disabled: isSubmitting,
        },
      ],
    });

    return () => {
      clearRoute(pathname);
    };
  }, [pathname, setTopBarForRoute, applyRouteConfig, clearRoute, isSubmitting, handleSave]);

  if (isLoading) {
    return (
      <div className='mx-auto min-h-screen max-w-full bg-white md:max-w-sm'>
        <div className='space-y-6 p-4'>
          <Skeleton className='h-4 w-3/4' />

          {/* Spotify Section Skeleton */}
          <div className='rounded-2xl bg-gray-50 p-6'>
            <div className='mb-4 flex items-center gap-3'>
              <Skeleton className='h-12 w-12 rounded-xl' />
              <div className='space-y-2'>
                <Skeleton className='h-5 w-16' />
                <Skeleton className='h-4 w-32' />
              </div>
            </div>
            <div className='space-y-3'>
              <Skeleton className='h-12 w-full rounded-xl' />
              <Skeleton className='h-12 w-full rounded-xl' />
            </div>
          </div>

          {/* Wavlake Section Skeleton */}
          <div className='rounded-2xl bg-gray-50 p-6'>
            <div className='mb-4 flex items-center gap-3'>
              <Skeleton className='h-12 w-12 rounded-xl' />
              <div className='space-y-2'>
                <Skeleton className='h-5 w-16' />
                <Skeleton className='h-4 w-28' />
              </div>
            </div>
            <div className='space-y-3'>
              <Skeleton className='h-12 w-full rounded-xl' />
              <Skeleton className='h-12 w-full rounded-xl' />
            </div>
          </div>

          {/* Information Section Skeleton */}
          <div className='rounded-2xl bg-blue-50 p-4'>
            <Skeleton className='mb-2 h-5 w-40' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='mt-1 h-4 w-2/3' />
          </div>
        </div>
      </div>
    );
  }

  if (error || !existingEvent) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <h1 className='mb-2 text-2xl font-bold text-gray-900'>Event Not Found</h1>
          <p className='mb-4 text-gray-600'>The event you're trying to manage doesn't exist.</p>
          <button
            onClick={() => router.back()}
            className='rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600'
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto min-h-screen max-w-full bg-white md:max-w-sm'>
      {/* Content */}
      <div className='space-y-6 p-4'>
        <div className='text-sm text-gray-500'>
          Add music tracks to your event that guests can discover and listen to.
        </div>

        {/* Spotify Section */}
        <div className='rounded-2xl bg-gray-50 p-6'>
          <div className='mb-4 flex items-center gap-3'>
            <div className='flex h-12 w-12 items-center justify-center rounded-xl'>
              <SpotifySVGImage className='h-8 w-8' />
            </div>
            <div>
              <h3 className='font-semibold text-gray-900'>Spotify</h3>
              <p className='text-sm text-gray-600'>Add a Spotify track or playlist</p>
            </div>
          </div>

          {musicData.spotify ? (
            <div className='space-y-3'>
              <div className='flex gap-2'>
                <input
                  type='url'
                  value={musicData.spotify.url}
                  disabled
                  className='w-full rounded-xl border border-gray-300 bg-gray-50 p-3 text-gray-700'
                />
                <button
                  onClick={handleRemoveSpotify}
                  className='rounded-xl border border-gray-300 p-3 text-red-600 hover:bg-red-50'
                >
                  <Trash2 className='h-4 w-4' />
                </button>
              </div>
            </div>
          ) : (
            <div className='space-y-3'>
              <input
                type='url'
                value={spotifyUrl}
                onChange={(e) => setSpotifyUrl(e.target.value)}
                placeholder='https://open.spotify.com/track/...'
                className='w-full rounded-xl border border-gray-300 p-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-500'
              />
              <button
                onClick={handleAddSpotify}
                disabled={!spotifyUrl}
                className='w-full rounded-xl bg-gray-900 py-3 text-white hover:bg-gray-800'
              >
                Add Spotify Track
              </button>
            </div>
          )}
        </div>

        {/* Wavlake Section */}
        <div className='rounded-2xl bg-gray-50 p-6'>
          <div className='mb-4 flex items-center gap-3'>
            <div className='flex h-12 w-12 items-center justify-center rounded-xl'>
              <WavlakeSVGImage className='h-7 w-10' />
            </div>
            <div>
              <h3 className='font-semibold text-gray-900'>Wavlake</h3>
              <p className='text-sm text-gray-600'>Add a Wavlake track</p>
            </div>
          </div>

          {musicData.wavlake ? (
            <div className='space-y-3'>
              <div className='flex gap-2'>
                <input
                  type='url'
                  value={musicData.wavlake.url}
                  disabled
                  className='w-full rounded-xl border border-gray-300 bg-gray-50 p-3 text-gray-700'
                />
                <button
                  onClick={handleRemoveWavlake}
                  className='rounded-xl border border-gray-300 p-3 text-red-600 hover:bg-red-50'
                >
                  <Trash2 className='h-4 w-4' />
                </button>
              </div>
            </div>
          ) : (
            <div className='space-y-3'>
              <input
                type='url'
                value={wavlakeUrl}
                onChange={(e) => setWavlakeUrl(e.target.value)}
                placeholder='https://wavlake.com/track/...'
                className='w-full rounded-xl border border-gray-300 p-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-500'
              />
              <button
                onClick={handleAddWavlake}
                disabled={!wavlakeUrl}
                className='w-full rounded-xl bg-gray-900 py-3 text-white hover:bg-gray-800'
              >
                Add Wavlake Track
              </button>
            </div>
          )}
        </div>

        {/* Information Section */}
        <div className='rounded-2xl bg-blue-50 p-4'>
          <h4 className='mb-2 font-medium text-blue-900'>About Music Integration</h4>
          <p className='text-sm text-blue-700'>
            Music tracks you add here will be displayed on your event page, allowing guests to
            discover and listen to music related to your event.
          </p>
        </div>
      </div>
    </div>
  );
}
