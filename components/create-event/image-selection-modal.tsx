'use client';

import ImageSelectionSheet from './image-selection-sheet';

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
  return <ImageSelectionSheet isOpen={isOpen} onClose={onClose} onImageSelect={onImageSelect} />;
}
