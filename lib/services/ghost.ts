import { Env } from '@/lib/constants/env';
import { GhostPost, GhostPostsResponse } from '@/lib/types/ghost';

const GHOST_URL = Env.NEXT_PUBLIC_GHOST_URL;
const GHOST_KEY = Env.NEXT_PUBLIC_GHOST_CONTENT_API_KEY;
const API_VERSION = 'v5.0';
const ALLOWED_ENDPOINTS = ['posts', 'pages', 'tags', 'authors'] as const;

type GhostEndpoint = (typeof ALLOWED_ENDPOINTS)[number];

function validateEndpoint(endpoint: string): GhostEndpoint {
  const normalizedEndpoint = endpoint.trim().replace(/^\/+|\/+$/g, '').toLowerCase();

  if (!ALLOWED_ENDPOINTS.includes(normalizedEndpoint as GhostEndpoint)) {
    throw new Error(`Invalid Ghost endpoint: ${endpoint}`);
  }

  return normalizedEndpoint as GhostEndpoint;
}

function buildUrl(endpoint: string, params: Record<string, string> = {}): string {
  if (!GHOST_URL || !GHOST_KEY) {
    throw new Error('Ghost API configuration missing - NEXT_PUBLIC_GHOST_URL or key not set');
  }

  const validatedEndpoint = validateEndpoint(endpoint);
  const url = new URL(`/ghost/api/content/${validatedEndpoint}/`, GHOST_URL);
  url.searchParams.set('key', GHOST_KEY);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

async function ghostFetch<T>(endpoint: GhostEndpoint, params: Record<string, string> = {}): Promise<T> {
  const url = buildUrl(endpoint, params);
  const res = await fetch(url, {
    headers: { 'Accept-Version': API_VERSION },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Ghost API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export async function getPosts(
  options: {
    limit?: number | 'all';
    page?: number;
    include?: string;
    filter?: string;
  } = {}
): Promise<GhostPostsResponse> {
  const params: Record<string, string> = {
    include: options.include ?? 'authors,tags',
    limit: String(options.limit ?? 9),
  };

  if (options.page) params.page = String(options.page);
  if (options.filter) params.filter = options.filter;

  return ghostFetch<GhostPostsResponse>('posts', params);
}

export async function getPostBySlug(slug: string): Promise<GhostPost | null> {
  const data = await ghostFetch<GhostPostsResponse>('posts', {
    filter: `slug:${slug}`,
    include: 'authors,tags',
    limit: '1',
  });

  return data.posts[0] ?? null;
}

export const ghostService = {
  getPosts,
  getPostBySlug,
};
