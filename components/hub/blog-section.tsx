'use client';

import { BlogCard } from '@/components/blog/blog-card';
import { Button } from '@/components/ui/button';
import { Env } from '@/lib/constants/env';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  feature_image: string;
  published_at: string;
  tags: Array<{ name: string }>;
}

export function BlogSection() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        // Check for required environment variables
        if (!Env.NEXT_PUBLIC_GHOST_URL || !Env.NEXT_PUBLIC_GHOST_CONTENT_API_KEY) {
          console.warn('Ghost API configuration missing');
          setError('Blog feature is currently unavailable');
          return;
        }

        const res = await fetch(
          `${Env.NEXT_PUBLIC_GHOST_URL}/ghost/api/content/posts/?key=${Env.NEXT_PUBLIC_GHOST_CONTENT_API_KEY}&include=tags,authors&limit=6`,
          { next: { revalidate: 60 } }
        );

        if (!res.ok) {
          throw new Error('Failed to fetch blog posts');
        }

        const data = await res.json();
        setPosts(data.posts || []);
      } catch (err) {
        console.error('Error fetching blog posts:', err);
        setError('Failed to load blog posts. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogPosts();
  }, []);

  if (isLoading) {
    return (
      <div className='flex flex-col gap-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold'>From our blog</h2>
        </div>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {[...Array(3)].map((_, i) => (
            <div key={i} className='h-64 animate-pulse rounded-lg bg-gray-100'></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || posts.length === 0) {
    return null; // Don't show anything if there's an error or no posts
  }

  return (
    <div className='flex flex-col gap-4 pb-8'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold'>From our blog</h2>
        <Button asChild variant='outline' size='sm'>
          <Link href='/blog'>
            View all <ArrowRight className='h-4 w-4' />
          </Link>
        </Button>
      </div>
      <div className='grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3'>
        {posts
          .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
          .slice(0, 3)
          .map((post) => (
            <BlogCard
              key={post.id}
              slug={post.slug}
              title={post.title}
              description={post.excerpt}
              image={post.feature_image}
              date={post.published_at}
              category={post.tags?.length > 0 ? [post.tags[0]] : []}
            />
          ))}
      </div>
    </div>
  );
}
