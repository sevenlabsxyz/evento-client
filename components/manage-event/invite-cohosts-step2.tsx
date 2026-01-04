'use client';

import { useSendCohostInvites } from '@/lib/hooks/use-cohost-invites';
import { CohostInviteTarget, UserDetails } from '@/lib/types/api';
import { Loader2, MailIcon, Send, X } from 'lucide-react';
import { UserAvatar } from '../ui/user-avatar';

interface InviteCohostsStep2Props {
  eventId: string;
  selectedEmails: Set<string>;
  selectedUsers: UserDetails[];
  message: string;
  setMessage: (message: string) => void;
  onBack: () => void;
  onClose: () => void;
  onReset: () => void;
  onRemoveEmail: (email: string) => void;
  onRemoveUser: (userId: string) => void;
}

export default function InviteCohostsStep2({
  eventId,
  selectedEmails,
  selectedUsers,
  message,
  setMessage,
  onBack,
  onClose,
  onReset,
  onRemoveEmail,
  onRemoveUser,
}: InviteCohostsStep2Props) {
  const sendInvitesMutation = useSendCohostInvites(eventId);
  const selectedCount = selectedEmails.size + selectedUsers.length;

  const handleSendInvites = async () => {
    const invites: CohostInviteTarget[] = [
      ...Array.from(selectedEmails).map((email) => ({ email })),
      ...selectedUsers.map((user) => ({ userId: user.id })),
    ];

    try {
      await sendInvitesMutation.mutateAsync({
        invites,
        message: message.trim() || undefined,
      });
      onClose();
      setTimeout(() => {
        onReset();
      }, 0);
    } catch {}
  };

  return (
    <div className='flex flex-col px-4 pb-8'>
      <p className='mb-4 text-center text-sm text-gray-500'>
        Add a personal note to your invitation
      </p>

      <textarea
        name='message'
        className='w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm outline-none focus:ring-2 focus:ring-red-500'
        rows={4}
        placeholder='Write a note to include with your invite (optional)'
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <p className='mt-2 text-xs italic text-gray-500'>
        This message is sent along with the cohost invitation.
      </p>

      <div className='mt-6'>
        <h3 className='mb-3 font-semibold text-gray-900'>
          {selectedCount > 0
            ? `Inviting ${selectedCount} cohost${selectedCount === 1 ? '' : 's'}:`
            : 'No cohosts selected'}
        </h3>

        {selectedCount === 0 ? (
          <p className='text-sm text-gray-500'>Go back to add people to invite.</p>
        ) : (
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
                <button
                  onClick={() => onRemoveEmail(email)}
                  className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full hover:bg-gray-200'
                  aria-label={`Remove ${email}`}
                >
                  <X className='h-4 w-4 text-gray-500' />
                </button>
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
                <button
                  onClick={() => onRemoveUser(user.id)}
                  className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full hover:bg-gray-200'
                  aria-label={`Remove ${user.username}`}
                >
                  <X className='h-4 w-4 text-gray-500' />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className='mt-6'>
        <button
          onClick={handleSendInvites}
          disabled={sendInvitesMutation.isPending || selectedCount === 0}
          className='flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50'
        >
          {sendInvitesMutation.isPending ? (
            <>
              <Loader2 className='h-4 w-4 animate-spin' />
              Sending...
            </>
          ) : (
            <>
              <Send className='h-4 w-4' /> SEND COHOST INVITES
            </>
          )}
        </button>
      </div>
    </div>
  );
}
