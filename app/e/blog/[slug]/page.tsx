import { BlogPostClient } from '@/components/blog/blog-post-client';
import { Skeleton } from '@/components/ui/skeleton';
import { ghostService } from '@/lib/services/ghost';
import { GhostPost } from '@/lib/types/ghost';
import { logger } from '@/lib/utils/logger';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

export const revalidate = 30;

const PAGE_BACKGROUND_CLASS = 'min-h-full w-full bg-white dark:bg-neutral-900';
const PAGE_CONTAINER_CLASS = 'mx-auto w-full max-w-7xl px-4 pb-40 pt-4 md:px-8 md:pb-16 md:pt-8';

const ErrorAlert = ({ message }: { message: string }) => {
  const t = useTranslations('blog');

  return (
    <div className={PAGE_BACKGROUND_CLASS}>
      <div className={PAGE_CONTAINER_CLASS}>
        <div
          className='mx-auto w-full max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400'
          role='alert'
        >
          <div className='mb-1 flex items-center gap-2'>
            <AlertTriangle className='h-5 w-5' />
            <p className='font-semibold'>{t('post.loadErrorTitle')}</p>
          </div>
          <p className='text-sm text-red-700/90 dark:text-red-400/90'>{message}</p>
          <Link
            href='/e/blog'
            className='mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-red-700 hover:underline dark:text-red-300'
          >
            <ArrowLeft className='h-4 w-4' />
            {t('post.backToBlog')}
          </Link>
        </div>
      </div>
    </div>
  );
};

const Loading = () => {
  const t = useTranslations('blog');

  return (
    <div className={PAGE_BACKGROUND_CLASS} aria-busy='true' aria-label={t('post.loading')}>
      <div className={PAGE_CONTAINER_CLASS}>
        <div className='mx-auto w-full max-w-3xl xl:max-w-5xl'>
          <Skeleton className='hidden h-4 w-24 md:block' />
          <div className='max-w-3xl space-y-4 border-b border-gray-200 pb-8 pt-2 dark:border-neutral-800 md:pb-10 md:pt-12'>
            <Skeleton className='h-3 w-20' />
            <Skeleton className='h-9 w-full md:h-12' />
            <Skeleton className='h-9 w-2/3 md:h-12' />
            <Skeleton className='h-5 w-5/6' />
            <div className='flex items-center gap-3 pt-4'>
              <Skeleton className='h-10 w-10 rounded-full' />
              <div className='space-y-2'>
                <Skeleton className='h-3.5 w-28' />
                <Skeleton className='h-3 w-40' />
              </div>
            </div>
          </div>
        </div>
        <Skeleton className='mx-auto mt-8 aspect-[16/9] w-full max-w-5xl rounded-2xl md:mt-12 md:rounded-3xl' />
        <div className='mx-auto mt-10 w-full max-w-3xl space-y-3 md:mt-14 xl:max-w-5xl'>
          <div className='max-w-[68ch] space-y-3'>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-11/12' />
            <Skeleton className='h-4 w-4/5' />
          </div>
        </div>
      </div>
    </div>
  );
};

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

export default async function BlogPost({ params }: { params: { slug: string } }) {
  let post: GhostPost | null = null;

  try {
    post = await getBlogPost(params.slug);
  } catch (error) {
    const t = await getTranslations('blog');
    return <ErrorAlert message={t('post.loadErrorMessage')} />;
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

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const t = await getTranslations('blog');

  try {
    const post = await getBlogPost(params.slug);

    if (!post) {
      return {
        title: t('meta.postFallbackTitle'),
        description: t('meta.postUnavailable'),
      };
    }

    const postDescription = post.excerpt ?? t('meta.postFallbackDescription');
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
      title: t('meta.postFallbackTitle'),
      description: t('meta.postUnavailable'),
    };
  }
}
