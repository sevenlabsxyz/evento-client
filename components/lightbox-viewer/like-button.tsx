"use client";

import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useGalleryLikes } from "@/hooks/use-photo-likes";
import { useRouter } from "next/navigation";

interface LikeButtonProps {
  itemId: string;
  className?: string;
  userId?: string;
  eventId?: string;
}

export const LikeButton = ({
  itemId,
  className,
  userId,
  eventId,
}: LikeButtonProps) => {
  const { likes, has_liked, isLoading, toggleLike } = useGalleryLikes(itemId);
  const router = useRouter();

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      const returnPath = `/p/${eventId}/photos`;
      router.push(`/login?next=${encodeURIComponent(returnPath)}`);
      return;
    }

    toggleLike();
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Button
        variant="secondary"
        size="icon"
        onClick={handleLikeClick}
        disabled={isLoading || !itemId}
        className={cn("relative", isLoading && "opacity-50 cursor-not-allowed")}
      >
        <motion.div
          whileTap={{ scale: 0.8 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Heart
            className={cn(
              "h-4 w-4",
              has_liked ? "fill-current text-red-500" : "text-gray-500"
            )}
          />
        </motion.div>
      </Button>
    </div>
  );
};