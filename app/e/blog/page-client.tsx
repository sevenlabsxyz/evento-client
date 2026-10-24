'use client';

import { BlogFeaturedPost } from '@/components/blog/blog-featured-post';
import { BlogPostCard } from '@/components/blog/blog-post-card';
import { Button } from '@/components/ui/button';
import { useTopBar } from '@/lib/stores/topbar-store';
import { GhostPost } from '@/lib/types/ghost';
import { cn } from '@/lib/utils';
import { getVisibleTags } from '@/lib/utils/blog';
import { AlertTriangle, Newspaper } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

const BLOG_PATHNAME = '/e/blog';
const MAX_TAG_CHIPS = 8;
const PAGE_BACKGROUND_CLASS = 'min-h-full w-full bg-white dark:bg-neutral-900';
const PAGE_CONTAINER_CLASS = 'mx-auto w-full max-w-7xl px-4 pb-40 pt-6 md:px-8 md:pb-16 md:pt-10';

interface TagOption {
  slug: string;
  name: string;
  count: number;
}

interface BlogPageClientProps {
  posts: GhostPost[];
  loadFailed: boolean;
  initialTag: string | null;
}

/** Visible tags across all posts, most used first (ties alphabetical). */
function collectTagOptions(posts: GhostPost[]): TagOption[] {
  const options = new Map<string, TagOption>();
  for (const post of posts) {
    for (const tag of getVisibleTags(post)) {
      const existing = options.get(tag.slug);
      if (existing) {
        existing.count += 1;
      } else {
        options.set(tag.slug, { slug: tag.slug, name: tag.name, count: 1 });
      }
    }
  }
  return Array.from(options.values()).sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name)
  );
}

function syncTagParam(tagSlug: string | null) {
  const url = new URL(window.location.href);
  if (tagSlug) {
    url.searchParams.set('tag', tagSlug);
  } else {
    url.searchParams.delete('tag');
  }
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}

function BlogPageHeader({ postCount }: { postCount: number }) {
  const t = useTranslations('blog');

  return (
    <header className='flex flex-col gap-4 border-b border-gray-200 pb-8 dark:border-neutral-800 md:flex-row md:items-end md:justify-between md:gap-8'>
      <div className='min-w-0 max-w-2xl'>
        <p className='text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400'>
          {t('index.eyebrow')}
        </p>
        <h1 className='mt-2 text-balance text-3xl font-bold tracking-tight text-gray-900 dark:text-neutral-100 md:text-4xl'>
          {t('index.title')}
        </h1>
        <p className='mt-3 text-base text-gray-600 dark:text-neutral-400'>{t('index.subtitle')}</p>
      </div>
      {postCount > 0 && (
        <p className='hidden shrink-0 text-right md:block'>
          <span className='block text-3xl font-semibold tabular-nums tracking-tight text-gray-900 dark:text-neutral-100'>
            {postCount}
          </span>
          <span className='text-sm text-gray-500 dark:text-neutral-500'>
            {t('index.storyCount', { count: postCount })}
          </span>
        </p>
      )}
    </header>
  );
}

