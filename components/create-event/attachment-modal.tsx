"use client";

import { useState } from "react";
import { X, Music, Camera, File, Link, Headphones } from "lucide-react";

interface AttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (
    type: "spotify" | "wavlake" | "photo" | "file" | "link"
  ) => void;
}

export default function AttachmentModal({
  isOpen,
  onClose,
  onSelectType,
}: AttachmentModalProps) {
  if (!isOpen) return null;

  const options = [
    {
      type: "spotify" as const,
      label: "Add Spotify",
      icon: <Music className="w-6 h-6" />,
      description: "Add a Spotify playlist",
    },
    {
      type: "wavlake" as const,
      label: "Add Wavlake",
      icon: <Headphones className="w-6 h-6" />,
      description: "Add a Wavlake playlist",
    },
    {
      type: "photo" as const,
      label: "Add Photo",
      icon: <Camera className="w-6 h-6" />,
      description: "Select from your photos",
    },
    {
      type: "file" as const,
      label: "Add File",
      icon: <File className="w-6 h-6" />,
      description: "Upload a document",
    },
    {
      type: "link" as const,
      label: "Add Link",
      icon: <Link className="w-6 h-6" />,
      description: "Add any web link",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl w-full md:max-w-sm mx-2 md:mx-4 shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Add Attachment</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {options.map((option) => (
            <button
              key={option.type}
              onClick={() => {
                onSelectType(option.type);
                onClose();
              }}
              className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl flex items-center gap-4 text-left transition-colors"
            >
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-600">
                {option.icon}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{option.label}</p>
                <p className="text-sm text-gray-500">{option.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
