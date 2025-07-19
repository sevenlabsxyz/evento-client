"use client";

import { DetachedSheet } from "@/components/ui/detached-sheet";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "@/lib/utils/toast";

interface NostrSheetProps {
  isOpen: boolean;
  onClose: () => void;
  nip05: string;
}

export default function NostrSheet({ isOpen, onClose, nip05 }: NostrSheetProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyNip05 = async () => {
    try {
      await navigator.clipboard.writeText(nip05);
      setCopied(true);
      toast.success("Nostr identifier copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy identifier");
    }
  };

  const handleOpenNostr = () => {
    const nostrUrl = `nostr:${nip05}`;
    window.open(nostrUrl, '_blank');
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
              <div className="mb-4 flex justify-center">
                <DetachedSheet.Handle />
              </div>

              {/* Title */}
              <h2 className="mb-6 text-center text-lg font-semibold">
                Nostr
              </h2>

              {/* Nostr Info */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <div className="h-6 w-6 bg-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">N</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Nostr Protocol</h3>
                  <p className="text-sm text-gray-500">Decentralized social network</p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  This is a Nostr identifier (NIP-05). Nostr is a decentralized protocol for social networking.
                </p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700 break-all font-mono">{nip05}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <Button onClick={handleOpenNostr} className="w-full bg-red-600 hover:bg-red-700 text-white">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in Nostr App
                </Button>
                <Button onClick={handleCopyNip05} className="w-full" variant="outline">
                  <Copy className="h-4 w-4 mr-2" />
                  {copied ? "Copied!" : "Copy NIP-05"}
                </Button>
              </div>
              
              <Button variant="outline" onClick={onClose} className="w-full mt-3">
                Close
              </Button>
            </div>
          </DetachedSheet.Content>
        </DetachedSheet.View>
      </DetachedSheet.Portal>
    </DetachedSheet.Root>
  );
}