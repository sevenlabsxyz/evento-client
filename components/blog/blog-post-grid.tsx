'use client';

import { BlogPostCard } from '@/components/blog/blog-post-card';
import { BlogGridSkeleton } from '@/components/blog/blog-skeleton';
import { useGhostPosts } from '@/lib/hooks/use-ghost-posts';

interface BlogPostGridProps {
  limit?: number;
}

export function BlogPostGrid({ limit = 9 }: BlogPostGridProps) {
  const { data: posts, isLoading, error } = useGhostPosts({ limit });

  if (isLoading) {
    return <BlogGridSkeleton count={limit} />;
  }

  if (error) {
    return (
      <div className='flex flex-col items-center justify-center py-16 text-center'>
        <p className='text-muted-foreground'>Failed to load posts. Please try again later.</p>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-16 text-center'>
        <p className='text-muted-foreground'>No posts yet. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className='grid gap-x-4 gap-y-8 md:grid-cols-2 lg:gap-x-6 lg:gap-y-12 2xl:grid-cols-3'>
      {posts.map((post) => (
        <BlogPostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
