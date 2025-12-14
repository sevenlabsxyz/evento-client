'use client';

import { useSendEventInvites } from '@/lib/hooks/use-event-invites';
import { UserDetails } from '@/lib/types/api';
import { Loader2, MailIcon, Send } from 'lucide-react';
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
    <div className='flex flex-col px-4 pb-8'>
      {/* Subtitle */}
      <p className='mb-4 text-center text-sm text-gray-500'>Make it special for your guests!</p>

      {/* Message textarea */}
      <textarea
        name='message'
        className='w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm outline-none focus:ring-2 focus:ring-red-500'
        rows={4}
        placeholder='Write a note to include with your invite (optional)'
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <p className='mt-2 text-xs italic text-gray-500'>
        This message is sent along with the details of your Event.
      </p>

      {/* Selected users list */}
      <div className='mt-6'>
        <h3 className='mb-3 font-semibold text-gray-900'>
          Inviting {selectedCount} user{selectedCount === 1 ? '' : 's'}:
        </h3>

        <div className='flex flex-col gap-2'>
          {Array.from(selectedEmails).map((email) => (
            <div
              key={email}
              className='flex items-center gap-3 rounded-3xl border border-gray-200 bg-gray-50 p-3'
            >
              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gray-100'>
                <MailIcon size={16} />
              </div>
              <div className='min-w-0 flex-1'>
                <div className='truncate text-sm font-medium text-gray-900'>{email}</div>
                <div className='truncate text-xs text-gray-500'>Email invitation</div>
              </div>
              <span className='flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-black'>
                <span className='h-2.5 w-2.5 rounded-full bg-black' />
              </span>
            </div>
          ))}
          {selectedUsers.map((user) => (
            <div
              key={user.id}
              className='flex items-center gap-3 rounded-3xl border border-gray-200 bg-gray-50 p-3'
            >
              <UserAvatar
                user={{
                  name: user.name,
                  username: user.username,
                  image: user.image,
                  verification_status: user.verification_status,
                }}
                size='sm'
              />
              <div className='min-w-0 flex-1'>
                <div className='truncate text-sm font-medium text-gray-900'>@{user.username}</div>
                <div className='truncate text-xs text-gray-500'>{user.name}</div>
              </div>
              <span className='flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-black'>
                <span className='h-2.5 w-2.5 rounded-full bg-black' />
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Send button */}
      <div className='mt-6'>
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
  );
}
