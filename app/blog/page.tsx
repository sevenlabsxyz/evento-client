import { BlogCard } from "@/components/blog/card";
import GhostContentAPI from "@tryghost/content-api";
import { AlertTriangle } from "lucide-react";
import { Suspense } from "react";
import { Env } from "@/lib/constants/env";

export const dynamic = "force-dynamic";

const Error = ({ message }: { message: string }) => (
  <div
    className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg"
    role="alert"
  >
    <div className="flex items-center gap-2 mb-1">
      <AlertTriangle className="h-5 w-5" />
      <p className="font-semibold">Error</p>
    </div>
    <p className="text-sm">{message}</p>
  </div>
);

const Loading = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
  </div>
);

async function getBlogPosts() {
  // Check for required environment variables
  if (!Env.GHOST_URL || !Env.GHOST_CONTENT_API_KEY) {
    console.warn("Ghost API configuration missing - GHOST_URL or GHOST_CONTENT_API_KEY not set");
    return [];
  }

  const res = await fetch(
    `${Env.GHOST_URL}/ghost/api/content/posts/?key=${Env.GHOST_CONTENT_API_KEY}&include=tags,authors`,
    { next: { revalidate: 60 } }
  );

  if (!res.ok) {
    console.log({ res });
  }

  const data = await res.json();
  return data.posts;
}

function PostList({ posts }: { posts: any[] }) {
  if (!posts || posts.length === 0) {
    return (
      <div className="px-4 py-12 text-center">
        <div className="bg-gray-100 rounded-lg p-8">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No posts yet</h3>
          <p className="text-gray-500">Check back soon for new content!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="flex flex-col space-y-4">
        {posts.map((post: any) => (
          <BlogCard
            key={post.id}
            slug={post.slug}
            title={post.title}
            date={post.published_at}
            category={post.tags}
            image={post.feature_image}
            description={post.excerpt}
          />
        ))}
      </div>
    </div>
  );
}

export default async function BlogPosts() {
  let posts;

  try {
    posts = await getBlogPosts();
  } catch (error) {
    return (
      <div className="px-4 py-6">
        <Error message="Failed to load blog posts. Please try again later." />
      </div>
    );
  }

  return (
    <Suspense fallback={<Loading />}>
      <PostList posts={posts} />
    </Suspense>
  );
}
