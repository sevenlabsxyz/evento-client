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
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('manageLegacy');
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
      toast.error(t('music.toasts.invalidSpotify'));
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
    toast.success(t('music.toasts.spotifyAdded'));
  };

  const handleAddWavlake = () => {
    if (!validateWavlakeUrl(wavlakeUrl)) {
      toast.error(t('music.toasts.invalidWavlake'));
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
    toast.success(t('music.toasts.wavlakeAdded'));
  };

  const handleRemoveSpotify = () => {
    const newMusicData = { ...musicData };
    delete newMusicData.spotify;
    setMusicData(newMusicData);
    toast.success(t('music.toasts.spotifyRemoved'));
  };

  const handleRemoveWavlake = () => {
    const newMusicData = { ...musicData };
    delete newMusicData.wavlake;
    setMusicData(newMusicData);
    toast.success(t('music.toasts.wavlakeRemoved'));
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
          toast.success(t('music.toasts.updated'));
          router.push(`/e/${eventId}/manage`);
        },
        onError: () => {
          toast.error(t('music.toasts.updateFailed'));
        },
      });
    } catch (error) {
      logger.error('Failed to save music settings', {
        error: error instanceof Error ? error.message : String(error),
      });
      toast.error(t('music.toasts.updateFailed'));
    } finally {
      setIsSubmitting(false);
    }
  }, [eventId, router, t]);

  // Configure TopBar
  useEffect(() => {
    applyRouteConfig(pathname);
    setTopBarForRoute(pathname, {
      title: t('music.title'),
      leftMode: 'back',
      centerMode: 'title',
      onBackPress: () => router.push(`/e/${eventId}/manage`),
      showAvatar: false,
      buttons: [
        {
          id: 'save-music',
          icon: Check,
          onClick: () => void handleSave(),
          label: t('music.save'),
          disabled: isSubmitting,
        },
      ],
    });

    return () => {
      clearRoute(pathname);
    };
  }, [
    pathname,
    setTopBarForRoute,
    applyRouteConfig,
    clearRoute,
    isSubmitting,
    handleSave,
    router,
    eventId,
    t,
  ]);

  if (isLoading) {
    return (
      <div className='space-y-4 py-4 md:py-6'>
        <div className='max-w-2xl space-y-4'>
          <Skeleton className='h-4 w-3/4' />

          {/* Spotify Section Skeleton */}
          <div className='rounded-2xl border border-gray-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900'>
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
          <div className='rounded-2xl border border-gray-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900'>
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
          <div className='rounded-2xl bg-blue-50 p-4 dark:bg-blue-950/40'>
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
      <div className='flex items-center justify-center py-16'>
        <div className='text-center'>
          <h2 className='mb-2 text-2xl font-bold text-gray-900 dark:text-neutral-100'>
            {t('music.notFound.title')}
          </h2>
          <p className='mb-4 text-gray-600 dark:text-neutral-400'>
            {t('music.notFound.description')}
          </p>
          <button
            onClick={() => router.back()}
            className='rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
          >
            {t('music.notFound.goBack')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4 py-4 md:py-6'>
      <div>
        <h2 className='text-lg font-semibold text-gray-900 dark:text-neutral-100'>
          {t('music.title')}
        </h2>
        <p className='text-sm text-gray-500 dark:text-neutral-400'>{t('music.subtitle')}</p>
      </div>

      <div className='max-w-2xl space-y-4'>
        {/* Spotify Section */}
        <div className='rounded-2xl border border-gray-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900'>
          <div className='mb-4 flex items-center gap-3'>
            <div className='flex h-12 w-12 items-center justify-center rounded-xl'>
              <SpotifySVGImage className='h-8 w-8' />
            </div>
            <div>
              <h3 className='font-semibold text-gray-900 dark:text-neutral-100'>Spotify</h3>
              <p className='text-sm text-gray-600 dark:text-neutral-400'>
                {t('music.spotify.description')}
              </p>
            </div>
          </div>

          {musicData.spotify ? (
            <div className='space-y-3'>
              <div className='flex gap-2'>
                <input
                  type='url'
                  value={musicData.spotify.url}
                  disabled
                  className='w-full rounded-xl border border-gray-300 bg-gray-50 p-3 text-gray-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300'
                />
                <button
                  onClick={handleRemoveSpotify}
                  className='rounded-xl border border-gray-300 p-3 text-red-600 hover:bg-red-50 dark:border-neutral-700 dark:text-red-400 dark:hover:bg-red-950/40'
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
                className='w-full rounded-xl border border-gray-300 p-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder-neutral-500 dark:focus:ring-neutral-400'
              />
              <button
                onClick={handleAddSpotify}
                disabled={!spotifyUrl}
                className='w-full rounded-xl bg-gray-900 py-3 text-white hover:bg-gray-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-500'
              >
                {t('music.spotify.add')}
              </button>
            </div>
          )}
        </div>

        {/* Wavlake Section */}
        <div className='rounded-2xl border border-gray-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900'>
          <div className='mb-4 flex items-center gap-3'>
            <div className='flex h-12 w-12 items-center justify-center rounded-xl'>
              <WavlakeSVGImage className='h-7 w-10 dark:fill-white' />
            </div>
            <div>
              <h3 className='font-semibold text-gray-900 dark:text-neutral-100'>Wavlake</h3>
              <p className='text-sm text-gray-600 dark:text-neutral-400'>
                {t('music.wavlake.description')}
              </p>
            </div>
          </div>

          {musicData.wavlake ? (
            <div className='space-y-3'>
              <div className='flex gap-2'>
                <input
                  type='url'
                  value={musicData.wavlake.url}
                  disabled
                  className='w-full rounded-xl border border-gray-300 bg-gray-50 p-3 text-gray-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300'
                />
                <button
                  onClick={handleRemoveWavlake}
                  className='rounded-xl border border-gray-300 p-3 text-red-600 hover:bg-red-50 dark:border-neutral-700 dark:text-red-400 dark:hover:bg-red-950/40'
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
                className='w-full rounded-xl border border-gray-300 p-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder-neutral-500 dark:focus:ring-neutral-400'
              />
              <button
                onClick={handleAddWavlake}
                disabled={!wavlakeUrl}
                className='w-full rounded-xl bg-gray-900 py-3 text-white hover:bg-gray-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-500'
              >
                {t('music.wavlake.add')}
              </button>
            </div>
          )}
        </div>

        {/* Information Section */}
        <div className='rounded-2xl bg-blue-50 p-4 dark:bg-blue-950/40'>
          <h4 className='mb-2 font-medium text-blue-900 dark:text-blue-400'>
            {t('music.info.title')}
          </h4>
          <p className='text-sm text-blue-700 dark:text-blue-300'>{t('music.info.description')}</p>
        </div>
      </div>
    </div>
  );
}
