'use client';

import DetachedMenuSheet, { MenuOption } from '@/components/ui/detached-menu-sheet';
import { toast } from '@/lib/utils/toast';
import { CalendarPlus, Copy } from 'lucide-react';

interface MoreOptionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCalendar: () => void;
}

export default function MoreOptionsSheet({
  isOpen,
  onClose,
  onAddToCalendar,
}: MoreOptionsSheetProps) {
  const handleAddToCalendar = () => {
    onAddToCalendar();
    onClose();
  };

  const handleCopyEventUrl = async () => {
    onClose();
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Event URL copied to clipboard');
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Event URL copied to clipboard');
    }
  };

  const options: MenuOption[] = [
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
  
  return <DetachedMenuSheet isOpen={isOpen} onClose={onClose} options={options} />;
}
