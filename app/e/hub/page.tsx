import { ghostService } from '@/lib/services/ghost';
import { GhostPost } from '@/lib/types/ghost';
import { logger } from '@/lib/utils/logger';
import HubPageClient from './page-client';

async function getHubPosts(): Promise<GhostPost[]> {
  try {
    const data = await ghostService.getPosts({
      filter: 'tag:hub',
      include: 'tags,authors',
      limit: 10,
    });

    return data.posts;
  } catch (error) {
    logger.warn('Hub blog posts unavailable', {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

export default async function HubPage() {
  const posts = await getHubPosts();

  return <HubPageClient posts={posts} />;
}
