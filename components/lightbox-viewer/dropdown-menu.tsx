'use client';

import { ReusableDropdown } from '@/components/reusable-dropdown';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { DeleteConfirmation } from './delete-confirmation';

interface GalleryDropdownMenuProps {
  photoId: string;
  handleDelete: (photoId: string) => Promise<{ success: boolean }>;
}

export const GalleryDropdownMenu = ({ photoId, handleDelete }: GalleryDropdownMenuProps) => {
  const t = useTranslations('zap.lightbox');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await handleDelete(photoId);
      if (result.success) {
        setIsDialogOpen(false);
      } else {
        toast.error(t('deleteFailed'));
      }
    } catch (error) {
      logger.error('Error deleting photo', { error });
      toast.error(t('deleteFailed'));
    } finally {
      setIsDeleting(false);
    }
  };

  const dropdownItems = [
    {
      label: t('deletePhoto'),
      icon: <Trash2 className='h-4 w-4' />,
      action: () => setIsDialogOpen(true),
      destructive: true,
    },
  ];

  return (
    <>
      <ReusableDropdown
        trigger={
          <Button variant='secondary' size='icon'>
            <MoreHorizontal className='h-4 w-4' />
            <span className='sr-only'>{t('openMenu')}</span>
          </Button>
        }
        items={dropdownItems}
        align='right'
      />

      <DeleteConfirmation
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </>
  );
};
