"use client";

import { Scroll } from "@silk-hq/components";
import { Button } from "@/components/ui/button";
import "./blog-post.css";
import EnhancedBlogContent from "./enhanced-blog-content";
import { Share } from "lucide-react";

interface BlogPostClientProps {
  post: any;
}

const BlogPostClient = ({ post }: BlogPostClientProps) => {
  if (!post) return null;

  const authorName =
    post.authors && post.authors.length > 0
      ? post.authors[0].name
      : "Evento Team";

  const publishedDate = new Date(post.published_at || "").toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Scroll.Root asChild>
        <Scroll.View className="BlogPost-scrollView">
          <Scroll.Content asChild>
            <article className="BlogPost-article">
              {post.feature_image ? (
                <div
                  className="BlogPost-illustration"
                  style={{
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${post.feature_image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              ) : (
                <div className="BlogPost-illustration" />
              )}
              <div className="BlogPost-articleContent">
                <h1 className="BlogPost-title">{post.title}</h1>
                {post.excerpt && (
                  <h2 className="BlogPost-subtitle">{post.excerpt}</h2>
                )}
                <div className="BlogPost-author">
                  by <span className="BlogPost-authorName">{authorName}</span> •{" "}
                  {publishedDate}
                </div>
                <EnhancedBlogContent
                  html={post.html || ""}
                  className="BlogPost-articleBody"
                />
              </div>
              <div className="w-full px-6 py-12 border-t border-gray-200">
                <Button
                  variant="secondary"
                  className="w-full py-6 text-base border border-gray-200"
                >
                  <Share className="mr-1" />
                  Share Post
                </Button>
              </div>
            </article>
          </Scroll.Content>
        </Scroll.View>
      </Scroll.Root>
    </div>
  );
};

export { BlogPostClient };
