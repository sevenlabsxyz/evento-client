"use client";

import { useState } from "react";
import { X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { coverImageCategories, CoverImage } from "@/lib/data/cover-images";
import { getCoverImageUrl500x500 } from "@/lib/utils/cover-images";
import CoverUploader from "./cover-uploader";
import ProgressiveImage from "@/components/ui/progressive-image";

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
  const [activeTab, setActiveTab] = useState("featured");

  if (!isOpen) return null;

  const activeCategory = coverImageCategories.find(
    (cat) => cat.id === activeTab
  );
  const images = activeCategory?.images || [];

  const handleImageSelect = (image: CoverImage) => {
    onImageSelect(image.url);
    onClose();
  };

  const handleCoverUploaded = (url: string) => {
    onImageSelect(url);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-hidden">
      {/* Header */}
      <PageHeader
        title="Add Cover Image"
        subtitle="Choose from our curated collection"
        rightContent={
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-gray-100"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        }
      />

      {/* Tab Navigation */}
      <div className="px-4 mb-4">
        <div className="grid grid-cols-5 gap-2">
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
                <span className="text-xs font-medium text-center leading-tight">{category.name}</span>
                {activeTab === category.id && (
                  <div className="w-full h-0.5 bg-gray-900 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ height: "calc(100vh - 200px)" }}
      >
        <div className="px-4 pb-24">
          {/* Image Grid */}
          <div className="grid grid-cols-2 gap-1">
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
        </div>
      </div>

      {/* Bottom Action Button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
        <CoverUploader
          onCoverUploaded={handleCoverUploaded}
          className="w-full py-4 rounded-2xl font-semibold"
          buttonText="Upload Custom Image"
          buttonVariant="default"
        />
      </div>
    </div>
  );
}
