'use client';

import { BlogAuthorCard } from '@/components/blog/blog-author-card';
import { BlogPostCard } from '@/components/blog/blog-post-card';
import { BlogPostMeta } from '@/components/blog/blog-post-meta';
import { BLOG_TOC_MIN_HEADINGS, BlogToc } from '@/components/blog/blog-toc';
import EnhancedBlogContent, {
  type BlogContentHeading,
} from '@/components/blog/enhanced-blog-content';
import { Skeleton } from '@/components/ui/skeleton';
import { useGhostPosts } from '@/lib/hooks/use-ghost-posts';
import { useTopBar } from '@/lib/stores/topbar-store';
import { GhostPost, GhostTag } from '@/lib/types/ghost';
import { cn } from '@/lib/utils';
import { getPostExcerpt, getPrimaryVisibleTag, getVisibleTags } from '@/lib/utils/blog';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import { ArrowLeft, ArrowRight, Link2, Share } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

interface BlogPostClientProps {
  post: GhostPost;
}

const RELATED_POST_COUNT = 3;
const RELATED_SKELETON_IDS = ['related-skeleton-1', 'related-skeleton-2', 'related-skeleton-3'];
const DEK_COMPARE_LENGTH = 80;

const ICON_BUTTON_CLASS =
  'inline-flex h-9 items-center justify-center gap-2 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100';

function getTagHref(tag: GhostTag): string {
  return `/e/blog?tag=${encodeURIComponent(tag.slug)}`;
}

