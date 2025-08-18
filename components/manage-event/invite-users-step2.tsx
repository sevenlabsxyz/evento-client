'use client';

import { useSendEventInvites } from '@/lib/hooks/use-event-invites';
import { UserDetails } from '@/lib/types/api';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { UserAvatar } from '../ui/user-avatar';

interface Step2SendInvitesProps {
  eventId: string;
  selectedEmails: Set<string>;
  selectedUsers: UserDetails[];
  message: string;
  setMessage: (message: string) => void;
  onBack: () => void;
  onClose: () => void;
  onReset: () => void;
}

export default function Step2SendInvites({
  eventId,
  selectedEmails,
  selectedUsers,
  message,
  setMessage,
  onBack,
  onClose,
  onReset,
}: Step2SendInvitesProps) {
  const sendInvitesMutation = useSendEventInvites();
  const selectedCount = selectedEmails.size + selectedUsers.length;

  const handleSendInvites = async () => {
    try {
      // Build invites array with mixed email/user format
      const invites = [
        // Email-only invites
        ...Array.from(selectedEmails).map((email) => ({
          email,
          type: 'email' as const,
        })),
        // User invites (with full user data)
        ...selectedUsers.map((user) => ({
          id: user.id,
          username: user.username,
          name: user.name,
          verification_status: user.verification_status || 'not_verified',
          image: user.image || null,
        })),
      ];

      await sendInvitesMutation.mutateAsync({
        id: eventId,
        message: message.trim(),
        invites,
      });
      onClose();
      // reset state after successful send
      setTimeout(() => {
        onReset();
      }, 0);
    } catch (err) {
      // toast handled in hook
    }
  };

  return (
    <>
      {/* Header */}
      <div className='text-center'>
        <h2 className='text-xl font-semibold'>Add Note</h2>
        <p className='mt-1 text-sm text-gray-500'>Make it special for your guests!</p>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto'>
        <div className='px-4'>
          <div className='mb-6 mt-3 flex flex-col gap-3'>
            <textarea
              name='message'
              className='w-full rounded-lg border border-gray-200 p-4 text-sm outline-none focus:ring-2 focus:ring-red-500'
              rows={6}
              placeholder='Write a note to include with your invite (optional)'
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <p className='mt-1 text-xs italic text-gray-500'>
              This message is sent along with the details of your Event.
            </p>

            <div className='mt-3'>
              <h3 className='font-semibold text-gray-900'>
                Inviting {selectedCount} user{selectedCount === 1 ? '' : 's'}:
              </h3>
            </div>

            <div className='max-h-60 space-y-3 overflow-y-auto py-2'>
              {Array.from(selectedEmails).map((email) => (
                <div key={email} className='flex items-center gap-3'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gray-100'>
                    <span className='text-lg'>✉️</span>
                  </div>
                  <div>
                    <div className='font-semibold text-gray-900'>{email}</div>
                    <div className='text-sm text-gray-500'>Email invitation</div>
                  </div>
                  <div className='ml-auto flex items-center justify-center'>
                    <span className='flex h-5 w-5 items-center justify-center rounded-full border-2 border-black'>
                      <span className='h-2.5 w-2.5 rounded-full bg-black' />
                    </span>
                  </div>
                </div>
              ))}
              {selectedUsers.map((user) => (
                <div key={user.id} className='flex items-center gap-3'>
                  <UserAvatar
                    user={{
                      name: user.name,
                      username: user.username,
                      image: user.image,
                      verification_status: user.verification_status,
                    }}
                    height={40}
                    width={40}
                  />
                  <div>
                    <div className='font-semibold text-gray-900'>@{user.username}</div>
                    <div className='text-sm text-gray-500'>{user.name}</div>
                  </div>
                  <div className='ml-auto flex items-center justify-center'>
                    <span className='flex h-5 w-5 items-center justify-center rounded-full border-2 border-black'>
                      <span className='h-2.5 w-2.5 rounded-full bg-black' />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className='min-h-[12rem] border-t bg-white p-4'>
        <div className='space-y-3'>
          <button
            onClick={onBack}
            className='flex w-full items-center justify-center gap-2 rounded-xl border px-6 py-3 text-sm font-medium hover:bg-gray-50'
          >
            <ArrowLeft className='h-4 w-4' /> BACK
          </button>
          <button
            onClick={handleSendInvites}
            disabled={sendInvitesMutation.isPending}
            className='flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50'
          >
            {sendInvitesMutation.isPending ? (
              <>
                <Loader2 className='h-4 w-4 animate-spin' />
                Sending...
              </>
            ) : (
              <>
                <Send className='h-4 w-4' /> SEND INVITES
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
