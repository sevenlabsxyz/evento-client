'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useDeleteComment } from '@/lib/hooks/use-delete-comment';
import { useEventComments, type EventComment } from '@/lib/hooks/use-event-comments';
import { getIntlLocale } from '@/lib/i18n/active-locale';
import { queryKeys } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/utils/error-message';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import { useQueryClient } from '@tanstack/react-query';
import { formatDistance, type Locale } from 'date-fns';
import { enUS, es, ptBR } from 'date-fns/locale';
import { Loader2, MessageCircle, Search, Trash2, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

const DATE_FNS_LOCALES: Record<string, Locale> = { en: enUS, 'pt-BR': ptBR, es };

interface CommentsModerationProps {
  eventId: string;
}

export function countComments(comments: EventComment[]): number {
  return comments.reduce((total, comment) => total + 1 + countComments(comment.replies ?? []), 0);
}

function sortRepliesOldestFirst(replies: EventComment[]): EventComment[] {
  return [...replies].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

function commentMatches(comment: EventComment, query: string): boolean {
  const username = comment.user_details?.username?.toLowerCase() ?? '';
  const name = comment.user_details?.name?.toLowerCase() ?? '';
  return (
    comment.message.toLowerCase().includes(query) ||
    username.includes(query) ||
    name.includes(query)
  );
}

// Keeps a comment when it or any descendant matches, so matching replies stay in context.
function filterComments(comments: EventComment[], query: string): EventComment[] {
  if (!query) {
    return comments;
  }

  return comments.reduce<EventComment[]>((result, comment) => {
    const replies = filterComments(comment.replies ?? [], query);
    if (commentMatches(comment, query) || replies.length > 0) {
      result.push({ ...comment, replies });
    }
    return result;
  }, []);
}

interface CommentRowProps {
  comment: EventComment;
  depth: number;
  onDelete: (comment: EventComment) => void;
}

function CommentRow({ comment, depth, onDelete }: CommentRowProps) {
  const t = useTranslations('manage');
  const locale = useLocale();
  const createdDate = new Date(comment.created_at);
  const displayName =
    comment.user_details?.name ||
    comment.user_details?.username ||
    t('commentsModeration.unknownUser');
  const username = comment.user_details?.username;
  const replies = sortRepliesOldestFirst(comment.replies ?? []);

  return (
    <div className={cn(depth > 0 && 'border-l border-gray-200 pl-4 dark:border-neutral-800')}>
      <div className='group flex gap-3 py-3'>
        <div className='flex-shrink-0'>
          <UserAvatar user={comment.user_details} size='sm' />
        </div>
        <div className='min-w-0 flex-1'>
          <div className='flex items-start justify-between gap-2'>
            <div className='flex min-w-0 flex-wrap items-baseline gap-x-2'>
              <span className='truncate text-sm font-semibold text-gray-900 dark:text-neutral-100'>
                {displayName}
              </span>
              {username && displayName !== username && (
                <span className='truncate text-xs text-gray-500 dark:text-neutral-400'>
                  @{username}
                </span>
              )}
              <span
                className='text-xs text-gray-500 dark:text-neutral-400'
                title={createdDate.toLocaleString(getIntlLocale(locale), {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              >
                {formatDistance(createdDate, new Date(), {
                  addSuffix: true,
                  locale: DATE_FNS_LOCALES[locale] ?? enUS,
                })}
              </span>
            </div>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              aria-label={t('commentsModeration.deleteComment')}
              className='h-8 w-8 flex-shrink-0 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-600 dark:text-neutral-500 dark:hover:bg-red-950/40 dark:hover:text-red-400'
              onClick={() => onDelete(comment)}
            >
              <Trash2 className='h-4 w-4' />
            </Button>
          </div>
          <p className='whitespace-pre-wrap break-words text-sm text-gray-800 dark:text-neutral-200'>
            {comment.message}
          </p>
        </div>
      </div>
      {replies.length > 0 && (
        <div className='ml-4'>
          {replies.map((reply) => (
            <CommentRow key={reply.id} comment={reply} depth={depth + 1} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentsModeration({ eventId }: CommentsModerationProps) {
  const t = useTranslations('manage');
  const tCommon = useTranslations('common');
  const queryClient = useQueryClient();
  const { data: comments = [], isLoading, error, refetch } = useEventComments(eventId);
  const deleteComment = useDeleteComment();
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingDelete, setPendingDelete] = useState<EventComment | null>(null);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleComments = useMemo(
    () => filterComments(comments, normalizedQuery),
    [comments, normalizedQuery]
  );
  const pendingReplyCount = pendingDelete ? countComments(pendingDelete.replies ?? []) : 0;

  const handleConfirmDelete = async () => {
    if (!pendingDelete) {
      return;
    }

    try {
      await deleteComment.mutateAsync({ commentId: pendingDelete.id, eventId });
      await queryClient.invalidateQueries({ queryKey: queryKeys.eventDashboard(eventId) });
      toast.success(t('commentsModeration.deleted'));
      setPendingDelete(null);
    } catch (deleteError) {
      const message = getErrorMessage(deleteError) || t('commentsModeration.deleteFailed');
      toast.error(message);
      logger.error('Failed to delete comment', { error: message, eventId });
    }
  };

  if (isLoading) {
    return (
      <div className='space-y-4'>
        <Skeleton className='h-11 w-full rounded-xl' />
        <div className='divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white px-4 dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900'>
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className='flex gap-3 py-4'>
              <Skeleton className='h-8 w-8 flex-shrink-0 rounded-full' />
              <div className='flex-1 space-y-2'>
                <Skeleton className='h-4 w-32' />
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-2/3' />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-neutral-800 dark:bg-neutral-900'>
        <p className='mb-1 font-medium text-gray-900 dark:text-neutral-100'>
          {t('commentsModeration.loadError')}
        </p>
        <p className='mb-4 text-sm text-gray-500 dark:text-neutral-400'>
          {getErrorMessage(error) || tCommon('states.errorTryAgain')}
        </p>
        <Button variant='outline' size='sm' onClick={() => refetch()}>
          {tCommon('actions.tryAgain')}
        </Button>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className='rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center dark:border-neutral-800 dark:bg-neutral-900'>
        <div className='mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800'>
          <MessageCircle className='h-6 w-6 text-gray-400 dark:text-neutral-500' />
        </div>
        <h3 className='mb-1 text-base font-semibold text-gray-900 dark:text-neutral-100'>
          {t('commentsModeration.emptyTitle')}
        </h3>
        <p className='text-sm text-gray-500 dark:text-neutral-400'>
          {t('commentsModeration.emptyDescription')}
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-neutral-500' />
        <input
          type='text'
          placeholder={t('commentsModeration.searchPlaceholder')}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className='w-full rounded-xl border-none bg-gray-100 py-3 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-500 outline-none dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-400'
        />
        {searchQuery && (
          <button
            type='button'
            aria-label={t('commentsModeration.clearSearch')}
            onClick={() => setSearchQuery('')}
            className='absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:text-neutral-500 dark:hover:bg-neutral-700 dark:hover:text-neutral-300'
          >
            <X className='h-4 w-4' />
          </button>
        )}
      </div>

      {visibleComments.length === 0 ? (
        <div className='rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center dark:border-neutral-800 dark:bg-neutral-900'>
          <p className='text-sm text-gray-500 dark:text-neutral-400'>
            {t('commentsModeration.noMatches', { query: searchQuery.trim() })}
          </p>
        </div>
      ) : (
        <div className='divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white px-4 dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900'>
          {visibleComments.map((comment) => (
            <CommentRow key={comment.id} comment={comment} depth={0} onDelete={setPendingDelete} />
          ))}
        </div>
      )}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleteComment.isPending) {
            setPendingDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('commentsModeration.deleteComment')}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingReplyCount > 0
                ? t('commentsModeration.deleteWithReplies', { count: pendingReplyCount })
                : t('commentsModeration.deleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {pendingDelete && (
            <p className='line-clamp-3 whitespace-pre-wrap break-words rounded-xl bg-gray-50 p-3 text-sm text-gray-700 dark:bg-neutral-800 dark:text-neutral-300'>
              {pendingDelete.message}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteComment.isPending}>
              {tCommon('actions.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmDelete();
              }}
              disabled={deleteComment.isPending}
              className='bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:text-white dark:hover:bg-red-700'
            >
              {deleteComment.isPending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  {t('commentsModeration.deleting')}
                </>
              ) : (
                tCommon('actions.delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
