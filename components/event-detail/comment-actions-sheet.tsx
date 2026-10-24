'use client';

import DetachedMenuSheet, { MenuOption } from '@/components/ui/detached-menu-sheet';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

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
  const tCommon = useTranslations('common');
  const options: MenuOption[] = [];

  if (canEdit) {
    options.push({
      id: 'edit',
      icon: Pencil,
      label: tCommon('actions.edit'),
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
      label: tCommon('actions.delete'),
      onClick: () => {
        onDelete();
        onClose();
      },
      variant: 'destructive',
    });
  }

  return <DetachedMenuSheet isOpen={isOpen} onClose={onClose} options={options} />;
}