function TagFilter({
  options,
  selectedSlug,
  onSelect,
}: {
  options: TagOption[];
  selectedSlug: string | null;
  onSelect: (slug: string | null) => void;
}) {
  const t = useTranslations('blog');
  const chips: { slug: string | null; name: string }[] = [
    { slug: null, name: t('index.allTopics') },
    ...options,
  ];

  return (
    <div className='scrollbar-hide -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0'>
      <div
        role='group'
        aria-label={t('index.filterLabel')}
        className='flex w-fit items-center gap-1 rounded-full border border-gray-200 bg-white p-1 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none'
      >
        {chips.map((chip) => {
          const isSelected = chip.slug === selectedSlug;
          return (
            <button
              key={chip.slug ?? 'all'}
              type='button'
              aria-pressed={isSelected}
              onClick={() => onSelect(chip.slug)}
              className={cn(
                'whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500',
                isSelected
                  ? 'bg-gray-100 text-red-600 dark:bg-neutral-800 dark:text-red-400'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'
              )}
            >
              {chip.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BlogEmptyState({
  title,
  description,
  onShowAll,
}: {
  title: string;
  description: string;
  onShowAll?: () => void;
}) {
  const t = useTranslations('blog');

  return (
    <div className='flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center dark:border-neutral-800 dark:bg-neutral-900'>
      <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-white text-gray-500 shadow-sm dark:bg-neutral-800 dark:text-neutral-300 dark:shadow-none'>
        <Newspaper className='h-6 w-6' aria-hidden='true' />
      </div>
      <h2 className='mt-4 text-lg font-semibold text-gray-900 dark:text-neutral-100'>{title}</h2>
      <p className='mt-1 max-w-sm text-sm text-gray-600 dark:text-neutral-400'>{description}</p>
      {onShowAll && (
        <Button
          type='button'
          variant='outline'
          onClick={onShowAll}
          className='mt-5 rounded-full dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700'
        >
          {t('index.viewAllStories')}
        </Button>
      )}
    </div>
  );
}

function BlogLoadError() {
  const t = useTranslations('blog');

  return (
    <div
      role='alert'
      className='rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400'
    >
      <div className='mb-1 flex items-center gap-2 text-base font-semibold'>
        <AlertTriangle className='h-5 w-5' aria-hidden='true' />
        {t('index.loadErrorTitle')}
      </div>
      <p className='text-sm text-amber-800 dark:text-amber-400'>
        {t('index.loadErrorDescription')}
      </p>
    </div>
  );
}

export default function BlogPageClient({ posts, loadFailed, initialTag }: BlogPageClientProps) {
  const t = useTranslations('blog');
  const { applyRouteConfig, setTopBarForRoute, clearRoute } = useTopBar();
  const [selectedTag, setSelectedTag] = useState<string | null>(initialTag);

  useEffect(() => {
    applyRouteConfig(BLOG_PATHNAME);

    setTopBarForRoute(BLOG_PATHNAME, {
      title: t('topBarTitle'),
      subtitle: '',
      leftMode: 'menu',
      centerMode: 'title',
      showAvatar: true,
      desktopHidden: true,
      isOverlaid: false,
      buttons: [],
      badge: undefined,
    });

    return () => {
      clearRoute(BLOG_PATHNAME);
    };
  }, [applyRouteConfig, setTopBarForRoute, clearRoute, t]);

  const tagOptions = useMemo(() => collectTagOptions(posts), [posts]);

  const chipOptions = useMemo(() => {
    const topOptions = tagOptions.slice(0, MAX_TAG_CHIPS);
    // A deep-linked tag outside the top list still gets a chip so the selection is visible.
    const selectedOption = tagOptions.find((option) => option.slug === selectedTag);
    if (selectedOption && !topOptions.includes(selectedOption)) {
      return [...topOptions, selectedOption];
    }
    return topOptions;
  }, [tagOptions, selectedTag]);

  const filteredPosts = useMemo(
    () =>
      selectedTag
        ? posts.filter((post) => getVisibleTags(post).some((tag) => tag.slug === selectedTag))
        : posts,
    [posts, selectedTag]
  );

  const handleSelectTag = (slug: string | null) => {
    setSelectedTag(slug);
    syncTagParam(slug);
  };

  const selectedTagName = tagOptions.find((option) => option.slug === selectedTag)?.name ?? null;
  const featuredPost = selectedTag
    ? (filteredPosts[0] ?? null)
    : (filteredPosts.find((post) => post.featured) ?? filteredPosts[0] ?? null);
  const remainingPosts = featuredPost
    ? filteredPosts.filter((post) => post.id !== featuredPost.id)
    : [];

  const renderContent = () => {
    if (loadFailed) {
      return <BlogLoadError />;
    }
    if (posts.length === 0) {
      return (
        <BlogEmptyState title={t('index.emptyTitle')} description={t('index.emptyDescription')} />
      );
    }
    if (!featuredPost) {
      return (
        <BlogEmptyState
          title={
            selectedTagName
              ? t('index.noStoriesInTag', { tag: selectedTagName })
              : t('index.noStoriesInTopic')
          }
          description={t('index.emptyTopicDescription')}
          onShowAll={() => handleSelectTag(null)}
        />
      );
    }

    return (
      <>
        <BlogFeaturedPost post={featuredPost} />
        {remainingPosts.length > 0 && (
          <section aria-labelledby='blog-more-heading' className='mt-12'>
            <h2
              id='blog-more-heading'
              className='mb-5 text-xl font-semibold text-gray-900 dark:text-neutral-100'
            >
              {selectedTagName
                ? t('index.moreInTag', { tag: selectedTagName })
                : t('index.moreStories')}
            </h2>
            <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
              {remainingPosts.map((post) => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>
          </section>
        )}
      </>
    );
  };

  return (
    <div className={PAGE_BACKGROUND_CLASS}>
      <div className={PAGE_CONTAINER_CLASS}>
        <BlogPageHeader postCount={posts.length} />
        {chipOptions.length > 0 && (
          <div className='mt-6'>
            <TagFilter
              options={chipOptions}
              selectedSlug={selectedTag}
              onSelect={handleSelectTag}
            />
          </div>
        )}
        <div className='mt-6'>{renderContent()}</div>
      </div>
    </div>
  );
}
