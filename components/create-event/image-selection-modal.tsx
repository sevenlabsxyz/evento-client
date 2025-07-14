"use client";

import { useState } from "react";
import { X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { coverImageCategories, CoverImage } from "@/lib/data/cover-images";

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
  const [activeTab, setActiveTab] = useState("suggested");

  if (!isOpen) return null;

  const activeCategory = coverImageCategories.find(
    (cat) => cat.id === activeTab
  );
  const images = activeCategory?.images || [];

  const handleImageSelect = (image: CoverImage) => {
    onImageSelect(image.url);
    onClose();
  };

  const handleChooseFromLibrary = () => {
    // This would trigger native photo library picker in a real app
    console.log("Opening device photo library...");
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
        <div className="flex space-x-6 overflow-x-auto">
          {coverImageCategories.map((category) => {
            const IconComponent = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setActiveTab(category.id)}
                className={`flex flex-col items-center space-y-2 py-2 px-1 min-w-max ${
                  activeTab === category.id ? "text-gray-900" : "text-gray-400"
                }`}
              >
                <IconComponent className="w-6 h-6" />
                <span className="text-sm font-medium">{category.name}</span>
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
          {/* Featured Section for Summer */}
          {activeTab === "summer" && (
            <div className="mb-6">
              <div className="relative h-40 bg-gradient-to-r from-red-400 to-red-500 rounded-2xl overflow-hidden mb-4">
                <div className="absolute inset-0 flex items-center justify-between p-6">
                  <div>
                    <h2 className="text-white text-2xl font-bold">Summer</h2>
                    <p className="text-white opacity-90">44 Images</p>
                  </div>
                  <div className="flex gap-2">
                    <Image
                      src="/api/placeholder/80/80"
                      alt="Beach"
                      width={80}
                      height={80}
                      className="rounded-lg"
                    />
                    <Image
                      src="/api/placeholder/80/80"
                      alt="Drink"
                      width={80}
                      height={80}
                      className="rounded-lg"
                    />
                    <Image
                      src="/api/placeholder/80/80"
                      alt="Sun"
                      width={80}
                      height={80}
                      className="rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Featured Categories for Suggested Tab */}
          {activeTab === "suggested" && (
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Summer Featured */}
                <div className="relative h-32 bg-gradient-to-r from-red-400 to-red-500 rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center p-4">
                    <div className="text-center">
                      <h3 className="text-white text-lg font-bold">Summer</h3>
                      <p className="text-white opacity-90 text-sm">44 Images</p>
                    </div>
                  </div>
                </div>

                {/* French Culture */}
                <div className="relative h-32 bg-gray-100 rounded-2xl overflow-hidden">
                  <Image
                    src="/api/placeholder/150/120"
                    alt="French Culture"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <h3 className="text-white font-semibold">French Culture</h3>
                  </div>
                </div>

                {/* Outdoors */}
                <div className="relative h-32 bg-green-800 rounded-2xl overflow-hidden">
                  <Image
                    src="/api/placeholder/150/120"
                    alt="Outdoors"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <h3 className="text-white font-semibold">Outdoors</h3>
                  </div>
                </div>

                {/* Pride */}
                <div className="relative h-32 bg-pink-400 rounded-2xl overflow-hidden">
                  <Image
                    src="/api/placeholder/150/120"
                    alt="Pride"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <h3 className="text-white font-semibold">Pride</h3>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Image Grid */}
          <div className="grid grid-cols-2 gap-4">
            {images.map((image) => (
              <button
                key={image.id}
                onClick={() => handleImageSelect(image)}
                className="relative aspect-square rounded-2xl overflow-hidden hover:scale-105 transition-transform"
              >
                <Image
                  src={image.url}
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
        <button
          onClick={handleChooseFromLibrary}
          className="w-full py-4 bg-black text-white rounded-2xl font-semibold"
        >
          Choose From Library
        </button>
      </div>
    </div>
  );
}
