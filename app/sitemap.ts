import { getAppUrl } from '@/lib/utils/app-url';
import type { MetadataRoute } from 'next';

const STATIC_SITEMAP_ROUTES = ['/', '/privacy', '/terms'];

export default function sitemap(): MetadataRoute.Sitemap {
  const appUrl = getAppUrl();
  const now = new Date();

  return STATIC_SITEMAP_ROUTES.map((path) => ({
    url: `${appUrl}${path === '/' ? '' : path}`,
    lastModified: now,
    changeFrequency: path === '/' ? 'daily' : 'monthly',
    priority: path === '/' ? 1 : 0.3,
  }));
}
