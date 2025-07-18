'use client';

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

interface EmailBlastCardProps {
  blast: EmailBlast;
  onClick: (blast: EmailBlast) => void;
}

export default function EmailBlastCard({ blast, onClick }: EmailBlastCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  return (
    <div
      className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors cursor-pointer"
      onClick={() => onClick(blast)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            {blast.subject}
          </h3>
          <p className="text-sm text-gray-500">
            To: {blast.recipients} ({blast.recipientCount} recipients)
          </p>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
            blast.status
          )}`}
        >
          {blast.status}
        </span>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          {blast.status === 'scheduled' && blast.scheduled_for ? (
            <>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Scheduled for: {formatDate(blast.scheduled_for)}
              </span>
            </>
          ) : (
            <>Created: {formatDate(blast.created_at)}</>
          )}
        </span>
        <span className="text-xs">ID: {blast.id.substring(0, 8)}...</span>
      </div>

      {/* Delivery Stats */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-xs text-gray-600">
            {blast.delivered} delivered
          </span>
        </div>
        {blast.failed > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-xs text-gray-600">
              {blast.failed} failed
            </span>
          </div>
        )}
        {blast.pending > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-xs text-gray-600">
              {blast.pending} pending
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
