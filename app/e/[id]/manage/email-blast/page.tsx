'use client';

import EmailBlastCard from '@/components/manage-event/email-blast-card';
import EmailBlastDetailModal from '@/components/manage-event/email-blast-detail-modal';
import EmailBlastSheet from '@/components/manage-event/email-blast-sheet';
import { transformEmailBlastForUI, useEmailBlasts } from '@/lib/hooks/use-email-blasts';
import { useTopBar } from '@/lib/stores/topbar-store';
import { Loader2, Mail, Plus } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EmailBlastPage() {
  const { setTopBar } = useTopBar();
  const params = useParams();
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
      buttons: [
        {
          icon: Plus,
          onClick: handleCreateBlast,
          label: 'Create Blast',
          id: 'create-blast',
        },
      ],
      leftMode: 'back',
    });

    return () => {
      setTopBar({ leftMode: 'menu', buttons: [] });
    };
  }, [setTopBar]);

  const handleCreateBlast = () => {
    setShowEmailBlastSheet(true);
  };

  const handleBlastClick = (blast: any) => {
    setSelectedBlast(blast);
  };

  return (
    <div className='mx-auto mt-2 min-h-screen max-w-full bg-white md:max-w-sm'>
      {/* Content */}
      <div className='p-4'>
        {/* Email Blast History */}
        <div className='space-y-3'>
          <h2 className='mb-4 text-lg font-semibold text-gray-900'>Recent Email Blasts</h2>

          {isLoading ? (
            <div className='py-12 text-center'>
              <Loader2 className='mx-auto mb-4 h-8 w-8 animate-spin text-red-500' />
              <p className='text-gray-600'>Loading email blasts...</p>
            </div>
          ) : error ? (
            <div className='py-12 text-center'>
              <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100'>
                <Mail className='h-8 w-8 text-red-400' />
              </div>
              <h3 className='mb-2 text-lg font-medium text-gray-900'>
                Failed to load email blasts
              </h3>
              <p className='mb-6 text-gray-500'>
                There was an error loading your email blasts. Please try again.
              </p>
              <button
                onClick={() => window.location.reload()}
                className='rounded-lg bg-red-500 px-6 py-3 text-white transition-colors hover:bg-red-600'
              >
                Retry
              </button>
            </div>
          ) : transformedBlasts.length === 0 ? (
            <div className='py-12 text-center'>
              <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100'>
                <Mail className='h-8 w-8 text-gray-400' />
              </div>
              <h3 className='mb-2 text-lg font-medium text-gray-900'>No email blasts yet</h3>
              <p className='mb-6 text-gray-500'>
                Send your first email blast to keep your guests informed
              </p>
              <button
                onClick={handleCreateBlast}
                className='rounded-lg bg-red-500 px-6 py-3 text-white transition-colors hover:bg-red-600'
              >
                Create Email Blast
              </button>
            </div>
          ) : (
            transformedBlasts.map((blast: any) => (
              <EmailBlastCard key={blast.id} blast={blast} onClick={handleBlastClick} />
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
