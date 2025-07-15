import { BlogCard } from "@/components/blog/card";
import { HubSectionTitle } from "@/components/hub/hub-section-title";
import GhostContentAPI from "@tryghost/content-api";
import { AlertTriangle, PenTool } from "lucide-react";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

const Error = ({ message }: { message: string }) => (
  <div
    className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4"
    role="alert"
  >
    <div className="flex items-center">
      <AlertTriangle className="mr-2" />
      <p className="font-bold">Error</p>
    </div>
    <p>{message}</p>
  </div>
);

const Loading = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
  </div>
);

async function getBlogPosts() {
  const res = await fetch(
    `${process.env.GHOST_URL}/ghost/api/content/posts/?key=${process.env.GHOST_CONTENT_API_KEY}&include=tags,authors`,
    { next: { revalidate: 60 } }
  );

  if (!res.ok) {
    console.log({ res });
  }

  const data = await res.json();
  return data.posts;
}

function PostList({ posts }: { posts: any[] }) {
  return (
    <>
      <div className="mx-auto max-w-[1200px] px-4 md:px-0">
        <div className="mb-4 md:mb-8">
          <div className="flex items-center gap-2">
            <PenTool className="h-6 w-6 md:h-8 md:w-8" />
            <div className="flex items-center gap-2">
              <h4 className="text-3xl md:text-4xl font-medium">Blog</h4>
            </div>
          </div>
          <div className="text-base text-gray-500 mt-2">
            Latest stories, news, and updates.
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1200px] w-full flex-col">
        {(posts || []).map((post: any) => (
          <BlogCard
            key={post.id}
            slug={post.slug}
            title={post.title}
            date={post.published_at}
            category={post.category}
            image={post.feature_image}
            description={post.excerpt}
          />
        ))}
      </div>
    </>
  );
}

export default async function BlogPosts() {
  let posts;

  try {
    posts = await getBlogPosts();
  } catch (error) {
    return (
      <Error message="Failed to load blog posts. Please try again later." />
    );
  }

  return (
    <div className="">
      <Suspense fallback={<Loading />}>
        <PostList posts={posts} />
      </Suspense>
    </div>
  );
}
