import type { MetadataRoute } from 'next';

const APP_URL =
  process.env.NODE_ENV === 'development' ? 'http://localhost:3003' : 'https://app.evento.so';

const STATIC_SITEMAP_ROUTES = ['/', '/privacy', '/terms'];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return STATIC_SITEMAP_ROUTES.map((path) => ({
    url: `${APP_URL}${path === '/' ? '' : path}`,
    lastModified: now,
    changeFrequency: path === '/' ? 'daily' : 'monthly',
    priority: path === '/' ? 1 : 0.3,
  }));
}
