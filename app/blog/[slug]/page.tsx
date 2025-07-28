import { BlogPostClient } from '@/components/blog/blog-post-client';
import { Env } from '@/lib/constants/env';
import GhostContentAPI from '@tryghost/content-api';
import { AlertTriangle } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

export const revalidate = 30;

const Error = ({ message }: { message: string }) => (
  <div
    className='mx-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700'
    role='alert'
  >
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

// Only initialize the API if environment variables are present
const api =
  Env.GHOST_URL && Env.GHOST_CONTENT_API_KEY
    ? new GhostContentAPI({
        url: Env.GHOST_URL,
        key: Env.GHOST_CONTENT_API_KEY,
        version: 'v5.0',
        makeRequest: async ({ url, method, params, headers }: any) => {
          const apiUrl = new URL(url);

          Object.keys(params).map((key) =>
            apiUrl.searchParams.set(key, encodeURIComponent(params[key]))
          );

          try {
            const response = await fetch(apiUrl.toString(), {
              method,
              headers,
            });
            const data = await response.json();
            return { data };
          } catch (error) {
            console.error(error);
          }
        },
      })
    : null;

async function getBlogPost(slug: string) {
  // Return null if API is not initialized
  if (!api) {
    console.warn('Ghost API not initialized - missing environment variables');
    return null;
  }

  try {
    return await api.posts.read({ slug }, { include: ['tags', 'authors'] });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    // throw new Error('Failed to fetch blog post');
  }
}

function PostContent({ post }: { post: any }) {
  return <BlogPostClient post={post} />;
}

export default async function BlogPost({
  params,
}: {
  params: { slug: string };
}) {
  let post;

  try {
    post = await getBlogPost(params.slug);
  } catch (error) {
    return (
      <Error message='Failed to load blog post. Please try again later.' />
    );
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

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  try {
    const post = await getBlogPost(params.slug);
    return {
      title: post.title,
      description: post.excerpt,
      openGraph: {
        title: post.title,
        description: post.excerpt,
        type: 'article',
        url: `https://evento.so/blog/${params.slug}`,
        images: [
          {
            url: post.feature_image,
            width: 1200,
            height: 630,
            alt: post.title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: post.excerpt,
        images: [post.feature_image],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Blog Post',
      description: 'Unable to load blog post details',
    };
  }
}
