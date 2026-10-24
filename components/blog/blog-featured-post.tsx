import { BlogPostCover } from '@/components/blog/blog-post-card';
import { BlogPostMeta } from '@/components/blog/blog-post-meta';
import { GhostPost } from '@/lib/types/ghost';
import { cn } from '@/lib/utils';
import { getPostExcerpt, getPrimaryVisibleTag } from '@/lib/utils/blog';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface BlogFeaturedPostProps {
  post: GhostPost;
  className?: string;
}

export function BlogFeaturedPost({ post, className }: BlogFeaturedPostProps) {
  const excerpt = getPostExcerpt(post);
  const tag = getPrimaryVisibleTag(post);
  const eyebrow = [post.featured ? 'Featured' : 'Latest', tag?.name].filter(Boolean).join(' · ');

  return (
    <Link
      href={`/e/blog/${post.slug}`}
      className={cn(
        'group grid overflow-hidden rounded-2xl border border-gray-200 bg-white transition-colors duration-200 hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700 dark:focus-visible:ring-offset-neutral-900 lg:grid-cols-12',
        className
      )}
    >
      <div className='relative aspect-video w-full overflow-hidden border-b border-gray-200 bg-gray-100 dark:border-neutral-800 dark:bg-neutral-800 lg:col-span-7 lg:aspect-auto lg:min-h-[420px] lg:border-b-0 lg:border-r'>
        <BlogPostCover
          post={post}
          priority
          sizes='(min-width: 1280px) 720px, (min-width: 1024px) 56vw, 100vw'
        />
      </div>

      <div className='flex flex-col justify-center p-6 md:p-8 lg:col-span-5 lg:p-10'>
        <p className='text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400'>
          {eyebrow}
        </p>
        <h2 className='mt-3 text-balance break-words text-2xl font-bold leading-tight tracking-tight text-gray-900 dark:text-neutral-100 md:text-3xl lg:text-4xl'>
          {post.title}
        </h2>
        {excerpt && (
          <p className='mt-4 line-clamp-3 text-base leading-relaxed text-gray-600 dark:text-neutral-400'>
            {excerpt}
          </p>
        )}
        <BlogPostMeta post={post} size='md' className='mt-6' />
        <span className='mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 dark:text-red-400'>
          Read story
          <ArrowRight
            className='h-4 w-4 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5'
            aria-hidden='true'
          />
        </span>
      </div>
    </Link>
  );
}
