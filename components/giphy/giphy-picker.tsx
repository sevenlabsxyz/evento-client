'use client';

import { Input } from '@/components/ui/input';
import { Env } from '@/lib/constants/env';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { IGif } from '@giphy/js-types';
import { Loader2, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const gf = new GiphyFetch(Env.NEXT_PUBLIC_GIPHY_API_KEY);

interface GiphyPickerProps {
  onGifSelect: (gifUrl: string) => void;
}

export default function GiphyPicker({ onGifSelect }: GiphyPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState<IGif[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGif, setSelectedGif] = useState<IGif | null>(null);

  const fetchTrendingGifs = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await gf.trending({
        limit: 20,
        rating: 'g',
        type: 'gifs',
      });
      setGifs(data);
    } catch (error) {
      console.error('Error fetching trending GIFs:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchGifs = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        fetchTrendingGifs();
        return;
      }

      try {
        setIsLoading(true);
        const { data } = await gf.search(query, {
          limit: 20,
          rating: 'g',
          type: 'gifs',
        });
        setGifs(data);
      } catch (error) {
        console.error('Error searching GIFs:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [fetchTrendingGifs]
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchGifs(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, searchGifs]);

  // Load trending GIFs on mount
  useEffect(() => {
    fetchTrendingGifs();
  }, [fetchTrendingGifs]);

  const handleGifClick = (gif: IGif) => {
    setSelectedGif(gif);
    // Use the original URL for better quality
    const gifUrl = gif.images.original.url;
    onGifSelect(gifUrl);
  };

  return (
    <div className='flex h-full w-full flex-col'>
      {/* Search bar */}
      <div className='relative mb-4 mt-2'>
        <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
        <Input
          type='text'
          placeholder='Search GIFs...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className='w-full bg-gray-100 pl-10'
        />
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className='flex flex-1 items-center justify-center'>
          <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
        </div>
      )}

      {/* GIF Grid */}
      {!isLoading && gifs.length > 0 && (
        <div className='grid flex-1 grid-cols-2 gap-2 overflow-y-auto pb-4 md:grid-cols-3 lg:grid-cols-4'>
          {gifs.map((gif) => (
            <div
              key={gif.id}
              className={`aspect-square cursor-pointer overflow-hidden rounded-lg transition-all duration-200 ${
                selectedGif?.id === gif.id ? 'ring-2 ring-primary ring-offset-2' : ''
              }`}
              onClick={() => handleGifClick(gif)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={gif.images.fixed_width.webp}
                alt={gif.title || 'GIF'}
                className='h-full w-full object-cover'
                loading='lazy'
              />
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {!isLoading && gifs.length === 0 && (
        <div className='flex flex-1 flex-col items-center justify-center p-4 text-center'>
          <p className='text-gray-500'>No GIFs found</p>
          <p className='text-sm text-gray-400'>Try a different search term</p>
        </div>
      )}
    </div>
  );
}
