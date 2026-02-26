import Image from 'next/image';
import Link from 'next/link';

import { GhostPost } from '@/lib/types/ghost';
import { cn } from '@/lib/utils';

interface BlogPostCardProps {
  post: GhostPost;
  className?: string;
}

export function BlogPostCard({ post, className }: BlogPostCardProps) {
  const excerpt = post.custom_excerpt ?? post.excerpt ?? '';
  const href = `/blog/${post.slug}`;

  return (
    <Link href={href} className={cn('group flex flex-col', className)}>
      {/* Thumbnail */}
      <div className='mb-4 flex overflow-clip rounded-xl md:mb-5'>
        <div className='w-full transition-opacity duration-300 group-hover:opacity-80'>
          {post.feature_image ? (
            <Image
              src={post.feature_image}
              alt={post.feature_image_alt ?? post.title}
              width={1600}
              height={900}
              className='aspect-video h-full w-full object-cover object-center'
              sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
              placeholder='empty'
            />
          ) : (
            <div className='aspect-video w-full bg-muted' />
          )}
        </div>
      </div>

      {/* Title */}
      <div className='mb-2 line-clamp-3 break-words pt-4 text-lg font-medium md:mb-3 md:text-2xl lg:text-3xl'>
        {post.title}
      </div>

      {/* Excerpt */}
      {excerpt && (
        <div className='mb-4 line-clamp-2 text-sm text-muted-foreground md:mb-5 md:text-base'>
          {excerpt}
        </div>
      )}
    </Link>
  );
}
