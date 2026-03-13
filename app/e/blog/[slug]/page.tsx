import { BlogPostClient } from '@/components/blog/blog-post-client';
import { ghostService } from '@/lib/services/ghost';
import { GhostPost } from '@/lib/types/ghost';
import { logger } from '@/lib/utils/logger';
import { AlertTriangle } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

export const revalidate = 30;

const ErrorAlert = ({ message }: { message: string }) => (
  <div className='mx-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700' role='alert'>
    <div className='mb-1 flex items-center gap-2'>
      <AlertTriangle className='h-5 w-5' />
      <p className='font-semibold'>Error</p>
    </div>
    <p className='text-sm'>{message}</p>
  </div>
);

const Loading = () => (
  <div className='flex h-screen items-center justify-center'>
    <div className='h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-red-500'></div>
  </div>
);

async function getBlogPost(slug: string): Promise<GhostPost | null> {
  try {
    return await ghostService.getPostBySlug(slug);
  } catch (error) {
    logger.error('Error fetching blog post', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

function PostContent({ post }: { post: GhostPost }) {
  return <BlogPostClient post={post} />;
}

export default async function BlogPost(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  let post: GhostPost | null = null;

  try {
    post = await getBlogPost(params.slug);
  } catch (error) {
    return <ErrorAlert message='Failed to load blog post. Please try again later.' />;
  }

  if (!post) {
    notFound();
  }

  return (
    <Suspense fallback={<Loading />}>
      <PostContent post={post} />
    </Suspense>
  );
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  try {
    const post = await getBlogPost(params.slug);

    if (!post) {
      return {
        title: 'Blog Post',
        description: 'Unable to load blog post details',
      };
    }

    const postDescription = post.excerpt ?? 'Read this blog post on Evento.';
    const postImages = post.feature_image
      ? [
          {
            url: post.feature_image,
            width: 1200,
            height: 630,
            alt: post.title,
          },
        ]
      : [];

    return {
      title: post.title,
      description: postDescription,
      openGraph: {
        title: post.title,
        description: postDescription,
        type: 'article',
        url: `https://evento.so/e/blog/${params.slug}`,
        images: postImages,
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: postDescription,
        images: post.feature_image ? [post.feature_image] : [],
      },
    };
  } catch (error) {
    logger.error('Error generating metadata', {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      title: 'Blog Post',
      description: 'Unable to load blog post details',
    };
  }
}
