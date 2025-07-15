"use client";

import { DetachedSheet } from '@/components/ui/detached-sheet';
import { CalendarPlus, ExternalLink } from 'lucide-react';

interface MoreOptionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCalendar: () => void;
  onOpenInSafari: () => void;
}

export default function MoreOptionsSheet({
  isOpen,
  onClose,
  onAddToCalendar,
  onOpenInSafari
}: MoreOptionsSheetProps) {
  
  const handleAddToCalendar = () => {
    onAddToCalendar();
    onClose();
  };

  const handleOpenInSafari = () => {
    onOpenInSafari();
    onClose();
  };

  return (
    <DetachedSheet.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && onClose()}
    >
      <DetachedSheet.Portal>
        <DetachedSheet.View>
          <DetachedSheet.Backdrop />
          <DetachedSheet.Content>
            <div className="p-6">
              {/* Handle */}
              <div className="flex justify-center mb-4">
                <DetachedSheet.Handle />
              </div>

              {/* Title */}
              <h2 className="text-center font-semibold text-lg mb-6">More Options</h2>

              {/* Options */}
              <div className="space-y-3">
                <button
                  onClick={handleAddToCalendar}
                  className="w-full flex items-center gap-4 p-4 text-left border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <CalendarPlus className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-900 font-medium">Add to Calendar</span>
                </button>
                
                <button
                  onClick={handleOpenInSafari}
                  className="w-full flex items-center gap-4 p-4 text-left border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-900 font-medium">Open in Safari</span>
                </button>
              </div>
              
              {/* Cancel Button */}
              <button
                onClick={onClose}
                className="w-full mt-6 py-3 text-gray-700 font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </DetachedSheet.Content>
        </DetachedSheet.View>
      </DetachedSheet.Portal>
    </DetachedSheet.Root>
  );
}