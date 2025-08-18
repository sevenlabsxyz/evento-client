'use client';

import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { InviteItem, UserDetails } from '@/lib/types/api';
import { toast } from '@/lib/utils/toast';
import { VisuallyHidden } from '@silk-hq/components';
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

  const removeEmail = (email: string) => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      next.delete(email);
      return next;
    });
    setSelectedUsers((prev) => prev.filter((u) => (u.email || '').trim() !== email));
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

  return (
    <>
      <CsvImportSheet
        isOpen={isCsvImportOpen}
        onClose={() => setIsCsvImportOpen(false)}
        onImport={handleCsvImport}
      />
      <SheetWithDetentFull.Root presented={isOpen} onPresentedChange={(p) => !p && onClose()}>
        <SheetWithDetentFull.Portal>
          <SheetWithDetentFull.View>
            <SheetWithDetentFull.Backdrop />
            <SheetWithDetentFull.Content className='flex flex-col rounded-t-2xl bg-white'>
              <div className='sticky top-0 z-10 bg-white px-4 pt-3'>
                <div className='mb-3 flex justify-center'>
                  <SheetWithDetentFull.Handle />
                </div>
                <VisuallyHidden.Root asChild>
                  <SheetWithDetentFull.Title className='sr-only'>
                    Invite Guests
                  </SheetWithDetentFull.Title>
                </VisuallyHidden.Root>
              </div>

              {step === 1 ? (
                <Step1SearchUsers
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
                />
              )}
            </SheetWithDetentFull.Content>
          </SheetWithDetentFull.View>
        </SheetWithDetentFull.Portal>
      </SheetWithDetentFull.Root>
    </>
  );
}
