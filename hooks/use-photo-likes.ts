import { useState } from 'react';

interface UseGalleryLikesReturn {
  likes: number;
  has_liked: boolean;
  isLoading: boolean;
  toggleLike: () => void;
}

export const useGalleryLikes = (itemId: string): UseGalleryLikesReturn => {
  const [likes, setLikes] = useState(0);
  const [has_liked, setHasLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const toggleLike = async () => {
    if (!itemId) return;

    setIsLoading(true);
    try {
      // TODO: Implement actual like/unlike API call
      setHasLiked(!has_liked);
      setLikes(has_liked ? likes - 1 : likes + 1);
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    likes,
    has_liked,
    isLoading,
    toggleLike,
  };
};
