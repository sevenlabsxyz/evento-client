"use client";

import { useState } from "react";
import Image from "next/image";
import { VisuallyHidden } from "@silk-hq/components";
import { SheetWithDetent } from "@/components/ui/sheet-with-detent";
import { coverImageCategories, CoverImage } from "@/lib/data/cover-images";
import { getCoverImageUrl500x500 } from "@/lib/utils/cover-images";
import CoverUploader from "./cover-uploader";
import ProgressiveImage from "@/components/ui/progressive-image";
import "./image-selection-sheet.css";

interface ImageSelectionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelect: (imageUrl: string) => void;
}

export default function ImageSelectionSheet({
  isOpen,
  onClose,
  onImageSelect,
}: ImageSelectionSheetProps) {
  const [activeTab, setActiveTab] = useState("featured");
  const [activeDetent, setActiveDetent] = useState(2); // Start at full height

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
    <SheetWithDetent.Root 
      presented={isOpen} 
      onPresentedChange={(presented) => !presented && onClose()}
      activeDetent={activeDetent}
      onActiveDetentChange={setActiveDetent}
    >
      <SheetWithDetent.Portal>
        <SheetWithDetent.View>
          <SheetWithDetent.Backdrop />
          <SheetWithDetent.Content className="ImageSelectionSheet-content">
            {/* Fixed Header */}
            <div className="ImageSelectionSheet-header">
              <SheetWithDetent.Handle className="ImageSelectionSheet-handle" />
              <VisuallyHidden.Root asChild>
                <SheetWithDetent.Title className="ImageSelectionSheet-title">
                  Add Cover Image
                </SheetWithDetent.Title>
              </VisuallyHidden.Root>
              <h2 className="ImageSelectionSheet-visibleTitle">Add Cover Image</h2>
              <p className="ImageSelectionSheet-subtitle">Choose from our curated collection</p>
              
              {/* Tab Navigation */}
              <div className="ImageSelectionSheet-tabs">
                <div className="ImageSelectionSheet-tabsContainer">
                  {coverImageCategories.map((category) => {
                    const IconComponent = category.icon;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setActiveTab(category.id)}
                        className={`ImageSelectionSheet-tab ${
                          activeTab === category.id ? "ImageSelectionSheet-tab--active" : ""
                        }`}
                      >
                        <IconComponent className="ImageSelectionSheet-tabIcon" />
                        <span className="ImageSelectionSheet-tabLabel">{category.name}</span>
                        {activeTab === category.id && (
                          <div className="ImageSelectionSheet-tabIndicator"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <SheetWithDetent.ScrollRoot asChild>
              <SheetWithDetent.ScrollView className="ImageSelectionSheet-scrollView">
                <SheetWithDetent.ScrollContent className="ImageSelectionSheet-scrollContent">
                  <div className="ImageSelectionSheet-imageGrid">
                    {images.map((image) => (
                      <button
                        key={image.id}
                        onClick={() => handleImageSelect(image)}
                        className="ImageSelectionSheet-imageButton"
                      >
                        <ProgressiveImage
                          src={getCoverImageUrl500x500(image.url)}
                          alt={image.title || "Cover image"}
                          fill
                          className="ImageSelectionSheet-image"
                        />
                      </button>
                    ))}
                  </div>
                </SheetWithDetent.ScrollContent>
              </SheetWithDetent.ScrollView>
            </SheetWithDetent.ScrollRoot>

            {/* Fixed Footer */}
            <div className="ImageSelectionSheet-footer">
              <CoverUploader
                onCoverUploaded={handleCoverUploaded}
                className="ImageSelectionSheet-uploadButton"
                buttonText="Upload Custom Image"
                buttonVariant="default"
              />
            </div>
          </SheetWithDetent.Content>
        </SheetWithDetent.View>
      </SheetWithDetent.Portal>
    </SheetWithDetent.Root>
  );
}