import { GhostPost } from '@/lib/types/ghost';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const RAIL_POST_LIMIT = 3;

interface HubBlogRailProps {
  posts: GhostPost[];
}

function getPostMeta(post: GhostPost): string | null {
  if (post.reading_time > 0) {
    return `${post.reading_time} min read`;
  }
  if (!post.published_at) {
    return null;
  }
  const published = new Date(post.published_at);
  if (Number.isNaN(published.getTime())) {
    return null;
  }
  return published.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function HubBlogRail({ posts }: HubBlogRailProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <section className='rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'>
      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-sm font-semibold text-gray-900 dark:text-neutral-100'>From the blog</h2>
        <Link
          href='/e/blog'
          className='inline-flex items-center gap-1 text-xs font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-neutral-400 dark:hover:text-neutral-100'
        >
          All posts
          <ArrowRight className='h-3 w-3' />
        </Link>
      </div>

      <ul className='space-y-1'>
        {posts.slice(0, RAIL_POST_LIMIT).map((post) => {
          const meta = getPostMeta(post);
          return (
            <li key={post.id}>
              <Link
                href={`/e/blog/${post.slug}`}
                className='group -mx-2 flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800'
              >
                <div className='relative h-12 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-neutral-700 dark:bg-neutral-800'>
                  <Image
                    src={post.feature_image || '/assets/img/placeholder.svg'}
                    alt={post.feature_image_alt || post.title}
                    fill
                    className='object-cover object-center'
                    sizes='64px'
                  />
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='line-clamp-2 break-words text-sm font-medium leading-snug text-gray-900 group-hover:underline dark:text-neutral-100'>
                    {post.title}
                  </p>
                  {meta && (
                    <p className='mt-0.5 text-xs text-gray-500 dark:text-neutral-400'>{meta}</p>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
