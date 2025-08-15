"use client";

import { DetachedSheet } from "@/components/ui/detached-sheet";
import { CalendarPlus, ExternalLink, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  onOpenInSafari,
}: MoreOptionsSheetProps) {
  const handleAddToCalendar = () => {
    onAddToCalendar();
    onClose();
  };

  const handleOpenInSafari = () => {
    onOpenInSafari();
    onClose();
  };

  const handleCopyEventUrl = () => {
    // TODO: Implement copy event URL functionality
    onClose();
  };

  const options = [
    {
      id: "add-to-calendar",
      icon: CalendarPlus,
      label: "Add to Calendar",
      onClick: handleAddToCalendar,
      variant: "secondary" as const,
    },
    {
      id: "open-in-safari",
      icon: ExternalLink,
      label: "Open in Safari",
      onClick: handleOpenInSafari,
      variant: "secondary" as const,
    },
    {
      id: "copy-event-url",
      icon: Copy,
      label: "Copy Event URL",
      onClick: handleCopyEventUrl,
      variant: "secondary" as const,
    },
  ];

  return (
    <DetachedSheet.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && onClose()}
    >
      <DetachedSheet.Portal>
        <DetachedSheet.View>
          <DetachedSheet.Backdrop />
          <DetachedSheet.Content>
            <div className="p-6 pb-24">
              {/* Handle */}
              <div className="mb-4 flex justify-center">
                <DetachedSheet.Handle />
              </div>

              {/* Options */}
              <div className="space-y-3">
                {options.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <Button
                      key={option.id}
                      onClick={option.onClick}
                      variant={option.variant}
                      className="flex w-full items-center gap-4 rounded-xl border border-gray-200 px-4 py-6 text-left transition-colors hover:bg-gray-50"
                    >
                      <IconComponent className="h-5 w-5 text-gray-600" />
                      <span className="font-medium text-gray-900">
                        {option.label}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </DetachedSheet.Content>
        </DetachedSheet.View>
      </DetachedSheet.Portal>
    </DetachedSheet.Root>
  );
}
