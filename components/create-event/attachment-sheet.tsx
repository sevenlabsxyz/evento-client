"use client";

import { useState } from "react";
import { Camera, File, Link, Check } from "lucide-react";
import { SpotifySVGImage } from "@/components/icons/spotify";
import { WavlakeSVGImage } from "@/components/icons/wavlake";
import { DetachedSheet } from "@/components/ui/detached-sheet";
import SpotifySheet from "./spotify-sheet";
import WavlakeSheet from "./wavlake-sheet";
import LinkSheet from "./link-sheet";

interface AttachmentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (
    type: "spotify" | "wavlake" | "photo" | "file" | "link"
  ) => void;
  onSaveAttachment?: (type: string, url: string) => void;
  spotifyUrl?: string;
  wavlakeUrl?: string;
}

export default function AttachmentSheet({
  isOpen,
  onClose,
  onSelectType,
  onSaveAttachment,
  spotifyUrl = '',
  wavlakeUrl = '',
}: AttachmentSheetProps) {
  const [showSpotifySheet, setShowSpotifySheet] = useState(false);
  const [showWavlakeSheet, setShowWavlakeSheet] = useState(false);
  const [showLinkSheet, setShowLinkSheet] = useState(false);

  const hasSpotify = !!spotifyUrl;
  const hasWavlake = !!wavlakeUrl;

  const handleSpotifyClick = () => {
    setShowSpotifySheet(true);
  };

  const handleWavlakeClick = () => {
    setShowWavlakeSheet(true);
  };

  const handleLinkClick = () => {
    setShowLinkSheet(true);
  };

  const handleSpotifySave = (url: string) => {
    if (onSaveAttachment) {
      onSaveAttachment("spotify", url);
    }
    setShowSpotifySheet(false);
  };

  const handleWavlakeSave = (url: string) => {
    if (onSaveAttachment) {
      onSaveAttachment("wavlake", url);
    }
    setShowWavlakeSheet(false);
  };

  const handleLinkSave = (url: string) => {
    if (onSaveAttachment) {
      onSaveAttachment("link", url);
    }
    setShowLinkSheet(false);
  };

  const options = [
    {
      type: "spotify" as const,
      label: hasSpotify ? "Edit Spotify" : "Add Spotify",
      icon: <SpotifySVGImage className="w-6 h-6" />,
      description: hasSpotify ? "Modify Spotify track or playlist" : "Add Spotify track or playlist",
      filled: hasSpotify,
      disabled: false,
      onClick: handleSpotifyClick,
    },
    {
      type: "wavlake" as const,
      label: hasWavlake ? "Edit Wavlake" : "Add Wavlake",
      icon: <WavlakeSVGImage className="w-6 h-6" />,
      description: hasWavlake ? "Modify Wavlake track or playlist" : "Add Wavlake track or playlist",
      filled: hasWavlake,
      disabled: false,
      onClick: handleWavlakeClick,
    },
    {
      type: "photo" as const,
      label: "Add Photo",
      icon: <Camera className="w-6 h-6" />,
      description: "Select from your photos",
      filled: false,
      disabled: true,
      onClick: () => {},
    },
    {
      type: "file" as const,
      label: "Add File",
      icon: <File className="w-6 h-6" />,
      description: "Upload a document",
      filled: false,
      disabled: true,
      onClick: () => {},
    },
    {
      type: "link" as const,
      label: "Add Link",
      icon: <Link className="w-6 h-6" />,
      description: "Add any web link",
      filled: false,
      disabled: false,
      onClick: handleLinkClick,
    },
  ];

  return (
    <DetachedSheet.Root 
      presented={isOpen} 
      onPresentedChange={(presented) => !presented && onClose()}
      forComponent="closest"
    >
      <DetachedSheet.Portal>
        <DetachedSheet.View>
          <DetachedSheet.Backdrop />
          <DetachedSheet.Content>
            <div className="p-6">
              {/* Handle */}
              <div className="flex justify-center mb-4">
                <DetachedSheet.Handle />
              </div>

              {/* Header */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-center">Add Attachment</h2>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {options.map((option) => {
                  const getButtonStyles = () => {
                    if (option.disabled) {
                      return "w-full p-4 bg-gray-200 rounded-2xl flex items-center gap-4 text-left cursor-not-allowed opacity-50";
                    }
                    if (option.filled) {
                      return "w-full p-4 bg-green-50 border border-green-200 hover:bg-green-100 rounded-2xl flex items-center gap-4 text-left transition-colors";
                    }
                    return "w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl flex items-center gap-4 text-left transition-colors";
                  };

                  const getIconStyles = () => {
                    if (option.disabled) {
                      return "w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-gray-500";
                    }
                    if (option.filled) {
                      return "w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-700";
                    }
                    return "w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-600";
                  };

                  const getTextStyles = () => {
                    if (option.disabled) {
                      return { label: "font-medium text-gray-500", description: "text-sm text-gray-400" };
                    }
                    if (option.filled) {
                      return { label: "font-medium text-green-900", description: "text-sm text-green-700" };
                    }
                    return { label: "font-medium text-gray-900", description: "text-sm text-gray-500" };
                  };

                  const textStyles = getTextStyles();

                  return (
                    <button
                      key={option.type}
                      onClick={option.onClick}
                      className={getButtonStyles()}
                      disabled={option.disabled}
                    >
                      <div className={getIconStyles()}>
                        {option.icon}
                      </div>
                      <div className="flex-1">
                        <p className={textStyles.label}>{option.label}</p>
                        <p className={textStyles.description}>{option.description}</p>
                      </div>
                      {option.filled && (
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Nested Sheets */}
            <SpotifySheet
              isOpen={showSpotifySheet}
              onClose={() => setShowSpotifySheet(false)}
              onSave={handleSpotifySave}
            />
            <WavlakeSheet
              isOpen={showWavlakeSheet}
              onClose={() => setShowWavlakeSheet(false)}
              onSave={handleWavlakeSave}
            />
            <LinkSheet
              isOpen={showLinkSheet}
              onClose={() => setShowLinkSheet(false)}
              onSave={handleLinkSave}
            />
          </DetachedSheet.Content>
        </DetachedSheet.View>
      </DetachedSheet.Portal>
    </DetachedSheet.Root>
  );
}