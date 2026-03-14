export interface GhostAuthor {
  id: string;
  name: string;
  slug: string;
  profile_image: string | null;
  bio: string | null;
  url: string;
}

export interface GhostTag {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  url: string;
}

export interface GhostPost {
  id: string;
  uuid: string;
  title: string;
  slug: string;
  html: string | null;
  excerpt: string | null;
  custom_excerpt: string | null;
  feature_image: string | null;
  feature_image_alt: string | null;
  featured: boolean;
  published_at: string | null;
  reading_time: number;
  url: string;
  tags: GhostTag[];
  authors: GhostAuthor[];
  primary_author: GhostAuthor | null;
  primary_tag: GhostTag | null;
}

export interface GhostPostsResponse {
  posts: GhostPost[];
  meta: {
    pagination: {
      page: number;
      limit: number;
      pages: number;
      total: number;
      next: number | null;
      prev: number | null;
    };
  };
}
