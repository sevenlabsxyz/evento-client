"use client";

import { Input } from "@/components/ui/input";
import { GiphyFetch } from "@giphy/js-fetch-api";
import { IGif } from "@giphy/js-types";
import { Loader2, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const gf = new GiphyFetch(process.env.NEXT_PUBLIC_GIPHY_API_KEY || "");

interface GiphyPickerProps {
  onGifSelect: (gifUrl: string) => void;
}

export default function GiphyPicker({ onGifSelect }: GiphyPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [gifs, setGifs] = useState<IGif[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGif, setSelectedGif] = useState<IGif | null>(null);

  const fetchTrendingGifs = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await gf.trending({
        limit: 20,
        rating: "g",
        type: "gifs",
      });
      setGifs(data);
    } catch (error) {
      console.error("Error fetching trending GIFs:", error);
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
          rating: "g",
          type: "gifs",
        });
        setGifs(data);
      } catch (error) {
        console.error("Error searching GIFs:", error);
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
    <div className="w-full h-full flex flex-col">
      {/* Search bar */}
      <div className="relative mt-2 mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search GIFs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full bg-gray-100"
        />
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      {/* GIF Grid */}
      {!isLoading && gifs.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 overflow-y-auto flex-1 pb-4">
          {gifs.map((gif) => (
            <div
              key={gif.id}
              className={`aspect-square rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                selectedGif?.id === gif.id
                  ? "ring-2 ring-primary ring-offset-2"
                  : ""
              }`}
              onClick={() => handleGifClick(gif)}
            >
              <img
                src={gif.images.fixed_width.webp}
                alt={gif.title || "GIF"}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {!isLoading && gifs.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <p className="text-gray-500">No GIFs found</p>
          <p className="text-sm text-gray-400">Try a different search term</p>
        </div>
      )}
    </div>
  );
}
