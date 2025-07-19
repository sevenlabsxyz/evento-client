"use client";

import { DetachedSheet } from "@/components/ui/detached-sheet";
import { Button } from "@/components/ui/button";
import { Zap, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "@/lib/utils/toast";

interface LightningSheetProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
}

export default function LightningSheet({ isOpen, onClose, address }: LightningSheetProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success("Lightning address copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy address");
    }
  };

  const handleOpenLightning = () => {
    const lightningUrl = `lightning:${address}`;
    window.open(lightningUrl, '_blank');
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
                Lightning Address
              </h2>

              {/* Lightning Info */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Zap className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Bitcoin Lightning</h3>
                  <p className="text-sm text-gray-500">Lightning Network address</p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  This is a Bitcoin Lightning Network address. You can use it to send instant, low-fee Bitcoin payments.
                </p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700 break-all font-mono">{address}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <Button onClick={handleOpenLightning} className="w-full bg-red-600 hover:bg-red-700 text-white">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in Wallet
                </Button>
                <Button onClick={handleCopyAddress} className="w-full" variant="outline">
                  <Copy className="h-4 w-4 mr-2" />
                  {copied ? "Copied!" : "Copy Address"}
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