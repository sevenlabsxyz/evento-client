'use client';

import { BlogCard } from '@/components/blog/blog-card';

export default function PostPageClient({ posts }: { posts: any[] }) {
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
    <div className='px-4 py-6'>
      <div className='flex flex-col space-y-4'>
        {posts.map((post: any) => (
          <BlogCard
            key={post.id}
            slug={post.slug}
            title={post.title}
            date={post.published_at}
            category={post.tags}
            image={post.feature_image}
            description={post.excerpt}
          />
        ))}
      </div>
    </div>
  );
}
