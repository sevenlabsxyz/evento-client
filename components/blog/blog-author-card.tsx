import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GhostAuthor } from '@/lib/types/ghost';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface BlogAuthorCardProps {
  author: GhostAuthor;
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

export function BlogAuthorCard({ author, className }: BlogAuthorCardProps) {
  const t = useTranslations('blog');
  const name = author.name.trim();
  const bio = author.bio?.trim();

  if (!name) {
    return null;
  }

  return (
    <section
      aria-label={t('author.aboutLabel')}
      className={cn(
        'flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 md:p-6',
        className
      )}
    >
      <Avatar className='h-14 w-14 border border-gray-200 dark:border-neutral-700'>
        {author.profile_image && <AvatarImage src={author.profile_image} alt='' />}
        <AvatarFallback className='bg-gray-100 text-base font-semibold text-gray-600 dark:bg-neutral-800 dark:text-neutral-300'>
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      <div className='min-w-0 flex-1'>
        <p className='text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-500'>
          {t('author.writtenBy')}
        </p>
        <p className='mt-0.5 text-base font-semibold text-gray-900 dark:text-neutral-100'>{name}</p>
        {bio && (
          <p className='mt-1.5 text-sm leading-relaxed text-gray-600 dark:text-neutral-400'>
            {bio}
          </p>
        )}
      </div>
    </section>
  );
}
