import { Env } from '@/lib/constants/env';
import { logger } from '@/lib/utils/logger';
import { AlertTriangle } from 'lucide-react';
import { Suspense } from 'react';
import PostPageClient from './page-client';

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
  if (!Env.NEXT_PUBLIC_GHOST_URL || !Env.NEXT_PUBLIC_GHOST_CONTENT_API_KEY) {
    logger.warn('Ghost API configuration missing - GHOST_URL or GHOST_CONTENT_API_KEY not set');
    return [];
  }

  const res = await fetch(
    `${Env.NEXT_PUBLIC_GHOST_URL}/ghost/api/content/posts/?key=${Env.NEXT_PUBLIC_GHOST_CONTENT_API_KEY}&include=tags,authors`,
    { next: { revalidate: 60 } }
  );

  if (!res.ok) {
    logger.debug('Blog posts fetch response', { res });
  }

  const data = await res.json();
  return data.posts;
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
      <PostPageClient posts={posts} />
    </Suspense>
  );
}
