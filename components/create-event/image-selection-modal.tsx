"use client";

import ProgressiveImage from "@/components/ui/progressive-image";
import { CoverImage, coverImageCategories } from "@/lib/data/cover-images";
import { useTopBar } from "@/lib/stores/topbar-store";
import { getCoverImageUrl500x500 } from "@/lib/utils/cover-images";
import { useEffect, useState } from "react";
import GiphyPicker from "../giphy/giphy-picker";
import CoverUploader from "./cover-uploader";

interface ImageSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelect: (imageUrl: string) => void;
}

export default function ImageSelectionModal({
  isOpen,
  onClose,
  onImageSelect,
}: ImageSelectionModalProps) {
  const { setTopBar } = useTopBar();
  const [activeTab, setActiveTab] = useState("featured");

  // Set TopBar content
  useEffect(() => {
    setTopBar({
      title: "Select Image",
      subtitle: "Choose your event photo",
    });

    return () => {
      setTopBar({ rightContent: null });
    };
  }, [setTopBar]);

  const activeCategory = coverImageCategories.find(
    (cat) => cat.id === activeTab
  );
  const images = activeCategory?.images || [];

  const handleImageSelect = (image: CoverImage | string) => {
    const imageUrl = typeof image === "string" ? image : image.url;
    onImageSelect(imageUrl);
    onClose();
  };

  const handleCoverUploaded = (url: string) => {
    onImageSelect(url);
    onClose();
  };

  const isGifTab = activeTab === "giphy";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-hidden">
      {/* Tab Navigation */}
      <div className="px-4 mb-4">
        <div className="grid grid-cols-6 gap-2">
          {coverImageCategories.map((category) => {
            const IconComponent = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setActiveTab(category.id)}
                className={`flex flex-col items-center space-y-2 py-2 px-1 ${
                  activeTab === category.id ? "text-gray-900" : "text-gray-400"
                }`}
              >
                <IconComponent className="w-6 h-6" />
                <span className="text-xs font-medium text-center leading-tight">
                  {category.name}
                </span>
                {activeTab === category.id && (
                  <div className="w-full h-0.5 bg-gray-900 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ height: isGifTab ? "100vh" : "calc(100vh - 200px)" }} // No need provisioning space for bottom action button if GIF tab is active
      >
        <div className="px-4 pb-24">
          {isGifTab ? (
            <div className="h-full">
              <GiphyPicker
                onGifSelect={(gifUrl) => {
                  onImageSelect(gifUrl);
                  onClose();
                }}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
              {images.map((image) => (
                <button
                  key={image.id}
                  onClick={() => handleImageSelect(image)}
                  className="relative aspect-square w-full h-auto rounded-2xl overflow-hidden hover:scale-105 transition-transform"
                >
                  <ProgressiveImage
                    src={getCoverImageUrl500x500(image.url)}
                    alt={image.title || "Cover image"}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Button - Only show for non-GIF tabs */}
      {!isGifTab && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
          <CoverUploader
            onCoverUploaded={handleCoverUploaded}
            className="w-full py-4 rounded-2xl font-semibold"
            buttonText="Upload Custom Image"
            buttonVariant="default"
          />
        </div>
      )}
    </div>
  );
}
