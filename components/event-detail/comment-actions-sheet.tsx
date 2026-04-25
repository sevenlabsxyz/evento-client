'use client';

import { Pencil, Trash2 } from '@/components/icons/lucide';
import DetachedMenuSheet, { MenuOption } from '@/components/ui/detached-menu-sheet';

interface CommentActionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function CommentActionsSheet({
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: CommentActionsSheetProps) {
  const options: MenuOption[] = [
    {
      id: 'edit',
      icon: Pencil,
      label: 'Edit',
      onClick: () => {
        onEdit();
        onClose();
      },
      variant: 'secondary',
    },
    {
      id: 'delete',
      icon: Trash2,
      label: 'Delete',
      onClick: () => {
        onDelete();
        onClose();
      },
      variant: 'destructive',
    },
  ];

  return <DetachedMenuSheet isOpen={isOpen} onClose={onClose} options={options} />;
}
