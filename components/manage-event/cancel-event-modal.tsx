'use client';

import { useState } from 'react';
import { X, AlertTriangle, ArrowRight } from 'lucide-react';

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
  eventTitle 
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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex justify-end p-4 pb-2">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {/* Warning Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
            Cancel Event
          </h2>

          {/* Description */}
          <p className="text-gray-600 text-center mb-2">
            We will send a message to guests notifying them that the event has been cancelled.
          </p>

          {/* Warning Text */}
          <p className="text-red-600 text-center font-medium mb-8">
            This action can't be reverted.
          </p>

          {/* Email Notification Toggle */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">
                  Notify attendees via email
                </h3>
                <p className="text-sm text-gray-500">
                  Send cancellation notification to all registered guests
                </p>
              </div>
              <button
                onClick={() => setSendEmail(!sendEmail)}
                className={`w-12 h-6 rounded-full transition-colors ml-4 ${
                  sendEmail ? 'bg-orange-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    sendEmail ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Cancel Event Button */}
          <button
            onClick={handleConfirm}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-4 px-6 rounded-2xl font-semibold flex items-center justify-center gap-3 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            Cancel Event
          </button>
        </div>
      </div>
    </div>
  );
}