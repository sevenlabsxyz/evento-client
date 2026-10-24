import { BlogPageSkeleton } from '@/components/blog/blog-skeleton';
import { ghostService } from '@/lib/services/ghost';
import { GhostPost } from '@/lib/types/ghost';
import { logger } from '@/lib/utils/logger';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import BlogPageClient from './page-client';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('blog');
  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

interface BlogPageProps {
  searchParams: { tag?: string | string[] };
}

async function getBlogPosts(): Promise<GhostPost[] | null> {
  try {
    const data = await ghostService.getPosts({ filter: 'tag:blog', limit: 'all' });
    return data.posts;
  } catch (error) {
    logger.warn('Ghost API configuration missing or unavailable', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

async function BlogPosts({ initialTag }: { initialTag: string | null }) {
  const posts = await getBlogPosts();

  return <BlogPageClient posts={posts ?? []} loadFailed={posts === null} initialTag={initialTag} />;
}

export default function BlogPage({ searchParams }: BlogPageProps) {
  const tagParam = Array.isArray(searchParams.tag) ? searchParams.tag[0] : searchParams.tag;
  const initialTag = tagParam?.trim() || null;

  return (
    <Suspense fallback={<BlogPageSkeleton />}>
      <BlogPosts initialTag={initialTag} />
    </Suspense>
  );
}
