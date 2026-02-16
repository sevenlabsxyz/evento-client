'use client';

import { CircledIconButton } from '@/components/circled-icon-button';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { InviteItem, UserDetails } from '@/lib/types/api';
import { toast } from '@/lib/utils/toast';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import CsvImportSheet from './csv-import-sheet';
import Step1SearchUsers from './invite-users-step1';
import Step2SendInvites from './invite-users-step2';

interface InviteUsersSheetProps {
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function InviteUsersSheet({ eventId, isOpen, onClose }: InviteUsersSheetProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [searchText, setSearchText] = useState('');
  const [message, setMessage] = useState('');

  // Selected invite targets are emails. Also track selected users for display.
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [selectedUsers, setSelectedUsers] = useState<UserDetails[]>([]);
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);

  // Handle CSV import
  const handleCsvImport = (emails: string[]) => {
    const newEmails = new Set(selectedEmails);
    emails.forEach((email) => newEmails.add(email));
    setSelectedEmails(newEmails);
    toast.success(`Imported ${emails.length} email${emails.length !== 1 ? 's' : ''} from CSV`);
    setIsCsvImportOpen(false);
  };

  // CSV import
  const handleCSVClick = () => setIsCsvImportOpen(true);

  // Toggle user selection
  const toggleUser = (u: InviteItem) => {
    // Handle email invites differently
    if ('isEmailInvite' in u && u.isEmailInvite) {
      const email = u.email;
      setSelectedEmails((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(email)) {
          newSet.delete(email);
        } else {
          newSet.add(email);
        }
        return newSet;
      });
      return;
    }

    // Handle user invites - no email access from search results
    const userDetails = u as UserDetails;
    setSelectedUsers((prev) => {
      const exists = prev.find((p) => p.id === userDetails.id);
      if (exists) return prev.filter((p) => p.id !== userDetails.id);
      return [...prev, userDetails];
    });
  };

  // Remove handlers for Step 2 review
  const handleRemoveEmail = (email: string) => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      next.delete(email);
      return next;
    });
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  // Reset state
  const resetState = () => {
    setStep(1);
    setSearchText('');
    setMessage('');
    setSelectedEmails(new Set());
    setSelectedUsers([]);
  };

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      resetState();
      setIsCsvImportOpen(false);
    }
  }, [isOpen]);

  // Dynamic title and header based on step
  const title = step === 1 ? 'Invite Guests' : 'Add Note';
  const headerLeft =
    step === 2 ? (
      <CircledIconButton icon={ArrowLeft} onClick={() => setStep(1)} className='bg-white' />
    ) : undefined;

  return (
    <>
      <CsvImportSheet
        isOpen={isCsvImportOpen}
        onClose={() => setIsCsvImportOpen(false)}
        onImport={handleCsvImport}
      />
      <MasterScrollableSheet
        title={title}
        open={isOpen}
        onOpenChange={(open) => !open && onClose()}
        headerLeft={headerLeft}
        contentClassName='pb-0'
      >
        {step === 1 ? (
          <Step1SearchUsers
            eventId={eventId}
            searchText={searchText}
            setSearchText={setSearchText}
            selectedEmails={selectedEmails}
            selectedUsers={selectedUsers}
            toggleUser={toggleUser}
            onCSVClick={handleCSVClick}
            onNext={() => setStep(2)}
          />
        ) : (
          <Step2SendInvites
            eventId={eventId}
            selectedEmails={selectedEmails}
            selectedUsers={selectedUsers}
            message={message}
            setMessage={setMessage}
            onBack={() => setStep(1)}
            onClose={onClose}
            onReset={resetState}
            onRemoveEmail={handleRemoveEmail}
            onRemoveUser={handleRemoveUser}
          />
        )}
      </MasterScrollableSheet>
    </>
  );
}
