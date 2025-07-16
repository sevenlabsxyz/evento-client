"use client";

import { Globe, Lock } from "lucide-react";
import { DetachedSheet } from "@/components/ui/detached-sheet";

interface EventVisibilitySheetProps {
  isOpen: boolean;
  onClose: () => void;
  onVisibilitySelect: (visibility: "public" | "private") => void;
  currentVisibility: "public" | "private";
}

export default function EventVisibilitySheet({
  isOpen,
  onClose,
  onVisibilitySelect,
  currentVisibility,
}: EventVisibilitySheetProps) {
  const handleVisibilitySelect = (visibility: "public" | "private") => {
    onVisibilitySelect(visibility);
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

              {/* Header */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-center">
                  Event Visibility
                </h2>
              </div>

              {/* Visibility Options */}
              <div className="space-y-3">
                {/* Public Option */}
                <button
                  onClick={() => handleVisibilitySelect("public")}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    currentVisibility === "public"
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        currentVisibility === "public"
                          ? "bg-red-500 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <Globe className="h-5 w-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3
                        className={`font-semibold mb-1 ${
                          currentVisibility === "public"
                            ? "text-red-900"
                            : "text-gray-900"
                        }`}
                      >
                        Public
                      </h3>
                      <p
                        className={`text-sm ${
                          currentVisibility === "public"
                            ? "text-red-700"
                            : "text-gray-600"
                        }`}
                      >
                        Anyone can find and join this event
                      </p>
                    </div>
                    {currentVisibility === "public" && (
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                </button>

                {/* Private Option */}
                <button
                  onClick={() => handleVisibilitySelect("private")}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    currentVisibility === "private"
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        currentVisibility === "private"
                          ? "bg-red-500 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <Lock className="h-5 w-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3
                        className={`font-semibold mb-1 ${
                          currentVisibility === "private"
                            ? "text-red-900"
                            : "text-gray-900"
                        }`}
                      >
                        Private
                      </h3>
                      <p
                        className={`text-sm ${
                          currentVisibility === "private"
                            ? "text-red-700"
                            : "text-gray-600"
                        }`}
                      >
                        Only people with the link can join
                      </p>
                    </div>
                    {currentVisibility === "private" && (
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </DetachedSheet.Content>
        </DetachedSheet.View>
      </DetachedSheet.Portal>
    </DetachedSheet.Root>
  );
}