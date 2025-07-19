"use client";

import { DetachedSheet } from "@/components/ui/detached-sheet";
import { Button } from "@/components/ui/button";
import { Instagram, ExternalLink } from "lucide-react";

interface InstagramSheetProps {
  isOpen: boolean;
  onClose: () => void;
  handle: string;
}

export default function InstagramSheet({ isOpen, onClose, handle }: InstagramSheetProps) {
  const handleOpenInstagram = () => {
    const instagramUrl = `https://instagram.com/${handle}`;
    window.open(instagramUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <DetachedSheet.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && onClose()}
    >
      <DetachedSheet.Portal>
        <DetachedSheet.View>
          <DetachedSheet.Backdrop />
          <DetachedSheet.Content>
            <div className="p-6">
              {/* Handle */}
              <div className="mb-4 flex justify-center">
                <DetachedSheet.Handle />
              </div>

              {/* Title */}
              <h2 className="mb-6 text-center text-lg font-semibold">
                Instagram
              </h2>

              {/* Instagram Info */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-full flex items-center justify-center">
                  <Instagram className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">@{handle}</h3>
                  <p className="text-sm text-gray-500">Instagram profile</p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  You're about to visit this Instagram profile. This will open in a new tab.
                </p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700">instagram.com/{handle}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <Button onClick={handleOpenInstagram} className="w-full bg-red-600 hover:bg-red-700 text-white">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Instagram
                </Button>
                <Button variant="outline" onClick={onClose} className="w-full">
                  Cancel
                </Button>
              </div>
            </div>
          </DetachedSheet.Content>
        </DetachedSheet.View>
      </DetachedSheet.Portal>
    </DetachedSheet.Root>
  );
}