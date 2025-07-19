"use client";

import { AlertTriangle, ArrowRight, X } from "lucide-react";
import { useState } from "react";

interface CancelEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (sendEmail: boolean) => void;
  eventTitle?: string;
}

export default function CancelEventModal({
  isOpen,
  onClose,
  onConfirm,
  eventTitle,
}: CancelEventModalProps) {
  const [sendEmail, setSendEmail] = useState(true);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(sendEmail);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-md rounded-2xl bg-white">
        {/* Header */}
        <div className="flex justify-end p-4 pb-2">
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-gray-100"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {/* Warning Icon */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>

          {/* Title */}
          <h2 className="mb-4 text-center text-2xl font-bold text-gray-900">
            Cancel Event
          </h2>

          {/* Description */}
          <p className="mb-2 text-center text-gray-600">
            We will send a message to guests notifying them that the event has
            been cancelled.
          </p>

          {/* Warning Text */}
          <p className="mb-8 text-center font-medium text-red-600">
            This action can't be reverted.
          </p>

          {/* Email Notification Toggle */}
          <div className="mb-6 rounded-2xl bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="mb-1 font-medium text-gray-900">
                  Notify attendees via email
                </h3>
                <p className="text-sm text-gray-500">
                  Send cancellation notification to all registered guests
                </p>
              </div>
              <button
                onClick={() => setSendEmail(!sendEmail)}
                className={`ml-4 h-6 w-12 rounded-full transition-colors ${
                  sendEmail ? "bg-red-500" : "bg-gray-300"
                }`}
              >
                <div
                  className={`h-5 w-5 rounded-full bg-white transition-transform ${
                    sendEmail ? "translate-x-6" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Cancel Event Button */}
          <button
            onClick={handleConfirm}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-red-500 px-6 py-4 font-semibold text-white transition-colors hover:bg-red-600"
          >
            <ArrowRight className="h-5 w-5" />
            Cancel Event
          </button>
        </div>
      </div>
    </div>
  );
}
