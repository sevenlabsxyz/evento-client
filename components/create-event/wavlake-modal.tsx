"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface WavlakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (url: string) => void;
}

export default function WavlakeModal({
  isOpen,
  onClose,
  onSave,
}: WavlakeModalProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const validateUrl = (inputUrl: string) => {
    try {
      const urlObj = new URL(inputUrl);
      return (
        urlObj.hostname === "wavlake.com" ||
        urlObj.hostname === "www.wavlake.com"
      );
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
      setError("Please enter a valid Wavlake URL");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl w-full md:max-w-sm mx-2 md:mx-4 shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Add Wavlake Playlist</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wavlake URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError("");
              }}
              placeholder="https://wavlake.com/..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            <p className="mt-2 text-xs text-gray-500">
              Paste a link to any Wavlake playlist
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
            className="flex-1 py-3 px-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 font-medium"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
