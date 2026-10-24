'use client';

import { CircledIconButton } from '@/components/circled-icon-button';
import { CommentReactionButton } from '@/components/comment-reaction-button';
import DeleteConfirmationSheet from '@/components/event-detail/delete-confirmation-sheet';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useAddComment } from '@/lib/hooks/use-add-comment';
import { useCommentReactions } from '@/lib/hooks/use-comment-reactions';
import { useDeleteComment } from '@/lib/hooks/use-delete-comment';
import { useEditComment } from '@/lib/hooks/use-edit-comment';
import { EventComment } from '@/lib/hooks/use-event-comments';
import { UserDetails } from '@/lib/types/api';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/utils/toast';
import { format, formatDistance } from 'date-fns';
import { Heart, MoreHorizontal, Reply, SendHorizontal, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import QuickProfileSheet from '../ui/quick-profile-sheet';
import { ReplyAvatar } from '../ui/reply-avatar';
import { ZapSheet } from '../zap/zap-sheet';
import { CommentActionsSheet } from './comment-actions-sheet';

interface CommentItemProps {
  comment: EventComment;
  currentUser: UserDetails | null;
  eventId: string;
  isEventHost?: boolean;
  isReply?: boolean;
  activeReplyId: string | null;
  setActiveReplyId: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function CommentItem({
  comment,
  currentUser,
  eventId,
  isEventHost = false,
  isReply = false,
  activeReplyId,
  setActiveReplyId,
}: CommentItemProps) {
  const router = useRouter();
  const isReplying = activeReplyId === comment.id;
  const [replyText, setReplyText] = useState('');
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const addCommentMutation = useAddComment();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.message);
  const [showReplies, setShowReplies] = useState(true);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showActionsSheet, setShowActionsSheet] = useState(false);
  const deleteCommentMutation = useDeleteComment();
  const editCommentMutation = useEditComment();
  const { reactions, userReaction, toggleReaction, isToggling } = useCommentReactions(
    comment.id,
    eventId
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);

  // Cleanup selectedUser when component unmounts to prevent memory leaks
  useEffect(() => {
    return () => {
      setSelectedUser(null);
    };
  }, []);

  const createdDate = new Date(comment.created_at);
  const timeAgo = formatDistance(createdDate, new Date(), { addSuffix: true });
  const formattedDate = format(createdDate, "MMM d, yyyy 'at' h:mm a");
  const isAuthor = currentUser ? comment.user_id === currentUser.id : false;
  const canEdit = isAuthor;
  const canDelete = isAuthor || isEventHost;

  // Auto-grow textarea as content grows
  useEffect(() => {
    if (textareaRef.current && isEditing) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      textareaRef.current.focus();
    }
  }, [isEditing, editText]);

  // Auto-grow reply textarea as content grows
  useEffect(() => {
    if (replyTextareaRef.current && isReplying) {
      replyTextareaRef.current.style.height = 'auto';
      replyTextareaRef.current.style.height = `${replyTextareaRef.current.scrollHeight}px`;
      replyTextareaRef.current.focus();
    }
  }, [isReplying, replyText]);

  const handleDelete = async () => {
    // Open the confirmation sheet instead of using window.confirm
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteCommentMutation.mutateAsync({
        commentId: comment.id,
        eventId,
      });
      setShowDeleteConfirmation(false);
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  const handleEdit = async () => {
    if (!editText.trim()) return;

    try {
      await editCommentMutation.mutateAsync({
        commentId: comment.id,
        message: editText.trim(),
        eventId,
      });
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to edit comment');
    }
  };

  const handleReaction = () => {
    toggleReaction('like');
  };

  const handleReplyClick = () => {
    setActiveReplyId(comment.id);

    // Use setTimeout to ensure the reply textarea is rendered before focusing
    setTimeout(() => {
      if (replyTextareaRef.current) {
        replyTextareaRef.current.focus();
      }
    }, 0);
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim() || !currentUser) return;

    // Store the message before clearing input
    const replyMessage = replyText.trim();

    // Clear the input immediately and remove the active reply ID for better UX
    setReplyText('');
    setActiveReplyId(null);

    try {
      await addCommentMutation.mutateAsync({
        event_id: eventId,
        message: replyMessage,
        parent_comment_id: comment.id,
      });
    } catch {
      toast.error('Failed to add reply');
    }
  };

  const handleReplyKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmitReply();
    }
  };

  return (
    <>
      <div
        className={cn(
          'group',
          isReply ? 'border-l border-gray-200 pl-4 dark:border-neutral-800' : '',
          comment.optimistic ? 'pointer-events-none cursor-not-allowed opacity-70' : ''
        )}
      >
        <div className='flex gap-3'>
          <div className='flex-shrink-0'>
            <UserAvatar
              user={comment.user_details}
              size={isReply ? 'sm' : 'base'}
              onAvatarClick={useCallback(
                () => setSelectedUser(comment.user_details),
                [comment.user_details]
              )}
            />
          </div>

          <div className='min-w-0 flex-grow space-y-1'>
            {/* Comment header */}
            <div className='flex items-start justify-between gap-2'>
              <div className='flex min-w-0 flex-wrap items-baseline gap-x-1.5'>
                {comment.user_details.name && (
                  <span className='truncate text-sm font-semibold text-gray-900 dark:text-neutral-100'>
                    {comment.user_details.name}
                  </span>
                )}
                <span
                  className={cn(
                    'truncate text-sm',
                    comment.user_details.name
                      ? 'text-gray-500 dark:text-neutral-500'
                      : 'font-semibold text-gray-900 dark:text-neutral-100'
                  )}
                >
                  @{comment.user_details.username}
                </span>
                <span className='text-xs text-gray-500 dark:text-neutral-500' title={formattedDate}>
                  · {timeAgo}
                </span>
              </div>

              {canDelete && (
                <CircledIconButton
                  icon={MoreHorizontal}
                  onClick={() => setShowActionsSheet(true)}
                />
              )}
            </div>

            {/* Comment content */}
            {isEditing ? (
              <div className='space-y-2'>
                <textarea
                  ref={textareaRef}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className='min-h-[60px] w-full resize-none rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-900 outline-none focus:border-gray-300 focus:ring-2 focus:ring-red-500/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-700'
                />
                <div className='flex justify-end gap-2'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => {
                      setIsEditing(false);
                      setEditText(comment.message);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button size='sm' onClick={handleEdit}>
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <p className='whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-700 dark:text-neutral-300'>
                {comment.message}
              </p>
            )}

            {/* Comment actions */}
            {!isEditing && (
              <div className='flex items-center gap-1.5 pt-1.5'>
                <CommentReactionButton
                  icon={Heart}
                  count={reactions.like}
                  isActive={userReaction === 'like'}
                  activeClassName='bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400'
                  fillWhenActive
                  onClick={handleReaction}
                  disabled={isToggling}
                />

                <ZapSheet
                  recipientLightningAddress={comment.user_details.ln_address || ''}
                  recipientName={comment.user_details.name || comment.user_details.username}
                  recipientUsername={comment.user_details.username}
                  recipientAvatar={comment.user_details.image}
                  currentUsername={currentUser?.username}
                >
                  <CommentReactionButton icon={Zap} />
                </ZapSheet>

                <CommentReactionButton icon={Reply} label='Reply' onClick={handleReplyClick} />
              </div>
            )}

            {/* Inline Reply UI */}
            {isReplying && !isEditing && (
              <div className='!mt-4 space-y-2'>
                <div className='flex items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-2 pl-3 transition-colors focus-within:border-gray-300 focus-within:bg-white dark:border-neutral-800 dark:bg-neutral-800 dark:focus-within:border-neutral-700 dark:focus-within:bg-neutral-900'>
                  <div className='flex-shrink-0 pt-0.5'>
                    <ReplyAvatar currentUser={currentUser} onAvatarClick={setSelectedUser} />
                  </div>
                  <div className='relative flex min-w-0 flex-grow items-center'>
                    <textarea
                      ref={replyTextareaRef}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={handleReplyKeyDown}
                      placeholder={`Reply to @${comment.user_details.username}`}
                      className='min-h-[36px] w-full resize-none bg-transparent px-1 py-2 pr-10 text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-neutral-100 dark:placeholder:text-neutral-500'
                      rows={1}
                    />
                    <button
                      type='button'
                      aria-label='Post reply'
                      className={cn(
                        'absolute bottom-0 right-0 top-0 my-auto flex h-8 w-8 items-center justify-center rounded-full transition-colors',
                        replyText.trim()
                          ? 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600'
                          : 'cursor-default text-gray-300 dark:text-neutral-600'
                      )}
                      onClick={handleSubmitReply}
                      disabled={!replyText.trim()}
                    >
                      <SendHorizontal className='h-4 w-4' />
                    </button>
                  </div>
                </div>
                <div className='flex justify-end'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setActiveReplyId(null)}
                    className='h-7 rounded-full px-3 py-1 text-xs text-gray-600 dark:text-neutral-400'
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className={cn('mt-3', isReply ? '' : 'ml-[52px]')}>
            {comment.replies.length > 0 && (
              <button
                type='button'
                className='mb-2 text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-neutral-500 dark:hover:text-neutral-200'
                onClick={() => setShowReplies(!showReplies)}
              >
                {showReplies
                  ? `Hide ${comment.replies.length} ${
                      comment.replies.length === 1 ? 'reply' : 'replies'
                    }`
                  : `Show ${comment.replies.length} ${
                      comment.replies.length === 1 ? 'reply' : 'replies'
                    }`}
              </button>
            )}

            {showReplies && (
              <div className='mt-2 space-y-4'>
                {comment.replies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    currentUser={currentUser}
                    eventId={eventId}
                    isEventHost={isEventHost}
                    isReply={true}
                    activeReplyId={activeReplyId}
                    setActiveReplyId={setActiveReplyId}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Sheet */}
      <DeleteConfirmationSheet
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={confirmDelete}
        itemType={isReply ? 'reply' : 'comment'}
        isLoading={deleteCommentMutation.isPending}
      />

      {/* Comment Actions Sheet */}
      <CommentActionsSheet
        isOpen={showActionsSheet}
        onClose={() => setShowActionsSheet(false)}
        onEdit={() => setIsEditing(true)}
        onDelete={handleDelete}
        canEdit={canEdit}
        canDelete={canDelete}
      />

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
