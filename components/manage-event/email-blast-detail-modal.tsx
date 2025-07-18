'use client';

import { X, Mail, Users, CheckCircle, XCircle, AlertCircle, Clock, Copy, CalendarClock } from 'lucide-react';

interface EmailBlast {
  id: string;
  subject: string;
  recipients: string;
  recipientCount: number;
  status: string;
  created_at: string;
  scheduled_for?: string | null;
  delivered: number;
  failed: number;
  pending: number;
  message: string;
}

interface EmailBlastDetailModalProps {
  blast: EmailBlast;
  isOpen: boolean;
  onClose: () => void;
}

export default function EmailBlastDetailModal({
  blast,
  isOpen,
  onClose
}: EmailBlastDetailModalProps) {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'sent':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
      case 'sending':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'scheduled':
        return <CalendarClock className="w-5 h-5 text-blue-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'sent':
        return 'text-green-600 bg-green-100';
      case 'pending':
      case 'sending':
        return 'text-yellow-600 bg-yellow-100';
      case 'scheduled':
        return 'text-blue-600 bg-blue-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(blast.id);
    // TODO: Show toast notification
  };

  const deliveryRate = blast.recipientCount > 0 ? 
    Math.round((blast.delivered / blast.recipientCount) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Mail className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900">Email Blast Details</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Status and Basic Info */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              {getStatusIcon(blast.status)}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(blast.status)}`}>
                {blast.status.charAt(0).toUpperCase() + blast.status.slice(1)}
              </span>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{blast.subject}</h3>
            
            {/* Display scheduling information if scheduled */}
            {blast.status === 'scheduled' && blast.scheduled_for ? (
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <CalendarClock className="w-4 h-4" />
                <p className="text-sm font-medium">Scheduled to send at: {formatDate(blast.scheduled_for)}</p>
              </div>
            ) : null}
            
            <p className="text-gray-600 mb-4">Created: {formatDate(blast.created_at)}</p>
            
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>ID: {blast.id}</span>
              <button
                onClick={handleCopyId}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Copy ID"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Recipients Info */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Recipients
            </h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Target:</strong> {blast.recipients}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Total Recipients:</strong> {blast.recipientCount}
              </p>
            </div>
          </div>

          {/* Delivery Statistics */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Delivery Statistics</h4>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Delivered</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{blast.delivered}</p>
              </div>
              
              {blast.failed > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-900">Failed</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">{blast.failed}</p>
                </div>
              )}
              
              {blast.pending > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-900">Pending</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-600">{blast.pending}</p>
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Delivery Rate</span>
                <span className="text-sm font-bold text-gray-900">{deliveryRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${deliveryRate}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Message Preview */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Message</h4>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div 
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: blast.message }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
