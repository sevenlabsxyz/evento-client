"use client";

import { BitcoinSVGIcon } from "@/components/icons/bitcoin";
import { Button } from "@/components/ui/button";
import { DetachedSheet } from "@/components/ui/detached-sheet";
import { UserAvatar } from "@/components/ui/user-avatar";
import { toast } from "@/lib/utils/toast";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Loader2, Zap } from "lucide-react";
import { useState } from "react";

interface TipSheetProps {
  isOpen: boolean;
  onClose: () => void;
  lightningAddress: string;
  recipientName: string;
  recipientUsername: string;
  recipientImage?: string;
  recipientVerified?: boolean;
}

export default function TipSheet({
  isOpen,
  onClose,
  lightningAddress,
  recipientName,
  recipientUsername,
  recipientImage,
  recipientVerified,
}: TipSheetProps) {
  const [amount, setAmount] = useState("");
  const [view, setView] = useState<"amount" | "confirm">("amount");
  const [isLoading, setIsLoading] = useState(false);
  const [invoice, setInvoice] = useState<string | null>(null);

  const handleNumberPress = (num: string) => {
    if (amount.length >= 7) return; // Max 9,999,999 sats
    if (amount === "0" && num === "0") return; // Prevent multiple leading zeros
    if (amount === "0") {
      setAmount(num);
    } else {
      setAmount(amount + num);
    }
  };

  const handleBackspace = () => {
    if (amount.length > 0) {
      setAmount(amount.slice(0, -1));
    }
  };

  const handleQuickAmount = (sats: number) => {
    setAmount(sats.toString());
  };

  const handleNext = () => {
    if (!amount || amount === "0") {
      toast.error("Please enter an amount");
      return;
    }
    setView("confirm");
  };

  const handleBack = () => {
    setView("amount");
  };

  const handlePay = async () => {
    try {
      setIsLoading(true);

      // Fetch Lightning invoice from API
      const response = await fetch("/api/v1/lightning/invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lightningAddress,
          amountSats: parseInt(amount),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch invoice");
      }

      const data = await response.json();

      if (!data.invoice) {
        throw new Error("No invoice received");
      }

      setInvoice(data.invoice);

      // Open lightning wallet with invoice
      const lightningUrl = `lightning:${data.invoice}`;
      window.open(lightningUrl, "_blank");

      // Close sheet after opening wallet
      setTimeout(() => {
        onClose();
        // Reset state
        setAmount("");
        setView("amount");
        setInvoice(null);
      }, 1000);

      toast.success("Opening your Lightning wallet...");
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to create payment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset state after close animation
    setTimeout(() => {
      setAmount("");
      setView("amount");
      setInvoice(null);
    }, 300);
  };

  const formatAmount = (sats: string) => {
    if (!sats) return "0";
    return parseInt(sats).toLocaleString();
  };

  return (
    <DetachedSheet.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && handleClose()}
    >
      <DetachedSheet.Portal>
        <DetachedSheet.View>
          <DetachedSheet.Backdrop />
          <DetachedSheet.Content className="overflow-hidden">
            <div className="relative h-full">
              {/* Handle */}
              <div className="flex justify-center pt-2">
                <DetachedSheet.Handle />
              </div>

              <AnimatePresence mode="wait">
                {view === "amount" ? (
                  <motion.div
                    key="amount"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="p-6"
                  >
                    {/* Title */}
                    <p className="mb-4 text-center text-sm text-gray-500">
                      Send Lightning Tip to{" "}
                      <strong>@{recipientUsername}</strong>
                    </p>

                    {/* Amount Display */}
                    <div className="mb-4 rounded-xl p-4">
                      <div className="flex items-center justify-center gap-2">
                        <BitcoinSVGIcon className="h-6 w-6" />
                        <div className="text-4xl font-bold text-gray-900">
                          {formatAmount(amount) || "0"}
                        </div>
                        <span className="text-sm text-gray-500">sats</span>
                      </div>
                    </div>

                    {/* Quick Amount Buttons */}
                    <div className="mb-4 grid grid-cols-3 gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleQuickAmount(100)}
                        className="text-xs"
                      >
                        100
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleQuickAmount(1000)}
                        className="text-xs"
                      >
                        1,000
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleQuickAmount(5000)}
                        className="text-xs"
                      >
                        5,000
                      </Button>
                    </div>

                    {/* Number Keypad */}
                    <div className="mb-6 grid grid-cols-3 gap-2">
                      {[7, 8, 9, 4, 5, 6, 1, 2, 3].map((num) => (
                        <Button
                          key={num}
                          variant="outline"
                          size="lg"
                          onClick={() => handleNumberPress(num.toString())}
                          className="h-14 text-lg font-semibold"
                        >
                          {num}
                        </Button>
                      ))}
                      <div />
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => handleNumberPress("0")}
                        className="h-14 text-lg font-semibold"
                      >
                        0
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={handleBackspace}
                        className="h-14 text-lg border-none text-muted-foreground"
                      >
                        ⌫
                      </Button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={handleNext}
                        disabled={!amount || amount === "0"}
                        className="flex-1 py-4 text-base bg-red-600 text-white hover:bg-red-700"
                      >
                        Next
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={handleClose}
                        className="flex-1 border border-gray-100"
                      >
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="p-6"
                  >
                    {/* Recipient Info */}
                    <div className="mb-6 flex flex-col items-center">
                      <UserAvatar
                        user={{
                          name: recipientName,
                          username: recipientUsername,
                          image: recipientImage,
                          isVerified: recipientVerified,
                        }}
                        size="md"
                        className="mb-3"
                      />
                      <h3 className="font-semibold text-gray-900">
                        {recipientName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        @{recipientUsername}
                      </p>
                    </div>

                    {/* Amount Summary */}
                    <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4">
                      <div className="text-center">
                        <p className="mb-1 text-base text-gray-600">
                          You're sending
                        </p>
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-2xl font-bold text-gray-900">
                            {formatAmount(amount)}
                          </span>
                          <span className="text-sm text-gray-600">sats</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Details */}
                    <div className="mb-6 space-y-2 rounded-lg bg-gray-50 p-3 border border-gray-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 text-xs">
                          Lightning Address:
                        </span>
                        <span className="font-semibold text-gray-700">
                          {lightningAddress.length > 25
                            ? `${lightningAddress.slice(0, 25)}...`
                            : lightningAddress}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3">
                      <Button
                        onClick={handlePay}
                        disabled={isLoading}
                        className="w-full bg-red-600 py-6 text-base text-white hover:bg-red-700"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Invoice...
                          </>
                        ) : (
                          <>Pay with Lightning</>
                        )}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={handleBack}
                        disabled={isLoading}
                        className="w-full border border-gray-200 mb-6"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </DetachedSheet.Content>
        </DetachedSheet.View>
      </DetachedSheet.Portal>
    </DetachedSheet.Root>
  );
}
