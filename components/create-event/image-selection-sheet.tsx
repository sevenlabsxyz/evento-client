'use client';

'use client';

import GiphyPicker from '@/components/giphy/giphy-picker';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import ProgressiveImage from '@/components/ui/progressive-image';
import { CoverImage, coverImageCategories } from '@/lib/data/cover-images';
import { getCoverImageUrl500x500 } from '@/lib/utils/cover-images';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import CoverUploader from './cover-uploader';

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
  const t = useTranslations('createEvent');
  const [activeTab, setActiveTab] = useState('featured');

  const categoryLabels: Record<string, string> = {
    featured: t('coverPicker.categories.featured'),
    giphy: t('coverPicker.categories.giphy'),
    party: t('coverPicker.categories.party'),
    social: t('coverPicker.categories.social'),
    classic: t('coverPicker.categories.classic'),
    tech: t('coverPicker.categories.tech'),
  };

  const activeCategory = coverImageCategories.find((cat) => cat.id === activeTab);
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

  // Custom header with title and subtitle
  const headerContent = (
    <div className='flex flex-col'>
      <h2 className='text-xl font-semibold text-gray-900 dark:text-neutral-100'>
        {t('coverPicker.title')}
      </h2>
      <p className='text-sm text-gray-500 dark:text-neutral-400'>{t('coverPicker.subtitle')}</p>
    </div>
  );

  // Tab navigation component
  const tabNavigation = (
    <div className='border-b border-gray-200 px-4 pb-3 dark:border-neutral-800'>
      <div className='grid grid-cols-6 gap-2'>
        {coverImageCategories.map((category) => {
          const IconComponent = category.icon;
          const isActive = activeTab === category.id;
          return (
            <button
              key={category.id}
              onClick={() => setActiveTab(category.id)}
              className={`relative flex flex-col items-center gap-2 px-1 py-2 transition-colors ${
                isActive
                  ? 'text-gray-900 dark:text-neutral-100'
                  : 'text-gray-400 dark:text-neutral-400'
              }`}
            >
              <IconComponent className='h-6 w-6' />
              <span className='text-center text-xs font-medium leading-tight'>
                {categoryLabels[category.id] ?? category.name}
              </span>
              {isActive && (
                <div className='absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-gray-900 dark:bg-neutral-100' />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  // Footer with upload button (only for non-giphy tabs)
  const footerContent =
    activeTab !== 'giphy' ? (
      <CoverUploader
        onCoverUploaded={handleCoverUploaded}
        className='w-full rounded-full py-4 font-semibold'
        buttonText={t('coverPicker.uploadCustom')}
        buttonVariant='default'
      />
    ) : undefined;

  return (
    <MasterScrollableSheet
      title={t('coverPicker.title')}
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      headerLeft={headerContent}
      headerSecondary={tabNavigation}
      footer={footerContent}
      contentClassName='p-4'
    >
      {activeTab === 'giphy' ? (
        <div className='h-full w-full'>
          <GiphyPicker onGifSelect={handleGifSelect} />
        </div>
      ) : (
        <div className='grid grid-cols-2 gap-1'>
          {images.map((image) => (
            <button
              key={image.id}
              onClick={() => handleImageSelect(image)}
              className='relative aspect-square w-full overflow-hidden rounded-2xl transition-transform hover:scale-105 active:scale-[0.98]'
            >
              <ProgressiveImage
                src={getCoverImageUrl500x500(image.url)}
                alt={image.title || t('coverPicker.imageAlt')}
                fill
                className='object-cover'
              />
            </button>
          ))}
        </div>
      )}
    </MasterScrollableSheet>
  );
}
