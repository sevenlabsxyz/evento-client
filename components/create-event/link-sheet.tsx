"use client";

import { useState } from "react";
import { SheetWithDetent } from "@/components/ui/sheet-with-detent";

interface LinkSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (url: string) => void;
}

export default function LinkSheet({ 
  isOpen, 
  onClose, 
  onSave 
}: LinkSheetProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const validateUrl = (inputUrl: string) => {
    try {
      new URL(inputUrl);
      return true;
    } catch {
      return false;
    }
  };

  const handleSave = () => {
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    if (!validateUrl(url)) {
      setError("Please enter a valid URL");
      return;
    }

    onSave(url);
    setUrl("");
    setError("");
    onClose();
  };

  const handleClose = () => {
    setUrl("");
    setError("");
    onClose();
  };

  return (
    <SheetWithDetent.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && handleClose()}
    >
      <SheetWithDetent.Portal>
        <SheetWithDetent.View>
          <SheetWithDetent.Backdrop />
          <SheetWithDetent.Content>
            <div className="p-6">
              {/* Handle */}
              <div className="flex justify-center mb-4">
                <SheetWithDetent.Handle />
              </div>

              {/* Header */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-center">
                  Add Link
                </h2>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setError("");
                    }}
                    placeholder="https://example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    autoFocus
                  />
                  {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
                  <p className="mt-2 text-xs text-gray-500">
                    Enter any valid web URL
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl hover:bg-red-600 font-medium"
                >
                  Save
                </button>
              </div>
            </div>
          </SheetWithDetent.Content>
        </SheetWithDetent.View>
      </SheetWithDetent.Portal>
    </SheetWithDetent.Root>
  );
}