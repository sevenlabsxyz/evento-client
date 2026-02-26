import { useQuery } from '@tanstack/react-query';

import { getPosts } from '@/lib/services/ghost';
import { GhostPost } from '@/lib/types/ghost';

interface UseGhostPostsOptions {
  limit?: number;
  page?: number;
  filter?: string;
}

export function useGhostPosts(options: UseGhostPostsOptions = {}) {
  const { limit = 9, page = 1, filter } = options;

  return useQuery({
    queryKey: ['blog', 'posts', { limit, page, filter }],
    queryFn: async (): Promise<GhostPost[]> => {
      const data = await getPosts({ limit, page, filter });
      return data.posts;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes — blog posts don't change often
    gcTime: 10 * 60 * 1000,
  });
}
