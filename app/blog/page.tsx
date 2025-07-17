import { BlogCard } from '@/components/blog/card';
import { Env } from '@/lib/constants/env';
import { AlertTriangle } from 'lucide-react';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

const Error = ({ message }: { message: string }) => (
  <div className='rounded-lg border border-red-200 bg-red-50 p-4 text-red-700' role='alert'>
    <div className='mb-1 flex items-center gap-2'>
      <AlertTriangle className='h-5 w-5' />
      <p className='font-semibold'>Error</p>
    </div>
    <p className='text-sm'>{message}</p>
  </div>
);

const Loading = () => (
  <div className='flex h-64 items-center justify-center'>
    <div className='h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-red-500'></div>
  </div>
);

async function getBlogPosts() {
  // Check for required environment variables
  if (!Env.GHOST_URL || !Env.GHOST_CONTENT_API_KEY) {
    console.warn('Ghost API configuration missing - GHOST_URL or GHOST_CONTENT_API_KEY not set');
    return [];
  }

  const res = await fetch(
    `${Env.GHOST_URL}/ghost/api/content/posts/?key=${Env.GHOST_CONTENT_API_KEY}&include=tags,authors`,
    { next: { revalidate: 60 } }
  );

  if (!res.ok) {
    console.log({ res });
  }

  const data = await res.json();
  return data.posts;
}

function PostList({ posts }: { posts: any[] }) {
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

export default async function BlogPosts() {
  let posts;

  try {
    posts = await getBlogPosts();
  } catch (error) {
    return (
      <div className='px-4 py-6'>
        <Error message='Failed to load blog posts. Please try again later.' />
      </div>
    );
  }

  return (
    <Suspense fallback={<Loading />}>
      <PostList posts={posts} />
    </Suspense>
  );
}
