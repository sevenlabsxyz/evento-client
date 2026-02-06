'use client';

import { ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Env } from '@/lib/constants/env';
import { logger } from '@/lib/utils/logger';
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

export function WalletEducationList() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<BlogPost | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Fetch blog posts from Ghost API
  useEffect(() => {
    const fetchPosts = async () => {
      // Check for required environment variables
      if (!Env.NEXT_PUBLIC_GHOST_URL || !Env.NEXT_PUBLIC_GHOST_CONTENT_API_KEY) {
        logger.warn('Ghost API configuration missing - cannot fetch educational content');
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `${Env.NEXT_PUBLIC_GHOST_URL}/ghost/api/content/posts/?key=${Env.NEXT_PUBLIC_GHOST_CONTENT_API_KEY}&filter=tag:wallet&include=tags,authors&limit=10`
        );

        if (!res.ok) {
          logger.error('Failed to fetch wallet educational posts', { status: res.status });
          setIsLoading(false);
          return;
        }

        const data = await res.json();
        setPosts(data.posts || []);
      } catch (error) {
        logger.error('Error fetching wallet educational posts', {
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className='space-y-3'>
        <h3 className='text-base font-semibold text-muted-foreground'>Bitcoin Basics</h3>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className='h-14 w-full rounded-2xl' />
        ))}
      </div>
    );
  }

  // Don't show section if no posts
  if (posts.length === 0) {
    return null;
  }

  return (
    <>
      <div className='space-y-3'>
        <h3 className='text-sm font-semibold'>Bitcoin Basics</h3>
        {posts.map((post) => (
          <Card
            key={post.id}
            className='cursor-pointer rounded-2xl bg-gray-50 transition-colors hover:bg-gray-100'
            onClick={() => {
              setSelectedArticle(post);
              setIsSheetOpen(true);
            }}
          >
            <CardContent className='flex items-center justify-between p-4'>
              <span className='text-left font-medium'>{post.title}</span>
              <ChevronRight className='h-5 w-5 flex-shrink-0 text-muted-foreground' />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Educational Content Modal */}
      <WalletEducationalSheet
        article={selectedArticle}
        open={isSheetOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsSheetOpen(false);
            // Delay clearing to allow exit animation to complete
            setTimeout(() => setSelectedArticle(null), 400);
          }
        }}
      />
    </>
  );
}
