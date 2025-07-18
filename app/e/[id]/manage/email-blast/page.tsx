'use client';

import EmailBlastCard from '@/components/manage-event/email-blast-card';
import EmailBlastDetailModal from '@/components/manage-event/email-blast-detail-modal';
import EmailBlastSheet from '@/components/manage-event/email-blast-sheet';
import {
  transformEmailBlastForUI,
  useEmailBlasts,
} from '@/lib/hooks/useEmailBlasts';
import { useTopBar } from '@/lib/stores/topbar-store';
import { ArrowLeft, Loader2, Mail, Plus } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EmailBlastPage() {
  const { setTopBar } = useTopBar();
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const [showEmailBlastSheet, setShowEmailBlastSheet] = useState(false);
  const [selectedBlast, setSelectedBlast] = useState<any | null>(null);

  // Fetch email blasts data
  const { data: emailBlasts = [], isLoading, error } = useEmailBlasts(eventId);

  // Transform API data for UI
  const transformedBlasts = (emailBlasts || []).map(transformEmailBlastForUI);

  // Set TopBar content
  useEffect(() => {
    setTopBar({
      title: 'Email Blast',
      subtitle: 'Send updates to your guests',
    });

    return () => {
      setTopBar({ rightContent: null });
    };
  }, [setTopBar]);

  const handleCreateBlast = () => {
    setShowEmailBlastSheet(true);
  };

  const handleBlastClick = (blast: any) => {
    setSelectedBlast(blast);
  };

  return (
    <div className="md:max-w-sm max-w-full mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold">Email Blast</h1>
        </div>
        <button
          onClick={handleCreateBlast}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">New Blast</span>
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Email Blast History */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Email Blasts
          </h2>

          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-red-500 mx-auto mb-4" />
              <p className="text-gray-600">Loading email blasts...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Failed to load email blasts
              </h3>
              <p className="text-gray-500 mb-6">
                There was an error loading your email blasts. Please try again.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : transformedBlasts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No email blasts yet
              </h3>
              <p className="text-gray-500 mb-6">
                Send your first email blast to keep your guests informed
              </p>
              <button
                onClick={handleCreateBlast}
                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Create Email Blast
              </button>
            </div>
          ) : (
            transformedBlasts.map((blast: any) => (
              <EmailBlastCard
                key={blast.id}
                blast={blast}
                onClick={handleBlastClick}
              />
            ))
          )}
        </div>
      </div>

      {/* Email Blast Sheet */}
      <EmailBlastSheet
        isOpen={showEmailBlastSheet}
        onClose={() => setShowEmailBlastSheet(false)}
        eventId={eventId}
      />

      {selectedBlast && (
        <EmailBlastDetailModal
          blast={selectedBlast}
          isOpen={!!selectedBlast}
          onClose={() => setSelectedBlast(null)}
        />
      )}
    </div>
  );
}
