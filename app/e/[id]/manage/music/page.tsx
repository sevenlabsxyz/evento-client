'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Music, ExternalLink, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getEventById } from '@/lib/data/sample-events';

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
  
  // Get existing event data
  const existingEvent = getEventById(eventId);
  
  if (!existingEvent) {
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

  // Mock music data (empty for now)
  const [musicData, setMusicData] = useState<EventMusic>({});
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [wavlakeUrl, setWavlakeUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const handleAddSpotify = async () => {
    if (!validateSpotifyUrl(spotifyUrl)) {
      alert('Please enter a valid Spotify URL');
      return;
    }

    setIsLoading(true);
    
    // In a real app, you might fetch track metadata from Spotify API
    const newMusicData = {
      ...musicData,
      spotify: {
        url: spotifyUrl,
        title: 'Track Title', // Would be fetched from API
        artist: 'Artist Name' // Would be fetched from API
      }
    };
    
    setMusicData(newMusicData);
    setSpotifyUrl('');
    setIsLoading(false);
    
    console.log('Added Spotify track:', newMusicData.spotify);
  };

  const handleAddWavlake = async () => {
    if (!validateWavlakeUrl(wavlakeUrl)) {
      alert('Please enter a valid Wavlake URL');
      return;
    }

    setIsLoading(true);
    
    // In a real app, you might fetch track metadata from Wavlake API
    const newMusicData = {
      ...musicData,
      wavlake: {
        url: wavlakeUrl,
        title: 'Track Title', // Would be fetched from API
        artist: 'Artist Name' // Would be fetched from API
      }
    };
    
    setMusicData(newMusicData);
    setWavlakeUrl('');
    setIsLoading(false);
    
    console.log('Added Wavlake track:', newMusicData.wavlake);
  };

  const handleRemoveSpotify = () => {
    const newMusicData = { ...musicData };
    delete newMusicData.spotify;
    setMusicData(newMusicData);
  };

  const handleRemoveWavlake = () => {
    const newMusicData = { ...musicData };
    delete newMusicData.wavlake;
    setMusicData(newMusicData);
  };

  const handleSave = () => {
    console.log('Saving music data:', musicData);
    // In a real app, save to backend
    router.back();
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
          className="px-6 py-2 bg-black hover:bg-gray-800 text-white rounded-full font-medium"
        >
          Save
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        <div className="text-sm text-gray-500">
          Add music tracks to your event that guests can discover and listen to.
        </div>

        {/* Spotify Section */}
        <div className="bg-green-50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Spotify</h3>
              <p className="text-sm text-gray-600">Add a Spotify track or playlist</p>
            </div>
          </div>

          {musicData.spotify ? (
            <div className="bg-white rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{musicData.spotify.title}</h4>
                  <p className="text-sm text-gray-500">{musicData.spotify.artist}</p>
                  <a
                    href={musicData.spotify.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1 mt-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open in Spotify
                  </a>
                </div>
                <button
                  onClick={handleRemoveSpotify}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <Button
                onClick={handleAddSpotify}
                disabled={!spotifyUrl || isLoading}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl"
              >
                {isLoading ? 'Adding...' : 'Add Spotify Track'}
              </Button>
            </div>
          )}
        </div>

        {/* Wavlake Section */}
        <div className="bg-purple-50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Wavlake</h3>
              <p className="text-sm text-gray-600">Add a Wavlake track</p>
            </div>
          </div>

          {musicData.wavlake ? (
            <div className="bg-white rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{musicData.wavlake.title}</h4>
                  <p className="text-sm text-gray-500">{musicData.wavlake.artist}</p>
                  <a
                    href={musicData.wavlake.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1 mt-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open in Wavlake
                  </a>
                </div>
                <button
                  onClick={handleRemoveWavlake}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <Button
                onClick={handleAddWavlake}
                disabled={!wavlakeUrl || isLoading}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-xl"
              >
                {isLoading ? 'Adding...' : 'Add Wavlake Track'}
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