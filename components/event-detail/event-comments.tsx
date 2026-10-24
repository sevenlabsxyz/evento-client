'use client';

import CommentItem from '@/components/event-detail/comment-item';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useAddComment } from '@/lib/hooks/use-add-comment';
import { useAuth } from '@/lib/hooks/use-auth';
import { useEventComments } from '@/lib/hooks/use-event-comments';
import { UserDetails } from '@/lib/types/api';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import { Loader2, MessageCircle, SendHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import QuickProfileSheet from '../ui/quick-profile-sheet';

interface EventCommentsProps {
  eventId: string;
  isEventHost?: boolean;
}

export default function EventComments({ eventId, isEventHost = false }: EventCommentsProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { data: comments = [], isLoading, error } = useEventComments(eventId);
  const addCommentMutation = useAddComment();
  const [commentText, setCommentText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Track which comment has an open reply input
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [commentText]);

  const handleAddComment = async () => {
    if (!commentText.trim() || !user) return;

    // Store the comment text before clearing for better UX
    const message = commentText.trim();

    // Clear text immediately for better UX
    setCommentText('');

    try {
      await addCommentMutation.mutateAsync({
        event_id: eventId,
        message,
      });
    } catch (error) {
      logger.error('Error adding comment', { error });

      // Show detailed error message
      const errorMessage =
        error instanceof Error ? error.message : 'Your comment was not saved. Please try again.';

      toast.error(errorMessage);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleAddComment();
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='h-8 w-8 animate-spin text-gray-400 dark:text-neutral-500' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 dark:bg-neutral-800'>
        <MessageCircle className='h-5 w-5 shrink-0 text-gray-400 dark:text-neutral-500' />
        <div className='min-w-0'>
          <h3 className='text-sm font-medium text-gray-900 dark:text-neutral-100'>
            Could not load comments
          </h3>
          <p className='text-sm text-gray-500 dark:text-neutral-500'>
            There was a problem loading comments. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div>
        {/* Comment input */}
        <div className='mb-5'>
          <div className='flex items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-2 pl-3 transition-colors focus-within:border-gray-300 focus-within:bg-white dark:border-neutral-800 dark:bg-neutral-800 dark:focus-within:border-neutral-700 dark:focus-within:bg-neutral-900'>
            <div className='flex-shrink-0 pt-0.5'>
              <UserAvatar
                user={{
                  name: user?.name,
                  username: user?.username,
                  image: user?.image,
                  verification_status: user?.verification_status,
                }}
                size='base'
                onAvatarClick={() => setSelectedUser(user)}
              />
            </div>
            <div className='relative flex min-w-0 flex-grow items-center'>
              <textarea
                name='comment'
                ref={textareaRef}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder='Add a comment'
                className='min-h-[36px] w-full resize-none bg-transparent px-1 py-2 pr-10 text-sm text-gray-900 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed dark:text-neutral-100 dark:placeholder:text-neutral-500'
                disabled={!user}
                rows={1}
              />
              <button
                type='button'
                aria-label='Post comment'
                className={cn(
                  'absolute bottom-0 right-0 top-0 my-auto flex h-8 w-8 items-center justify-center rounded-full transition-colors',
                  commentText.trim()
                    ? 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600'
                    : 'cursor-default text-gray-300 dark:text-neutral-600'
                )}
                onClick={handleAddComment}
                disabled={!commentText.trim() || !user}
              >
                <SendHorizontal className='h-4 w-4' />
              </button>
            </div>
          </div>
          {!user && (
            <p className='mt-2 pl-1 text-xs text-gray-500 dark:text-neutral-500'>
              Please sign in to leave a comment.
            </p>
          )}
        </div>

        {/* Comments list */}
        {comments.length > 0 ? (
          <div className='space-y-5'>
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUser={user}
                eventId={eventId}
                isEventHost={isEventHost}
                activeReplyId={activeReplyId}
                setActiveReplyId={setActiveReplyId}
              />
            ))}
          </div>
        ) : (
          <div className='flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 dark:bg-neutral-800'>
            <MessageCircle className='h-5 w-5 shrink-0 text-gray-400 dark:text-neutral-500' />
            <p className='text-sm text-gray-500 dark:text-neutral-400'>
              <span className='font-medium text-gray-900 dark:text-neutral-100'>
                No comments yet.
              </span>{' '}
              Be the first to leave a comment about this event.
            </p>
          </div>
        )}
      </div>

      {selectedUser && (
        <QuickProfileSheet
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          user={selectedUser}
        />
      )}
    </>
  );
}