/** Strips markup, entities, whitespace and punctuation so prose can be compared loosely. */
function normalizeForComparison(value: string): string {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/&[#a-z0-9]+;/gi, '')
    .toLowerCase()
    .replace(/[\s!-/:-@[-`{-~\u00a0\u2013\u2014\u2018-\u201f\u2026]+/g, '');
}

/**
 * Ghost's automatic excerpt is the opening of the body copy; showing it as a
 * dek would just repeat the first paragraph.
 */
function isDekRedundant(dek: string, html: string | null): boolean {
  const firstParagraph = html?.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1];
  if (!firstParagraph) return false;

  const paragraphText = normalizeForComparison(firstParagraph).slice(0, DEK_COMPARE_LENGTH);
  return paragraphText.length > 0 && normalizeForComparison(dek).startsWith(paragraphText);
}

function selectRelatedPosts(post: GhostPost, candidates: GhostPost[]): GhostPost[] {
  const currentTagSlugs = new Set(getVisibleTags(post).map((tag) => tag.slug));
  const others = candidates.filter((candidate) => candidate.slug !== post.slug);
  const sharingTag = others.filter((candidate) =>
    getVisibleTags(candidate).some((tag) => currentTagSlugs.has(tag.slug))
  );
  const remaining = others.filter((candidate) => !sharingTag.includes(candidate));

  return [...sharingTag, ...remaining].slice(0, RELATED_POST_COUNT);
}

const BlogPostClient = ({ post }: BlogPostClientProps) => {
  const { setTopBar } = useTopBar();
  const [headings, setHeadings] = useState<BlogContentHeading[]>([]);
  const { data: relatedCandidatePosts = [], isLoading: isLoadingRelated } = useGhostPosts({
    limit: 7,
    filter: 'tag:blog',
  });

  const relatedPosts = useMemo(
    () => selectRelatedPosts(post, relatedCandidatePosts),
    [post, relatedCandidatePosts]
  );

  const primaryTag = getPrimaryVisibleTag(post);
  const visibleTags = getVisibleTags(post);
  const excerpt = getPostExcerpt(post);
  const dek = excerpt && !isDekRedundant(excerpt, post.html) ? excerpt : '';
  const hasToc = headings.length >= BLOG_TOC_MIN_HEADINGS;

  useEffect(() => {
    if (!post?.title) return;
    setTopBar({
      leftMode: 'back',
      centerMode: 'title',
      title: 'Blog',
      subtitle: '',
      showAvatar: false,
      buttons: [],
      isOverlaid: false,
      desktopHidden: true,
    });
    return () => {
      setTopBar({ title: '', subtitle: '', buttons: [], desktopHidden: false });
    };
  }, [post?.title, setTopBar]);

  const handleShare = async () => {
    const shareData = {
      title: post.title,
      text: excerpt || `Check out this blog post: ${post.title}`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        logger.info('Share cancelled or failed');
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Blog post link copied to clipboard!');
      } catch (error) {
        toast.error('Failed to share blog post');
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className='min-h-full w-full bg-white dark:bg-neutral-900'>
      <div className='mx-auto w-full max-w-7xl px-4 pb-40 pt-4 md:px-8 md:pb-16 md:pt-8'>
        <article>
          <div className='mx-auto w-full max-w-3xl xl:max-w-5xl'>
            {/* Desktop breadcrumb (the top bar is mobile-only on this page) */}
            <nav aria-label='Breadcrumb' className='hidden items-center gap-2 text-sm md:flex'>
              <Link
                href='/e/blog'
                className='inline-flex items-center gap-1.5 font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-neutral-400 dark:hover:text-neutral-100'
              >
                <ArrowLeft className='h-4 w-4' />
                Blog
              </Link>
              {primaryTag && (
                <>
                  <span aria-hidden='true' className='text-gray-300 dark:text-neutral-700'>
                    /
                  </span>
                  <Link
                    href={getTagHref(primaryTag)}
                    className='truncate text-gray-500 transition-colors hover:text-gray-900 dark:text-neutral-500 dark:hover:text-neutral-100'
                  >
                    {primaryTag.name}
                  </Link>
                </>
              )}
            </nav>

            {/* Article header */}
            <header className='max-w-3xl border-b border-gray-200 pb-8 pt-2 dark:border-neutral-800 md:pb-10 md:pt-12'>
              {primaryTag && (
                <Link
                  href={getTagHref(primaryTag)}
                  className='mb-4 inline-block text-xs font-semibold uppercase tracking-wider text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300'
                >
                  {primaryTag.name}
                </Link>
              )}
              <h1 className='text-balance break-words text-3xl font-bold leading-[1.1] tracking-tight text-gray-900 dark:text-neutral-100 md:text-5xl'>
                {post.title}
              </h1>
              {dek && (
                <p className='mt-4 text-pretty text-lg leading-relaxed text-gray-600 dark:text-neutral-400 md:mt-5 md:text-xl'>
                  {dek}
                </p>
              )}
              <div className='mt-6 flex flex-wrap items-center justify-between gap-4 md:mt-8'>
                <BlogPostMeta post={post} size='md' />
                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    onClick={handleShare}
                    className={cn(ICON_BUTTON_CLASS, 'px-4')}
                  >
                    <Share className='h-4 w-4' />
                    Share
                  </button>
                  <button
                    type='button'
                    onClick={handleCopyLink}
                    aria-label='Copy link'
                    title='Copy link'
                    className={cn(ICON_BUTTON_CLASS, 'w-9')}
                  >
                    <Link2 className='h-4 w-4' />
                  </button>
                </div>
              </div>
            </header>
          </div>

          {/* Feature image: wider than the text column */}
          {post.feature_image && (
            <figure className='mx-auto mt-8 w-full max-w-5xl md:mt-12'>
              <div className='relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-neutral-800 md:rounded-3xl'>
                <Image
                  src={post.feature_image}
                  alt={post.feature_image_alt || post.title}
                  fill
                  className='object-cover object-center'
                  sizes='(max-width: 1024px) 100vw, 1024px'
                  quality={95}
                  priority
                />
              </div>
              {post.feature_image_alt && (
                <figcaption className='mt-3 text-center text-sm text-gray-500 dark:text-neutral-500'>
                  {post.feature_image_alt}
                </figcaption>
              )}
            </figure>
          )}

          {/* Body + desktop rail */}
          <div
            className={cn(
              'mx-auto mt-10 w-full max-w-3xl md:mt-14 xl:max-w-5xl',
              hasToc && 'xl:grid xl:grid-cols-[minmax(0,1fr)_16rem] xl:gap-12'
            )}
          >
            <div className='min-w-0 max-w-[68ch]'>
              <EnhancedBlogContent
                html={post.html || ''}
                onHeadingsChange={setHeadings}
                className='typeset typeset-evento-article'
              />

              {(visibleTags.length > 0 || post.primary_author) && (
                <footer className='mt-14 space-y-8 border-t border-gray-200 pt-8 dark:border-neutral-800'>
                  {visibleTags.length > 0 && (
                    <ul aria-label='Tags' className='flex flex-wrap gap-2'>
                      {visibleTags.map((tag) => (
                        <li key={tag.id}>
                          <Link
                            href={getTagHref(tag)}
                            className='inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'
                          >
                            {tag.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  {post.primary_author && <BlogAuthorCard author={post.primary_author} />}
                </footer>
              )}
            </div>

            {hasToc && (
              <aside className='hidden xl:sticky xl:top-8 xl:block xl:w-64 xl:self-start'>
                <div className='space-y-6'>
                  <BlogToc headings={headings} />
                  <div className='rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'>
                    <p className='text-sm font-semibold text-gray-900 dark:text-neutral-100'>
                      Enjoying this article?
                    </p>
                    <p className='mt-1 text-sm text-gray-600 dark:text-neutral-400'>
                      Pass it along to someone who&apos;d like it.
                    </p>
                    <div className='mt-3 flex items-center gap-2'>
                      <button
                        type='button'
                        onClick={handleShare}
                        className={cn(ICON_BUTTON_CLASS, 'flex-1 px-3')}
                      >
                        <Share className='h-4 w-4' />
                        Share
                      </button>
                      <button
                        type='button'
                        onClick={handleCopyLink}
                        aria-label='Copy link'
                        title='Copy link'
                        className={cn(ICON_BUTTON_CLASS, 'w-9')}
                      >
                        <Link2 className='h-4 w-4' />
                      </button>
                    </div>
                  </div>
                </div>
              </aside>
            )}
          </div>
        </article>

        {/* Keep reading */}
        {(isLoadingRelated || relatedPosts.length > 0) && (
          <section
            aria-labelledby='keep-reading-heading'
            className='mx-auto mt-16 w-full max-w-5xl border-t border-gray-200 pt-10 dark:border-neutral-800 md:mt-20 md:pt-12'
          >
            <div className='mb-6 flex items-center justify-between gap-4'>
              <h2
                id='keep-reading-heading'
                className='text-xl font-bold tracking-tight text-gray-900 dark:text-neutral-100 md:text-2xl'
              >
                Keep reading
              </h2>
              <Link
                href='/e/blog'
                className='inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-neutral-400 dark:hover:text-neutral-100'
              >
                All posts
                <ArrowRight className='h-4 w-4' />
              </Link>
            </div>
            <div className='grid gap-8 sm:grid-cols-2 lg:grid-cols-3'>
              {isLoadingRelated
                ? RELATED_SKELETON_IDS.map((skeletonId) => (
                    <div key={skeletonId} className='space-y-3'>
                      <Skeleton className='aspect-video w-full rounded-2xl' />
                      <Skeleton className='h-3 w-16' />
                      <Skeleton className='h-5 w-4/5' />
                      <Skeleton className='h-4 w-full' />
                    </div>
                  ))
                : relatedPosts.map((relatedPost) => (
                    <BlogPostCard key={relatedPost.id} post={relatedPost} />
                  ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export { BlogPostClient };
