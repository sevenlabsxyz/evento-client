'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Music, ExternalLink, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEventDetails } from '@/lib/hooks/useEventDetails';
import { useUpdateEvent } from '@/lib/hooks/useUpdateEvent';
import { SpotifySVGImage } from '@/components/icons/spotify';
import { WavlakeSVGImage } from '@/components/icons/wavlake';
import { toast } from '@/lib/utils/toast';

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
  const params = useParams();
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
  
  // Update musicData when existingEvent loads
  React.useEffect(() => {
    if (existingEvent) {
      setMusicData({
        spotify: existingEvent.spotify_url ? { url: existingEvent.spotify_url } : undefined,
        wavlake: existingEvent.wavlake_url ? { url: existingEvent.wavlake_url } : undefined,
      });
    }
  }, [existingEvent]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }
  
  if (error || !existingEvent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
          <p className="text-gray-600 mb-4">The event you're trying to manage doesn't exist.</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const validateSpotifyUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === 'spotify.com' || 
             urlObj.hostname === 'open.spotify.com' ||
             urlObj.hostname === 'www.spotify.com';
    } catch {
      return false;
    }
  };

  const validateWavlakeUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === 'wavlake.com' || 
             urlObj.hostname === 'www.wavlake.com';
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
        artist: 'Unknown Artist' // Could be enhanced to fetch from API
      }
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
        artist: 'Unknown Artist' // Could be enhanced to fetch from API
      }
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

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      
      // Prepare update data
      const updateData = {
        id: eventId,
        spotify_url: musicData.spotify?.url || '',
        wavlake_url: musicData.wavlake?.url || '',
        // Include other required fields from existing event
        title: existingEvent.title,
        description: existingEvent.description,
        location: existingEvent.location,
        timezone: existingEvent.timezone,
        start_date_day: existingEvent.start_date_day,
        start_date_month: existingEvent.start_date_month,
        start_date_year: existingEvent.start_date_year,
        start_date_hours: existingEvent.start_date_hours,
        start_date_minutes: existingEvent.start_date_minutes,
        end_date_day: existingEvent.end_date_day,
        end_date_month: existingEvent.end_date_month,
        end_date_year: existingEvent.end_date_year,
        end_date_hours: existingEvent.end_date_hours,
        end_date_minutes: existingEvent.end_date_minutes,
        visibility: existingEvent.visibility,
        status: existingEvent.status,
      };

      await updateEventMutation.mutateAsync(updateData);
      toast.success('Music settings updated successfully!');
      router.back();
    } catch (error) {
      console.error('Failed to save music settings:', error);
      toast.error('Failed to update music settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="md:max-w-sm max-w-full mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold">Music</h1>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSubmitting}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        <div className="text-sm text-gray-500">
          Add music tracks to your event that guests can discover and listen to.
        </div>

        {/* Spotify Section */}
        <div className="bg-gray-50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center">
              <SpotifySVGImage className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Spotify</h3>
              <p className="text-sm text-gray-600">Add a Spotify track or playlist</p>
            </div>
          </div>

          {musicData.spotify ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={musicData.spotify.url}
                  disabled
                  className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-700"
                />
                <button
                  onClick={handleRemoveSpotify}
                  className="p-3 text-red-600 hover:bg-red-50 rounded-xl border border-gray-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="url"
                value={spotifyUrl}
                onChange={(e) => setSpotifyUrl(e.target.value)}
                placeholder="https://open.spotify.com/track/..."
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
              <Button
                onClick={handleAddSpotify}
                disabled={!spotifyUrl}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-xl"
              >
                Add Spotify Track
              </Button>
            </div>
          )}
        </div>

        {/* Wavlake Section */}
        <div className="bg-gray-50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center">
              <WavlakeSVGImage className="w-10 h-7" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Wavlake</h3>
              <p className="text-sm text-gray-600">Add a Wavlake track</p>
            </div>
          </div>

          {musicData.wavlake ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={musicData.wavlake.url}
                  disabled
                  className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-700"
                />
                <button
                  onClick={handleRemoveWavlake}
                  className="p-3 text-red-600 hover:bg-red-50 rounded-xl border border-gray-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="url"
                value={wavlakeUrl}
                onChange={(e) => setWavlakeUrl(e.target.value)}
                placeholder="https://wavlake.com/track/..."
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
              <Button
                onClick={handleAddWavlake}
                disabled={!wavlakeUrl}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-xl"
              >
                Add Wavlake Track
              </Button>
            </div>
          )}
        </div>

        {/* Information Section */}
        <div className="p-4 bg-blue-50 rounded-2xl">
          <h4 className="font-medium text-blue-900 mb-2">About Music Integration</h4>
          <p className="text-sm text-blue-700">
            Music tracks you add here will be displayed on your event page, allowing guests 
            to discover and listen to music related to your event.
          </p>
        </div>
      </div>
    </div>
  );
}