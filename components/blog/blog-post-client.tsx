'use client';

import { BlogCard } from '@/components/blog/blog-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Env } from '@/lib/constants/env';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import { Scroll } from '@silk-hq/components';
import { ExternalLink, Share } from 'lucide-react';
import { useEffect, useState } from 'react';
import './blog-post.css';
import EnhancedBlogContent from './enhanced-blog-content';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  feature_image: string;
  published_at: string;
  tags: Array<{ name: string }>;
}

interface BlogPostClientProps {
  post: any;
}

const BlogPostClient = ({ post }: BlogPostClientProps) => {
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);

  // Fetch related blog posts
  useEffect(() => {
    if (!post) {
      return;
    }

    const fetchRelatedPosts = async () => {
      try {
        setIsLoadingRelated(true);

        if (!Env.NEXT_PUBLIC_GHOST_URL || !Env.NEXT_PUBLIC_GHOST_CONTENT_API_KEY) {
          return;
        }

        const res = await fetch(
          `${Env.NEXT_PUBLIC_GHOST_URL}/ghost/api/content/posts/?key=${Env.NEXT_PUBLIC_GHOST_CONTENT_API_KEY}&include=tags,authors&limit=4`,
          { next: { revalidate: 60 } }
        );

        if (!res.ok) {
          throw new Error('Failed to fetch related posts');
        }

        const data = await res.json();
        // Filter out the current post and take only 3
        const filtered = (data.posts || [])
          .filter((p: BlogPost) => p.slug !== post.slug)
          .slice(0, 3);
        setRelatedPosts(filtered);
      } catch (err) {
        logger.error('Error fetching related posts', {
          error: err instanceof Error ? err.message : String(err),
        });
      } finally {
        setIsLoadingRelated(false);
      }
    };

    fetchRelatedPosts();
  }, [post?.slug, post]);

  if (!post) return null;

  const authorName = post.authors && post.authors.length > 0 ? post.authors[0].name : 'Evento Team';

  const publishedDate = new Date(post.published_at || '').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleShare = async () => {
    const shareData = {
      title: post.title,
      text: post.excerpt || `Check out this blog post: ${post.title}`,
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
    <div className='min-h-screen bg-gray-50'>
      <Scroll.Root asChild>
        <Scroll.View className='BlogPost-scrollView'>
          <Scroll.Content asChild>
            <article className='BlogPost-article'>
              {post.feature_image ? (
                <div
                  className='BlogPost-illustration'
                  style={{
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${post.feature_image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
              ) : (
                <div className='BlogPost-illustration' />
              )}
              <div className='BlogPost-articleContent'>
                <h1 className='BlogPost-title'>{post.title}</h1>
                {post.excerpt && <h2 className='BlogPost-subtitle'>{post.excerpt}</h2>}
                <div className='BlogPost-author'>
                  by <span className='BlogPost-authorName'>{authorName}</span> • {publishedDate}
                </div>
                <EnhancedBlogContent html={post.html || ''} className='BlogPost-articleBody' />
              </div>

              {/* CTA Section */}
              <div className='w-full px-6 py-8'>
                <div className='relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 to-red-600 p-8 text-white'>
                  <div className='relative z-10 text-center'>
                    <h3 className='mb-3 text-2xl font-bold'>Ready to create your first event?</h3>
                    <p className='mb-6 text-red-100'>
                      Join thousands of event creators who trust Evento to bring their communities
                      together. Start planning your next memorable gathering today.
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
                  {/* Decorative background elements */}
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
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className='h-64 rounded-2xl' />
                      ))}
                    </div>
                  ) : (
                    <div className='grid grid-cols-1 gap-6'>
                      {relatedPosts.map((relatedPost) => (
                        <BlogCard
                          key={relatedPost.id}
                          slug={relatedPost.slug}
                          title={relatedPost.title}
                          description={relatedPost.excerpt}
                          image={relatedPost.feature_image}
                          date={relatedPost.published_at}
                          category={relatedPost.tags?.length > 0 ? [relatedPost.tags[0]] : []}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </article>
          </Scroll.Content>
        </Scroll.View>
      </Scroll.Root>
    </div>
  );
};

export { BlogPostClient };
