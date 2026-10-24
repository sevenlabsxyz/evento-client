import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import { useTranslations } from 'next-intl';
import * as React from 'react';
import { useCallback, useRef, useState } from 'react';

interface FileData {
  file: File;
  previewUrl: string;
}

interface UploadProgress {
  name: string;
  status: 'pending' | 'uploading' | 'success' | 'failed';
  message?: string;
}

interface UseMultiFileUploadOptions {
  onUpload: (file: File) => Promise<any>;
  onSuccess?: () => void;
  maxFileSize?: number; // in MB
  maxFiles?: number;
  acceptedTypes?: string[];
}

// No compression helper needed - using original files for better mobile performance

export function useMultiFileUpload({
  onUpload,
  onSuccess,
  maxFileSize = 10, // 10MB default
  maxFiles = 20, // Consider lowering this for mobile performance
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
}: UseMultiFileUploadOptions) {
  const [selectedFilesData, setSelectedFilesData] = useState<FileData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingPercentage, setUploadingPercentage] = useState(0);
  const [uploadProgressIndividual, setUploadProgressIndividual] = useState<UploadProgress[]>([]);

  const inputFileRef = useRef<HTMLInputElement>(null);
  const t = useTranslations('hooks');

  const acceptedFileTypes = acceptedTypes.join(',');

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return t('upload.unsupportedType', { type: file.type });
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      return t('upload.fileTooLarge', { size: fileSizeMB.toFixed(1), limit: maxFileSize });
    }

    return null;
  };

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      if (files.length === 0) return;

      // Check total files limit
      if (selectedFilesData.length + files.length > maxFiles) {
        toast.error(t('upload.tooManyFiles', { max: maxFiles }));
        return;
      }

      const validFiles: File[] = [];
      const invalidFiles: string[] = [];

      // Validate each file
      for (const file of files) {
        const error = validateFile(file);
        if (error) {
          invalidFiles.push(`${file.name}: ${error}`);
        } else {
          validFiles.push(file);
        }
      }

      // Show errors for invalid files
      if (invalidFiles.length > 0) {
        toast.error(
          t('upload.invalidFiles', {
            files: `${invalidFiles.slice(0, 3).join('\n')}${invalidFiles.length > 3 ? '\n...' : ''}`,
          })
        );
      }

      if (validFiles.length === 0) return;

      // Check for duplicates
      const newFiles = validFiles.filter(
        (file) =>
          !selectedFilesData.some(
            (existing) => existing.file.name === file.name && existing.file.size === file.size
          )
      );

      if (newFiles.length !== validFiles.length) {
        toast.warning(t('upload.alreadySelected'));
      }

      // Create file data with preview URLs - no compression for fast mobile performance
      const newFileData = newFiles.map((file) => {
        const previewUrl = URL.createObjectURL(file);
        return { file, previewUrl };
      });

      try {
        setSelectedFilesData((prev) => [...prev, ...newFileData]);

        if (newFiles.length > 0) {
          toast.success(t('upload.selectedPhotos', { count: newFiles.length }));
        }
      } catch (error) {
        logger.error('Error processing files', {
          error: error instanceof Error ? error.message : String(error),
        });
        toast.error(t('upload.processingError'));
      }

      // Clear the input
      if (inputFileRef.current) {
        inputFileRef.current.value = '';
      }
    },
    [selectedFilesData, maxFiles, maxFileSize, acceptedTypes, t]
  );

  const removeFileFromSelection = useCallback((fileName: string) => {
    setSelectedFilesData((prev) => {
      const updated = prev.filter((fileData) => fileData.file.name !== fileName);
      // Clean up URL
      const removed = prev.find((fileData) => fileData.file.name === fileName);
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return updated;
    });
  }, []);

  const clearSelection = useCallback(() => {
    // Clean up all URLs
    selectedFilesData.forEach((fileData) => {
      URL.revokeObjectURL(fileData.previewUrl);
    });
    setSelectedFilesData([]);
  }, [selectedFilesData]);

  const uploadFiles = useCallback(async () => {
    if (selectedFilesData.length === 0 || isUploading) return;

    setIsUploading(true);
    setUploadingPercentage(0);

    // Initialize progress tracking
    const progressData: UploadProgress[] = selectedFilesData.map((fileData) => ({
      name: fileData.file.name,
      status: 'pending',
    }));
    setUploadProgressIndividual(progressData);

    let successCount = 0;
    let failCount = 0;

    // Upload files one by one for better mobile performance
    for (let i = 0; i < selectedFilesData.length; i++) {
      const fileData = selectedFilesData[i];

      // Update progress
      setUploadProgressIndividual((prev) =>
        prev.map((item, idx) => (idx === i ? { ...item, status: 'uploading' } : item))
      );

      try {
        const result = await onUpload(fileData.file);

        // Handle both exception-based and return-value-based error handling
        // Check if result indicates failure (for backward compatibility)
        if (result && typeof result === 'object' && result.success === false) {
          setUploadProgressIndividual((prev) =>
            prev.map((item, idx) =>
              idx === i
                ? {
                    ...item,
                    status: 'failed',
                    message: result.message || result.error || t('upload.uploadFailed'),
                  }
                : item
            )
          );

          failCount++;
        } else {
          setUploadProgressIndividual((prev) =>
            prev.map((item, idx) => (idx === i ? { ...item, status: 'success' } : item))
          );

          successCount++;
        }
      } catch (error: any) {
        setUploadProgressIndividual((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  status: 'failed',
                  message: error?.message || t('upload.uploadFailed'),
                }
              : item
          )
        );

        failCount++;
      }

      // Update overall progress
      const progress = ((i + 1) / selectedFilesData.length) * 100;
      setUploadingPercentage(progress);
    }

    // Show final result
    if (successCount > 0) {
      toast.success(t('upload.uploadedPhotos', { count: successCount }));
      onSuccess?.();
    }

    if (failCount > 0) {
      toast.error(t('upload.failedPhotos', { count: failCount }));
    }

    setIsUploading(false);
  }, [selectedFilesData, isUploading, onUpload, onSuccess, t]);

  const triggerFileSelect = useCallback(() => {
    inputFileRef.current?.click();
  }, []);

  return {
    selectedFilesData,
    isUploading,
    uploadingPercentage,
    uploadProgressIndividual,
    inputFileRef,
    handleFileSelect,
    removeFileFromSelection,
    clearSelection,
    uploadFiles,
    triggerFileSelect,
    acceptedFileTypes,
  };
}
