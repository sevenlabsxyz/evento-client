'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Env } from '@/lib/constants/env';
import { BookOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { WalletEducationalSheet } from './wallet-educational-sheet';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  feature_image: string;
  published_at: string;
  html: string;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  authors: Array<{
    id: string;
    name: string;
    profile_image: string;
  }>;
}

export function WalletEducationalSection() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<BlogPost | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      // Check for required environment variables
      if (!Env.NEXT_PUBLIC_GHOST_URL || !Env.NEXT_PUBLIC_GHOST_CONTENT_API_KEY) {
        console.warn('Ghost API configuration missing - cannot fetch educational content');
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `${Env.NEXT_PUBLIC_GHOST_URL}/ghost/api/content/posts/?key=${Env.NEXT_PUBLIC_GHOST_CONTENT_API_KEY}&filter=tag:wallet&include=tags,authors&limit=10`
        );

        if (!res.ok) {
          console.error('Failed to fetch wallet educational posts:', res.status);
          setIsLoading(false);
          return;
        }

        const data = await res.json();
        setPosts(data.posts || []);
      } catch (error) {
        console.error('Error fetching wallet educational posts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (isLoading) {
    return (
      <div className='space-y-3'>
        <h3 className='font-semibold'>Learn the basics of bitcoin</h3>
        <div className='scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-2'>
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              className='h-60 flex-shrink-0 rounded-2xl'
              style={{ width: '280px' }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return null; // Don't show section if no posts
  }

  return (
    <>
      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <h3 className='font-semibold'>Learn the basics of bitcoin</h3>
          {posts.length > 5 && (
            <button className='text-sm text-gray-600 hover:text-gray-900'>Show more →</button>
          )}
        </div>

        {/* Horizontal scrollable cards */}
        <div className='scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-2'>
          {posts.map((post) => (
            <button
              key={post.id}
              onClick={() => setSelectedArticle(post)}
              className='flex-shrink-0 overflow-hidden rounded-2xl shadow-sm transition-transform hover:scale-[1.02]'
              style={{ width: '280px' }}
            >
              {/* Feature Image */}
              <div className='relative h-40 w-full overflow-hidden bg-gradient-to-br from-purple-400 to-blue-500'>
                {post.feature_image ? (
                  <img
                    src={post.feature_image}
                    alt={post.title}
                    className='h-full w-full object-cover'
                  />
                ) : (
                  <div className='flex h-full w-full items-center justify-center'>
                    <BookOpen className='h-12 w-12 text-white opacity-50' />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className='bg-white p-4 text-left'>
                <h4 className='mb-1 line-clamp-2 text-sm font-semibold text-gray-900'>
                  {post.title}
                </h4>
                {post.excerpt && (
                  <p className='line-clamp-2 text-xs text-gray-600'>{post.excerpt}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Educational Content Modal */}
      <WalletEducationalSheet
        article={selectedArticle}
        open={!!selectedArticle}
        onOpenChange={(open) => !open && setSelectedArticle(null)}
      />
    </>
  );
}
