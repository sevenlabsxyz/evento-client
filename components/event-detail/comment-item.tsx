'use client';

import DeleteConfirmationSheet from '@/components/event-detail/delete-confirmation-sheet';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { toast } from '@/hooks/use-toast';
import { useAddComment } from '@/lib/hooks/useAddComment';
import {
  ReactionType,
  useCommentReactions,
} from '@/lib/hooks/useCommentReactions';
import { useDeleteComment } from '@/lib/hooks/useDeleteComment';
import { useEditComment } from '@/lib/hooks/useEditComment';
import { EventComment } from '@/lib/hooks/useEventComments';
import { UserDetails } from '@/lib/types/api';
import { cn } from '@/lib/utils';
import { format, formatDistance } from 'date-fns';
import {
  Heart,
  Loader2,
  MoreHorizontal,
  Reply,
  SendHorizontal,
  ThumbsUp,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface CommentItemProps {
  comment: EventComment;
  currentUser: UserDetails | null;
  eventId: string;
  isReply?: boolean;
  activeReplyId: string | null;
  setActiveReplyId: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function CommentItem({
  comment,
  currentUser,
  eventId,
  isReply = false,
  activeReplyId,
  setActiveReplyId,
}: CommentItemProps) {
  const isReplying = activeReplyId === comment.id;
  const [replyText, setReplyText] = useState('');
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const addCommentMutation = useAddComment();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.message);
  const [showReplies, setShowReplies] = useState(true);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const deleteCommentMutation = useDeleteComment();
  const editCommentMutation = useEditComment();
  const { reactions, userReaction, toggleReaction, isToggling } =
    useCommentReactions(comment.id);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const createdDate = new Date(comment.created_at);
  const timeAgo = formatDistance(createdDate, new Date(), { addSuffix: true });
  const formattedDate = format(createdDate, "MMM d, yyyy 'at' h:mm a");
  const isAuthor = currentUser ? comment.user_id === currentUser.id : false;

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
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete comment',
      });
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
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to edit comment',
      });
    }
  };

  const handleReaction = (type: ReactionType) => {
    toggleReaction(type);
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

    try {
      await addCommentMutation.mutateAsync({
        event_id: eventId,
        message: replyText.trim(),
        parent_comment_id: comment.id,
      });

      setReplyText('');
      setActiveReplyId(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add reply',
      });
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
    <div className={cn('group', isReply ? 'ml-8' : '')}>
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <UserAvatar
            image={comment.user_details.image}
            fallback={comment.user_details.username?.[0] || 'U'}
            verified={comment.user_details.verification_status === 'verified'}
            className="h-8 w-8"
          />
        </div>

        <div className="flex-grow space-y-1">
          {/* Comment header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="font-medium">
                @{comment.user_details.username}
              </span>
              <span
                className="ml-2 text-xs text-gray-500"
                title={formattedDate}
              >
                {timeAgo}
              </span>
            </div>

            {isAuthor && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full p-1 text-gray-500 hover:bg-gray-100">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-red-600 focus:bg-red-50 focus:text-red-600"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Comment content */}
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                ref={textareaRef}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="min-h-[60px] w-full resize-none rounded-md border border-gray-200 p-2 text-sm"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setEditText(comment.message);
                  }}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleEdit}>
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-800">{comment.message}</p>
          )}

          {/* Comment actions */}
          {!isEditing && (
            <div className="flex items-center space-x-4 pt-1">
              <button
                onClick={() => handleReaction('like')}
                className={cn(
                  'flex items-center space-x-1 text-xs',
                  userReaction === 'like'
                    ? 'text-red-500'
                    : 'text-gray-500 hover:text-gray-700'
                )}
                disabled={isToggling}
              >
                <Heart
                  className="h-3.5 w-3.5"
                  fill={userReaction === 'like' ? 'currentColor' : 'none'}
                />
                <span>{reactions.like || ''}</span>
              </button>

              <button
                onClick={() => handleReaction('thumbsup')}
                className={cn(
                  'flex items-center space-x-1 text-xs',
                  userReaction === 'thumbsup'
                    ? 'text-blue-500'
                    : 'text-gray-500 hover:text-gray-700'
                )}
                disabled={isToggling}
              >
                <ThumbsUp
                  className="h-3.5 w-3.5"
                  fill={userReaction === 'thumbsup' ? 'currentColor' : 'none'}
                />
                <span>{reactions.thumbsup || ''}</span>
              </button>

              <button
                onClick={handleReplyClick}
                className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700"
              >
                <Reply className="h-3.5 w-3.5" />
                <span>Reply</span>
              </button>
            </div>
          )}

          {/* Inline Reply UI */}
          {isReplying && !isEditing && (
            <div className="!mt-5 space-y-2">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <UserAvatar
                    fallback={currentUser?.username?.[0] || 'U'}
                    className="h-6 w-6"
                  />
                </div>
                <div className="flex relative flex-grow">
                  <textarea
                    ref={replyTextareaRef}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={handleReplyKeyDown}
                    placeholder={`Reply to @${comment.user_details.username}`}
                    className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    rows={1}
                  />
                  <button
                    className={cn(
                      'absolute top-0 bottom-0 right-2 my-auto flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors',
                      replyText.trim()
                        ? 'text-red-500 hover:text-red-600'
                        : 'text-gray-300 cursor-default'
                    )}
                    onClick={handleSubmitReply}
                    disabled={!replyText.trim() || addCommentMutation.isPending}
                  >
                    {addCommentMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <SendHorizontal className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveReplyId(null)}
                  className="h-7 px-3 py-1 text-xs"
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
        <div className="mt-3">
          {comment.replies.length > 0 && (
            <button
              className="ml-11 mb-2 text-xs font-medium text-gray-500 hover:text-gray-700"
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
            <div className="mt-2 space-y-4">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  currentUser={currentUser}
                  eventId={eventId}
                  isReply={true}
                  activeReplyId={activeReplyId}
                  setActiveReplyId={setActiveReplyId}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Sheet */}
      <DeleteConfirmationSheet
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={confirmDelete}
        itemType={isReply ? 'reply' : 'comment'}
        isLoading={deleteCommentMutation.isPending}
      />
    </div>
  );
}
