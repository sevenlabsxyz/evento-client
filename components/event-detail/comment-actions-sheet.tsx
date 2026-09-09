'use client';

import DetachedMenuSheet, { MenuOption } from '@/components/ui/detached-menu-sheet';
import { Pencil, Trash2 } from 'lucide-react';

interface CommentActionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function CommentActionsSheet({
  isOpen,
  onClose,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: CommentActionsSheetProps) {
  const options: MenuOption[] = [];

  if (canEdit) {
    options.push({
      id: 'edit',
      icon: Pencil,
      label: 'Edit',
      onClick: () => {
        onEdit();
        onClose();
      },
      variant: 'secondary',
    });
  }

  if (canDelete) {
    options.push({
      id: 'delete',
      icon: Trash2,
      label: 'Delete',
      onClick: () => {
        onDelete();
        onClose();
      },
      variant: 'destructive',
    });
  }

  return <DetachedMenuSheet isOpen={isOpen} onClose={onClose} options={options} />;
}
