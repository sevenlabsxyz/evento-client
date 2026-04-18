'use client';

import { UserAvatar } from '@/components/ui/user-avatar';
import type { ChatConversation } from '@/lib/chat/types';
import { formatDistanceToNowStrict } from 'date-fns';
import Link from 'next/link';

interface ConversationListProps {
  conversations: ChatConversation[];
  activeConversationId?: string | null;
}

export function ConversationList({
  conversations,
  activeConversationId,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className='flex h-full items-center justify-center px-6'>
        <div className='max-w-xs text-center'>
          <p className='text-sm font-medium text-gray-900'>No conversations yet</p>
          <p className='mt-2 text-sm leading-6 text-gray-500'>
            Start a message from search, a profile, or an event host card.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='h-full overflow-y-auto p-2'>
      {conversations.map((conversation) => {
        const isActive = activeConversationId === conversation.id;
        const timestamp = conversation.lastMessageAt
          ? formatDistanceToNowStrict(new Date(conversation.lastMessageAt), { addSuffix: true })
          : null;

        return (
          <Link
            key={conversation.id}
            href={`/e/messages/${conversation.id}`}
            className={`flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors ${
              isActive ? 'bg-white shadow-sm ring-1 ring-black/5' : 'hover:bg-white/80'
            }`}
          >
            <UserAvatar
              user={{
                name: conversation.participant.name,
                username: conversation.participant.username,
                image: conversation.participant.image,
                verification_status: conversation.participant.verificationStatus,
              }}
              size='base'
            />
            <div className='min-w-0 flex-1'>
              <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0'>
                  <p className='truncate text-sm font-semibold text-gray-950'>
                    {conversation.participant.name}
                  </p>
                  <p className='truncate text-xs text-gray-500'>@{conversation.participant.username}</p>
                </div>
                {timestamp ? <p className='shrink-0 text-[11px] text-gray-400'>{timestamp}</p> : null}
              </div>
              <div className='mt-1 flex items-center gap-2'>
                <p className='truncate text-sm text-gray-500'>
                  {conversation.lastMessageText ?? 'Say hello'}
                </p>
                {conversation.unreadCount > 0 ? (
                  <span className='inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-medium text-white'>
                    {conversation.unreadCount}
                  </span>
                ) : null}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
