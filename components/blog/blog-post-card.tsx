import { BlogPostMeta } from '@/components/blog/blog-post-meta';
import { GhostPost } from '@/lib/types/ghost';
import { cn } from '@/lib/utils';
import { getPostExcerpt, getPrimaryVisibleTag } from '@/lib/utils/blog';
import { Newspaper } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface BlogPostCoverProps {
  post: GhostPost;
  sizes: string;
  priority?: boolean;
  className?: string;
}

/** Fills its (relatively positioned) parent; zooms subtly when an ancestor `group` is hovered. */
export function BlogPostCover({ post, sizes, priority = false, className }: BlogPostCoverProps) {
  if (!post.feature_image) {
    return (
      <div
        aria-hidden='true'
        className={cn(
          'absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400 dark:from-neutral-800 dark:to-neutral-900 dark:text-neutral-600',
          className
        )}
      >
        <Newspaper className='h-10 w-10' />
      </div>
    );
  }

  return (
    <Image
      src={post.feature_image}
      alt={post.feature_image_alt || post.title}
      fill
      priority={priority}
      sizes={sizes}
      className={cn(
        'object-cover object-center transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.03]',
        className
      )}
    />
  );
}

interface BlogPostCardProps {
  post: GhostPost;
  className?: string;
}

export function BlogPostCard({ post, className }: BlogPostCardProps) {
  const excerpt = getPostExcerpt(post);
  const tag = getPrimaryVisibleTag(post);

  return (
    <Link
      href={`/e/blog/${post.slug}`}
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-colors duration-200 hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700 dark:focus-visible:ring-offset-neutral-900',
        className
      )}
    >
      <div className='relative aspect-video w-full overflow-hidden border-b border-gray-200 bg-gray-100 dark:border-neutral-800 dark:bg-neutral-800'>
        <BlogPostCover
          post={post}
          sizes='(min-width: 1280px) 400px, (min-width: 1024px) 31vw, (min-width: 640px) 46vw, 100vw'
        />
      </div>

      <div className='flex flex-1 flex-col p-5'>
        {tag && (
          <p className='mb-2 truncate text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400'>
            {tag.name}
          </p>
        )}
        <h3 className='line-clamp-3 break-words text-lg font-semibold leading-snug text-gray-900 dark:text-neutral-100'>
          {post.title}
        </h3>
        {excerpt && (
          <p className='mt-2 line-clamp-2 text-sm leading-relaxed text-gray-600 dark:text-neutral-400'>
            {excerpt}
          </p>
        )}
        <BlogPostMeta post={post} size='sm' className='mt-auto pt-5' />
      </div>
    </Link>
  );
}
