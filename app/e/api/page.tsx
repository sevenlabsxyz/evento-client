import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import ApiPageClient from './page-client';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('developers.api.meta');
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function ApiPage() {
  return <ApiPageClient />;
}
