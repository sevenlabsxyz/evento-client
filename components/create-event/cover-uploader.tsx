'use client';

import { Button } from '@/components/ui/button';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import { Loader2, UploadCloud } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

interface CoverUploaderProps {
  onCoverUploaded: (url: string) => void;
  className?: string;
  buttonText?: string;
  buttonVariant?: 'default' | 'secondary' | 'outline' | 'ghost';
  showIcon?: boolean;
}

export default function CoverUploader({
  onCoverUploaded,
  className = '',
  buttonText,
  buttonVariant = 'secondary',
  showIcon = true,
}: CoverUploaderProps) {
  const t = useTranslations('createEvent');
  const [isLoading, setIsLoading] = useState(false);
  const inputFileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast.error(t('cover.noImage'));
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('cover.tooLarge'));
      event.target.value = '';
      return;
    }

    // Validate file type - allow GIF, PNG, JPG, JPEG
    const validTypes = ['image/png', 'image/gif', 'image/jpeg', 'image/jpg'];
    const isValidType = validTypes.includes(file.type);
    const isGif = file.type === 'image/gif';

    if (!isValidType) {
      toast.error(t('cover.invalidType'));
      event.target.value = '';
      return;
    }

    // For GIFs, check if they're under the size limit
    if (isGif && file.size > 5 * 1024 * 1024) {
      // 5MB limit for GIFs
      toast.error(t('cover.gifTooLarge'));
      event.target.value = '';
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/v1/cover-upload?filename=${encodeURIComponent(file.name)}`,
        {
          method: 'POST',
          body: file,
        }
      );

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.image) {
        onCoverUploaded(result.image);
        toast.success(t('cover.uploaded'));
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      logger.error('Cover upload error', { error });
      toast.error(t('cover.uploadFailed'));
    } finally {
      setIsLoading(false);
      // Reset the input
      if (inputFileRef.current) {
        inputFileRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    inputFileRef.current?.click();
  };

  return (
    <>
      <input
        ref={inputFileRef}
        type='file'
        accept='.png,.gif,.jpg,.jpeg,image/png,image/gif,image/jpeg,image/jpg'
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      <Button
        onClick={handleButtonClick}
        disabled={isLoading}
        variant={buttonVariant}
        className={className}
      >
        {isLoading ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            {t('cover.uploading')}
          </>
        ) : (
          <>
            {showIcon && <UploadCloud className='mr-2 h-4 w-4' />}
            {buttonText ?? t('cover.uploadPhoto')}
          </>
        )}
      </Button>
    </>
  );
}
