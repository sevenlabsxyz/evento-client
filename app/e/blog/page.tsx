import { ghostService } from '@/lib/services/ghost';
import { GhostPost } from '@/lib/types/ghost';
import { logger } from '@/lib/utils/logger';
import { AlertTriangle } from 'lucide-react';
import { Suspense } from 'react';
import PostPageClient from './page-client';

export const dynamic = 'force-dynamic';

const ErrorAlert = ({ message }: { message: string }) => (
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
  try {
    const data = await ghostService.getPosts({ filter: 'tag:blog' });
    return data.posts;
  } catch (error) {
    logger.warn('Ghost API configuration missing or unavailable', {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

export default async function BlogPosts() {
  let posts: GhostPost[] = [];

  try {
    posts = await getBlogPosts();
  } catch (error) {
    return (
      <div className='px-4 py-6'>
        <ErrorAlert message='Failed to load blog posts. Please try again later.' />
      </div>
    );
  }

  return (
    <Suspense fallback={<Loading />}>
      <PostPageClient posts={posts} />
    </Suspense>
  );
}
