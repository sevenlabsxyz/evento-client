"use client";

import { Scroll, VisuallyHidden } from "@silk-hq/components";
import { useRouter } from "next/navigation";
import "./BlogPost.css";
import { Page } from "./Page";

interface BlogPostClientProps {
  post: any;
}

const BlogPostClient = ({ post }: BlogPostClientProps) => {
  const router = useRouter();

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
    <Page.Root
      presented={true}
      onPresentedChange={(presented) => !presented && router.back()}
    >
      <Page.Portal>
        <Page.View>
          <Page.Backdrop />
          <Page.Content>
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
                      <Page.Title className="BlogPost-title" asChild>
                        <h1>{post.title}</h1>
                      </Page.Title>
                      {post.excerpt && (
                        <h2 className="BlogPost-subtitle">{post.excerpt}</h2>
                      )}
                      <div className="BlogPost-author">
                        by{" "}
                        <span className="BlogPost-authorName">
                          {authorName}
                        </span>{" "}
                        • {publishedDate}
                      </div>
                      <div
                        className="BlogPost-articleBody"
                        dangerouslySetInnerHTML={{ __html: post.html || "" }}
                      />
                    </div>
                  </article>
                </Scroll.Content>
              </Scroll.View>
            </Scroll.Root>
            <Page.Trigger action="dismiss" asChild>
              <button className="BlogPost-dismissTrigger">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="BlogPost-dismissIcon"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
                <VisuallyHidden.Root>Dismiss Article</VisuallyHidden.Root>
              </button>
            </Page.Trigger>
          </Page.Content>
        </Page.View>
      </Page.Portal>
    </Page.Root>
  );
};

export { BlogPostClient };
