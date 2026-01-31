'use client';

import { CircledIconButton } from '@/components/circled-icon-button';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { UserDetails } from '@/lib/types/api';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import InviteCohostsStep1 from './invite-cohosts-step1';
import InviteCohostsStep2 from './invite-cohosts-step2';

interface ManageCohostsSheetProps {
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ManageCohostsSheet({ eventId, isOpen, onClose }: ManageCohostsSheetProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [searchText, setSearchText] = useState('');
  const [message, setMessage] = useState('');

  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [selectedUsers, setSelectedUsers] = useState<UserDetails[]>([]);

  const toggleUser = (u: UserDetails | { email: string; isEmailInvite: true }) => {
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

    const userDetails = u as UserDetails;
    setSelectedUsers((prev) => {
      const exists = prev.find((p) => p.id === userDetails.id);
      if (exists) return prev.filter((p) => p.id !== userDetails.id);
      return [...prev, userDetails];
    });
  };

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

  const resetState = () => {
    setStep(1);
    setSearchText('');
    setMessage('');
    setSelectedEmails(new Set());
    setSelectedUsers([]);
  };

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  const title = step === 1 ? 'Invite Cohosts' : 'Add Note';
  const headerLeft =
    step === 2 ? (
      <CircledIconButton icon={ArrowLeft} onClick={() => setStep(1)} className='bg-white' />
    ) : undefined;

  return (
    <MasterScrollableSheet
      title={title}
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      headerLeft={headerLeft}
      contentClassName='pb-0'
    >
      {step === 1 ? (
        <InviteCohostsStep1
          eventId={eventId}
          searchText={searchText}
          setSearchText={setSearchText}
          selectedEmails={selectedEmails}
          selectedUsers={selectedUsers}
          toggleUser={toggleUser}
          onNext={() => setStep(2)}
        />
      ) : (
        <InviteCohostsStep2
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
  );
}
