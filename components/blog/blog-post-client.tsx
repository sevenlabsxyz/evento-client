'use client';

import { BlogCard } from '@/components/blog/blog-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useGhostPosts } from '@/lib/hooks/use-ghost-posts';
import { useTopBar } from '@/lib/stores/topbar-store';
import { logger } from '@/lib/utils/logger';
import { GhostPost } from '@/lib/types/ghost';
import { toast } from '@/lib/utils/toast';
import { ExternalLink, Share } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo } from 'react';
import EnhancedBlogContent from './enhanced-blog-content';

interface BlogPostClientProps {
  post: GhostPost;
}

const BlogPostClient = ({ post }: BlogPostClientProps) => {
  const { setTopBar } = useTopBar();
  const { data: relatedCandidatePosts = [], isLoading: isLoadingRelated } = useGhostPosts({ limit: 4 });

  const relatedPosts = useMemo(
    () => relatedCandidatePosts.filter((candidatePost) => candidatePost.slug !== post.slug).slice(0, 3),
    [post.slug, relatedCandidatePosts]
  );

  // Set TopBar title to post title
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
    });
    return () => {
      setTopBar({ title: '', subtitle: '', buttons: [] });
    };
  }, [post?.title, setTopBar]);

  const authorName = post.authors?.[0]?.name ?? 'Evento Team';

  const publishedDate = new Date(post.published_at || '').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleShare = async () => {
    const shareData = {
      title: post.title,
      text: post.excerpt ?? `Check out this blog post: ${post.title}`,
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

  return (
    <article className='mx-auto grid w-full max-w-[860px]'>
      {post.feature_image ? (
        <div className='relative mx-4 mt-4 aspect-video w-[calc(100%-2rem)] overflow-hidden rounded-xl bg-gray-100'>
          <Image
            src={post.feature_image}
            alt={post.title}
            fill
            className='object-cover object-center'
            sizes='(max-width: 860px) 100vw, 860px'
            priority
          />
          <div className='absolute inset-0 bg-black/30' />
        </div>
      ) : (
        <div className='relative mx-4 mt-4 aspect-video w-[calc(100%-2rem)] overflow-hidden rounded-xl bg-gray-100' />
      )}
      <div className='grid w-[min(calc(100%-3rem),800px)] place-content-start justify-self-center py-7 pb-8 lg:py-14'>
        <h1 className='mb-3 mt-0 text-balance text-3xl font-extrabold leading-tight text-gray-900 lg:mb-6 lg:text-5xl'>
          {post.title}
        </h1>
        {post.excerpt && (
          <h2 className='m-0 text-balance text-xl font-medium leading-snug text-gray-500 lg:text-2xl'>
            {post.excerpt}
          </h2>
        )}
        <div className='mt-4 text-sm text-gray-500 lg:mt-6'>
          by <span className='font-medium text-gray-600'>{authorName}</span> • {publishedDate}
        </div>
        <EnhancedBlogContent
          html={post.html || ''}
          className='mt-9 max-w-none text-lg leading-relaxed text-gray-800 lg:mt-14 [&_a]:text-red-600 hover:[&_a]:text-red-700 [&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-200 [&_blockquote]:pl-6 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm [&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:text-4xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h2]:mt-8 [&_h2]:mb-4 [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h3]:mt-8 [&_h3]:mb-4 [&_h3]:text-2xl [&_h3]:font-bold [&_h3]:text-gray-900 [&_img]:my-2 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg [&_li]:mb-2 [&_ol]:mb-5 [&_ol]:pl-8 [&_p]:mb-5 [&_pre]:mb-5 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-gray-50 [&_pre]:p-4 [&_ul]:mb-5 [&_ul]:pl-8'
        />
      </div>

      {/* CTA Section */}
      <div className='w-full px-6 py-8'>
        <div className='relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 to-red-600 p-8 text-white'>
          <div className='relative z-10 text-center'>
            <h3 className='mb-3 text-2xl font-bold'>Ready to create your first event?</h3>
            <p className='mb-6 text-red-100'>
              Join thousands of event creators who trust Evento to bring their communities together.
              Start planning your next memorable gathering today.
            </p>
            <Button
              onClick={() =>
                window.open('https://cal.com/evento/all', '_blank', 'noopener noreferrer')
              }
              className='bg-white text-red-600 hover:bg-gray-100'
            >
              <ExternalLink className='mr-2 h-4 w-4' />
              Get in touch
            </Button>
          </div>
          <div className='absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10' />
          <div className='absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-white/5' />
        </div>
      </div>

      {/* Share Button */}
      <div className='w-full border-t border-gray-200 px-6 py-6'>
        <Button
          onClick={handleShare}
          variant='secondary'
          className='w-full border border-gray-200 py-6 text-base'
        >
          <Share className='mr-2 h-4 w-4' />
          Share Post
        </Button>
      </div>

      {/* Read More Section */}
      {relatedPosts.length > 0 && (
        <div className='w-full border-t border-gray-200 px-6 py-8'>
          <h3 className='mb-6 text-xl font-bold text-gray-900'>Read more</h3>
          {isLoadingRelated ? (
            <div className='grid grid-cols-1 gap-6'>
              {['related-skeleton-1', 'related-skeleton-2', 'related-skeleton-3'].map((skeletonId) => (
                <Skeleton key={skeletonId} className='h-64 rounded-2xl' />
              ))}
            </div>
          ) : (
            <div className='grid grid-cols-1 gap-6'>
              {relatedPosts.map((relatedPost) => (
                <BlogCard
                  key={relatedPost.id}
                  slug={relatedPost.slug}
                  title={relatedPost.title}
                  description={relatedPost.excerpt ?? ''}
                  image={relatedPost.feature_image ?? ''}
                  date={relatedPost.published_at}
                  category={relatedPost.tags?.length > 0 ? [relatedPost.tags[0]] : []}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
};

export { BlogPostClient };
