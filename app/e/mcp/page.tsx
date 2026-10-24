import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import McpPageClient from './page-client';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('developers.mcp.meta');
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function McpPage() {
  return <McpPageClient />;
}
