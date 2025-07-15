import GhostContentAPI from "@tryghost/content-api";
import { AlertTriangle } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";

export const revalidate = 30;

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

// Check for required environment variables
const GHOST_URL = process.env.GHOST_URL;
const GHOST_CONTENT_API_KEY = process.env.GHOST_CONTENT_API_KEY;

// Only initialize the API if environment variables are present
const api = GHOST_URL && GHOST_CONTENT_API_KEY ? new GhostContentAPI({
  url: GHOST_URL,
  key: GHOST_CONTENT_API_KEY,
  version: "v5.0",
  makeRequest: async ({ url, method, params, headers }: any) => {
    const apiUrl = new URL(url);

    Object.keys(params).map((key) =>
      apiUrl.searchParams.set(key, encodeURIComponent(params[key]))
    );

    try {
      const response = await fetch(apiUrl.toString(), { method, headers });
      const data = await response.json();
      return { data };
    } catch (error) {
      console.error(error);
    }
  },
}) : null;

async function getBlogPost(slug: string) {
  // Return null if API is not initialized
  if (!api) {
    console.warn("Ghost API not initialized - missing environment variables");
    return null;
  }
  
  try {
    return await api.posts.read({ slug }, { include: ["tags", "authors"] });
  } catch (error) {
    console.error("Error fetching blog post:", error);
    // throw new Error('Failed to fetch blog post');
  }
}

function PostContent({ post }: { post: any }) {
  return (
    <article className="max-w-[750px] mx-auto px-4 md:px-0">
      <h1 className="text-4xl md:text-5xl font-medium mb-4">{post.title}</h1>
      <p className="text-gray-500 mb-4">
        posted on {new Date(post.published_at || "").toLocaleDateString()}
      </p>
      {post.feature_image && (
        <div className="relative w-full aspect-[16/9] md:mb-12 mb-8">
          <Image
            src={post.feature_image}
            alt={post.feature_image_alt || ""}
            fill
            className="object-cover rounded-xl shadow-sm"
            sizes="(max-width: 768px) 100vw, 750px"
            priority
          />
        </div>
      )}
      <div
        className="prose max-w-none evento-blog-content"
        dangerouslySetInnerHTML={{ __html: post.html || "" }}
      />
      <div className="mt-6">
        {post.tags &&
          post.tags.map((tag: any) => (
            <span
              key={tag.id}
              className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2"
            >
              #{tag.name}
            </span>
          ))}
      </div>
    </article>
  );
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
      <Error message="Failed to load blog post. Please try again later." />
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
        type: "article",
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
        card: "summary_large_image",
        title: post.title,
        description: post.excerpt,
        images: [post.feature_image],
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Blog Post",
      description: "Unable to load blog post details",
    };
  }
}
