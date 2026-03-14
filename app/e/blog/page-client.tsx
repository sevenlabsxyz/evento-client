'use client';

import { BlogPostCard } from '@/components/blog/blog-post-card';
import { useTopBar } from '@/lib/stores/topbar-store';
import { GhostPost } from '@/lib/types/ghost';
import { useEffect } from 'react';

export default function PostPageClient({ posts }: { posts: GhostPost[] }) {
  const { setTopBar } = useTopBar();

  useEffect(() => {
    setTopBar({
      leftMode: 'menu',
      centerMode: 'title',
      title: 'Blog',
      subtitle: '',
      showAvatar: true,
      buttons: [],
      isOverlaid: false,
    });
    return () => {
      setTopBar({ title: '', subtitle: '', buttons: [] });
    };
  }, [setTopBar]);
  if (!posts || posts.length === 0) {
    return (
      <div className='px-4 py-12 text-center'>
        <div className='rounded-lg bg-gray-100 p-8'>
          <h3 className='mb-2 text-xl font-semibold text-gray-700'>No posts yet</h3>
          <p className='text-gray-500'>Check back soon for new content!</p>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto w-full max-w-6xl px-4 py-8 md:px-8'>
      <div className='grid gap-x-4 gap-y-8 md:grid-cols-2 lg:gap-x-6 lg:gap-y-12 2xl:grid-cols-3'>
        {posts.map((post) => (
          <BlogPostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
