'use client';

import { EmailBlast } from '@/lib/types/api';

type EmailBlastCardData = EmailBlast;

interface EmailBlastCardProps {
  blast: EmailBlastCardData;
  onClick: (blast: EmailBlastCardData) => void;
}

export default function EmailBlastCard({ blast, onClick }: EmailBlastCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'sent':
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
      case 'sending':
        return 'text-yellow-600 bg-yellow-100';
      case 'scheduled':
        return 'text-blue-600 bg-blue-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'cancelled':
        return 'text-gray-700 bg-gray-200';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Scheduled';
      case 'sending':
        return 'Sending';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'cancelled':
        return 'Cancelled';
      case 'draft':
        return 'Draft';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <div
      className='cursor-pointer rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-gray-300'
      onClick={() => onClick(blast)}
    >
      <div className='mb-3 flex items-start justify-between'>
        <div className='flex-1'>
          <h3 className='mb-1 font-semibold text-gray-900'>{blast.subject || 'No subject'}</h3>
          <p className='text-sm text-gray-500'>To: {blast.recipientCount ?? 0} recipients</p>
        </div>
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(blast.status)}`}
        >
          {getStatusLabel(blast.status)}
        </span>
      </div>

      <div className='text-sm text-gray-500'>
        <div>
          {blast.status === 'scheduled' && blast.scheduled_for ? (
            <>
              <span className='flex items-center'>
                <svg
                  className='mr-1 h-4 w-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
                Scheduled for: {formatDate(blast.scheduled_for)}
              </span>
            </>
          ) : (
            <>Created: {formatDate(blast.created_at)}</>
          )}
        </div>
        <div className='mt-1 text-xs'>ID: {blast.id.substring(0, 8)}...</div>
      </div>

      {/* Delivery Stats */}
      <div className='mt-3 flex items-center gap-4 border-t border-gray-100 pt-3'>
        <div className='flex items-center gap-1'>
          <div className='h-2 w-2 rounded-full bg-green-500'></div>
          <span className='text-xs text-gray-600'>{blast.delivered ?? 0} delivered</span>
        </div>
        {(blast.failed ?? 0) > 0 && (
          <div className='flex items-center gap-1'>
            <div className='h-2 w-2 rounded-full bg-red-500'></div>
            <span className='text-xs text-gray-600'>{blast.failed ?? 0} failed</span>
          </div>
        )}
        {(blast.pending ?? 0) > 0 && (
          <div className='flex items-center gap-1'>
            <div className='h-2 w-2 rounded-full bg-yellow-500'></div>
            <span className='text-xs text-gray-600'>{blast.pending ?? 0} pending</span>
          </div>
        )}
      </div>
    </div>
  );
}
