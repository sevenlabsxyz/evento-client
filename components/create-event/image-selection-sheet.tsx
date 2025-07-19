'use client';

import GiphyPicker from '@/components/giphy/giphy-picker';
import ProgressiveImage from '@/components/ui/progressive-image';
import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { CoverImage, coverImageCategories } from '@/lib/data/cover-images';
import { getCoverImageUrl500x500 } from '@/lib/utils/cover-images';
import { VisuallyHidden } from '@silk-hq/components';
import { useCallback, useState } from 'react';
import CoverUploader from './cover-uploader';
import './image-selection-sheet.css';

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
  const [activeTab, setActiveTab] = useState('featured');

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

  const handleGifSelect = useCallback(
    (gifUrl: string) => {
      onImageSelect(gifUrl);
      onClose();
    },
    [onImageSelect, onClose]
  );

  return (
    <SheetWithDetentFull.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && onClose()}
    >
      <SheetWithDetentFull.Portal>
        <SheetWithDetentFull.View>
          <SheetWithDetentFull.Backdrop />
          <SheetWithDetentFull.Content className="ImageSelectionSheet-content">
            {/* Fixed Header */}
            <div className="ImageSelectionSheet-header">
              <div className="flex justify-center mb-4">
                <SheetWithDetentFull.Handle className="ImageSelectionSheet-handle" />
              </div>
              <VisuallyHidden.Root asChild>
                <SheetWithDetentFull.Title className="ImageSelectionSheet-title">
                  Add Cover Image
                </SheetWithDetentFull.Title>
              </VisuallyHidden.Root>
              <h2 className="ImageSelectionSheet-visibleTitle">
                Add Cover Image
              </h2>
              <p className="ImageSelectionSheet-subtitle">
                Choose from our curated collection
              </p>

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
                          activeTab === category.id
                            ? 'ImageSelectionSheet-tab--active'
                            : ''
                        }`}
                      >
                        <IconComponent className="ImageSelectionSheet-tabIcon" />
                        <span className="ImageSelectionSheet-tabLabel">
                          {category.name}
                        </span>
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
            <SheetWithDetentFull.ScrollRoot asChild>
              <SheetWithDetentFull.ScrollView className="ImageSelectionSheet-scrollView">
                <SheetWithDetentFull.ScrollContent className="ImageSelectionSheet-scrollContent">
                  {activeTab === 'giphy' ? (
                    <div className="h-full w-full">
                      <GiphyPicker onGifSelect={handleGifSelect} />
                    </div>
                  ) : (
                    <div className="ImageSelectionSheet-imageGrid">
                      {images.map((image) => (
                        <button
                          key={image.id}
                          onClick={() => handleImageSelect(image)}
                          className="ImageSelectionSheet-imageButton"
                        >
                          <ProgressiveImage
                            src={getCoverImageUrl500x500(image.url)}
                            alt={image.title || 'Cover image'}
                            fill
                            className="ImageSelectionSheet-image"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </SheetWithDetentFull.ScrollContent>
              </SheetWithDetentFull.ScrollView>
            </SheetWithDetentFull.ScrollRoot>

            {/* Custom Image Upload - Only show for non-GIF tabs */}
            {activeTab !== 'giphy' && (
              <div className="ImageSelectionSheet-footer">
                <CoverUploader
                  onCoverUploaded={handleCoverUploaded}
                  className="ImageSelectionSheet-uploadButton"
                  buttonText="Upload Custom Image"
                  buttonVariant="default"
                />
              </div>
            )}
          </SheetWithDetentFull.Content>
        </SheetWithDetentFull.View>
      </SheetWithDetentFull.Portal>
    </SheetWithDetentFull.Root>
  );
}
