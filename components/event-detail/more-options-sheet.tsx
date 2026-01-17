'use client';

import DetachedMenuSheet, { MenuOption } from '@/components/ui/detached-menu-sheet';
import { toast } from '@/lib/utils/toast';
import { Bookmark, CalendarPlus, Copy, DollarSign } from 'lucide-react';

interface MoreOptionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCalendar: () => void;
  onSaveEvent: () => void;
  onContribute?: () => void;
  isSaved?: boolean;
  hasContributions?: boolean;
}

export default function MoreOptionsSheet({
  isOpen,
  onClose,
  onAddToCalendar,
  onSaveEvent,
  onContribute,
  isSaved = false,
  hasContributions = false,
}: MoreOptionsSheetProps) {
  const handleAddToCalendar = () => {
    onAddToCalendar();
    onClose();
  };

  const handleSaveEvent = () => {
    onSaveEvent();
    onClose();
  };

  const handleContribute = () => {
    onContribute?.();
    onClose();
  };

  const handleCopyEventUrl = async () => {
    onClose();
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Event URL copied to clipboard');
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Event URL copied to clipboard');
    }
  };

  const options: MenuOption[] = [
    {
      id: 'save-event',
      icon: Bookmark,
      label: isSaved ? 'Manage Saved Lists' : 'Save Event',
      onClick: handleSaveEvent,
      variant: 'secondary',
    },
    {
      id: 'add-to-calendar',
      icon: CalendarPlus,
      label: 'Add to Calendar',
      onClick: handleAddToCalendar,
      variant: 'secondary',
    },
    {
      id: 'copy-event-url',
      icon: Copy,
      label: 'Copy Event URL',
      onClick: handleCopyEventUrl,
      variant: 'secondary',
    },
  ];

  if (hasContributions && onContribute) {
    options.unshift({
      id: 'contribute',
      icon: DollarSign,
      label: 'Contribute to Event',
      onClick: handleContribute,
      variant: 'secondary',
    });
  }

  return <DetachedMenuSheet isOpen={isOpen} onClose={onClose} options={options} />;
}
