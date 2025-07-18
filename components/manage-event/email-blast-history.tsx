'use client';

import { Mail, Loader2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import EmailBlastCard from './email-blast-card';
import EmailBlastDetailModal from './email-blast-detail-modal';
import {
  useEmailBlasts,
  transformEmailBlastForUI,
} from '@/lib/hooks/useEmailBlasts';

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
      <div className="EmailBlastHistory-loading">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <p className="text-sm text-gray-500 mt-2">
          Loading email blast history...
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="EmailBlastHistory-error">
        <AlertCircle className="w-6 h-6 text-red-400" />
        <p className="text-sm text-red-600 mt-2">
          Failed to load email blast history
        </p>
        <p className="text-xs text-gray-500 mt-1">{error.message}</p>
      </div>
    );
  }

  // Empty state
  if (transformedBlasts.length === 0) {
    return (
      <div className="EmailBlastHistory-empty">
        <div className="EmailBlastHistory-emptyIcon">
          <Mail className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="EmailBlastHistory-emptyTitle">No email blasts yet</h3>
        <p className="EmailBlastHistory-emptyDescription">
          Your email blast history will appear here once you send your first
          blast.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {transformedBlasts.map((blast: any) => (
          <EmailBlastCard
            key={blast.id}
            blast={blast}
            onClick={setSelectedBlast}
          />
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
