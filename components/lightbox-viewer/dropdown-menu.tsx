'use client';

import { useState } from 'react';
import { MoreHorizontal, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeleteConfirmation } from './delete-confirmation';
import { toast } from '@/lib/utils/toast';

interface GalleryDropdownMenuProps {
  photoId: string;
  handleDelete: (photoId: string) => Promise<{ success: boolean }>;
}

export const GalleryDropdownMenu = ({
  photoId,
  handleDelete,
}: GalleryDropdownMenuProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await handleDelete(photoId);
      if (result.success) {
        setIsDialogOpen(false);
      } else {
        toast.error('Failed to delete photo. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Failed to delete photo. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => setIsDialogOpen(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete photo
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteConfirmation
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </>
  );
};