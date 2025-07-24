'use client';

import { transformEmailBlastForUI, useEmailBlasts } from '@/lib/hooks/useEmailBlasts';
import { AlertCircle, Loader2, Mail } from 'lucide-react';
import { useState } from 'react';
import EmailBlastCard from './email-blast-card';
import EmailBlastDetailModal from './email-blast-detail-modal';

interface EmailBlastHistoryProps {
  eventId: string;
}

export default function EmailBlastHistory({ eventId }: EmailBlastHistoryProps) {
  const [selectedBlast, setSelectedBlast] = useState<any | null>(null);

  // Fetch email blasts data
  const { data: emailBlasts = [], isLoading, error } = useEmailBlasts(eventId);

  // Transform API data for UI
  const transformedBlasts = (emailBlasts || []).map(transformEmailBlastForUI);

  // Loading state
  if (isLoading) {
    return (
      <div className='EmailBlastHistory-loading'>
        <Loader2 className='h-6 w-6 animate-spin text-gray-400' />
        <p className='mt-2 text-sm text-gray-500'>Loading email blast history...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className='EmailBlastHistory-error'>
        <AlertCircle className='h-6 w-6 text-red-400' />
        <p className='mt-2 text-sm text-red-600'>Failed to load email blast history</p>
        <p className='mt-1 text-xs text-gray-500'>{error.message}</p>
      </div>
    );
  }

  // Empty state
  if (transformedBlasts.length === 0) {
    return (
      <div className='EmailBlastHistory-empty'>
        <div className='EmailBlastHistory-emptyIcon'>
          <Mail className='h-8 w-8 text-gray-400' />
        </div>
        <h3 className='EmailBlastHistory-emptyTitle'>No email blasts yet</h3>
        <p className='EmailBlastHistory-emptyDescription'>
          Your email blast history will appear here once you send your first blast.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className='space-y-3'>
        {transformedBlasts.map((blast: any) => (
          <EmailBlastCard key={blast.id} blast={blast} onClick={setSelectedBlast} />
        ))}
      </div>

      {/* Detail Modal */}
      {selectedBlast && (
        <EmailBlastDetailModal
          blast={selectedBlast}
          isOpen={!!selectedBlast}
          onClose={() => setSelectedBlast(null)}
        />
      )}
    </>
  );
}
