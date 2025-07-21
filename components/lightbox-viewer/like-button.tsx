'use client';

import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LikeButtonProps {
  itemId: string;
  userId: string;
  eventId: string;
  onLike?: () => void;
}

export const LikeButton = ({ itemId, userId, eventId, onLike }: LikeButtonProps) => {
  // TODO: Implement actual like functionality
  const handleLike = () => {
    onLike?.();
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleLike}>
      <Heart className="h-4 w-4" />
    </Button>
  );
};