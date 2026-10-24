import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GhostPost } from '@/lib/types/ghost';
import { cn } from '@/lib/utils';
import { formatPostDate, formatReadingTime } from '@/lib/utils/blog';

interface BlogPostMetaProps {
  post: GhostPost;
  size?: 'sm' | 'md';
  className?: string;
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export function BlogPostMeta({ post, size = 'sm', className }: BlogPostMetaProps) {
  const author = post.primary_author ?? post.authors?.[0] ?? null;
  const authorName = author?.name?.trim() ?? '';
  const details = [
    formatPostDate(post.published_at, size === 'md' ? 'long' : 'short'),
    formatReadingTime(post.reading_time),
  ].filter(Boolean);
  const isMedium = size === 'md';

  if (!authorName && details.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex min-w-0 items-center', isMedium ? 'gap-3' : 'gap-2.5', className)}>
      {authorName && (
        <Avatar
          className={cn(
            'border border-gray-200 dark:border-neutral-700',
            isMedium ? 'h-10 w-10' : 'h-8 w-8'
          )}
        >
          {author?.profile_image && <AvatarImage src={author.profile_image} alt='' />}
          <AvatarFallback
            className={cn(
              'bg-gray-100 font-semibold text-gray-600 dark:bg-neutral-800 dark:text-neutral-300',
              isMedium ? 'text-sm' : 'text-[11px]'
            )}
          >
            {getInitials(authorName)}
          </AvatarFallback>
        </Avatar>
      )}
      <div className='min-w-0 leading-tight'>
        {authorName && (
          <p
            className={cn(
              'truncate font-medium text-gray-900 dark:text-neutral-100',
              isMedium ? 'text-sm' : 'text-[13px]'
            )}
          >
            {authorName}
          </p>
        )}
        {details.length > 0 && (
          <p
            className={cn(
              'truncate text-gray-500 dark:text-neutral-500',
              isMedium ? 'mt-1 text-sm' : 'mt-0.5 text-xs'
            )}
          >
            {details.join(' · ')}
          </p>
        )}
      </div>
    </div>
  );
}
