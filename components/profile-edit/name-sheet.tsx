"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SheetWithDetentFull } from "@/components/ui/sheet-with-detent-full";
import { User, X } from "lucide-react";
import { useEffect, useState } from "react";

interface NameSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  currentName?: string;
}

export default function NameSheet({
  isOpen,
  onClose,
  onSave,
  currentName = "",
}: NameSheetProps) {
  const [name, setName] = useState(currentName);
  const [error, setError] = useState("");

  // Reset state when sheet opens
  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setError("");
    }
  }, [isOpen, currentName]);

  const handleSave = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Name is required");
      return;
    }

    if (trimmedName.length > 50) {
      setError("Name must be less than 50 characters");
      return;
    }

    onSave(trimmedName);
    onClose();
  };

  const handleCancel = () => {
    setName(currentName);
    onClose();
  };

  const canSave = name.trim() && name.trim() !== currentName;

  return (
    <SheetWithDetentFull.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && handleCancel()}
    >
      <SheetWithDetentFull.Portal>
        <SheetWithDetentFull.View>
          <SheetWithDetentFull.Backdrop />
          <SheetWithDetentFull.Content>
            {/* Header */}
            <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-4 pb-4 pt-4">
              <SheetWithDetentFull.Handle />
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Name</h2>
                <button
                  onClick={handleCancel}
                  className="rounded-full p-2 hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <SheetWithDetentFull.ScrollRoot asChild>
              <SheetWithDetentFull.ScrollView>
                <SheetWithDetentFull.ScrollContent className="p-6">
                  {/* Input with icon */}
                  <div className="relative mb-4">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setError("");
                      }}
                      placeholder="Your name"
                      className="pl-10"
                      autoFocus
                      maxLength={50}
                    />
                  </div>

                  {/* Error message */}
                  {error && (
                    <p className="mb-4 text-sm text-red-500">{error}</p>
                  )}

                  {/* Character count */}
                  <p className="mb-4 text-right text-sm text-gray-500">
                    {name.length}/50
                  </p>

                  {/* Info text */}
                  <p className="mb-6 text-sm text-gray-500">
                    Your display name is how you appear to others on Evento. Use
                    your real name or a nickname.
                  </p>

                  {/* Save/Cancel Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={handleSave}
                      className="flex-1 bg-red-500 text-white hover:bg-red-600"
                      disabled={!canSave}
                    >
                      Save
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </SheetWithDetentFull.ScrollContent>
              </SheetWithDetentFull.ScrollView>
            </SheetWithDetentFull.ScrollRoot>
          </SheetWithDetentFull.Content>
        </SheetWithDetentFull.View>
      </SheetWithDetentFull.Portal>
    </SheetWithDetentFull.Root>
  );
}
