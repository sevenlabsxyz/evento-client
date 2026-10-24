import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import SecurityPageClient from './page-client';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('security');
  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

export default function SecurityPage() {
  return <SecurityPageClient />;
}
