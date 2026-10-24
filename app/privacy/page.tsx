import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { LegalDocumentPage } from '@/app/legal/legal-document-page';
import { legalDocuments } from '@/app/legal/legal-documents';

const privacyDocument = legalDocuments.privacy;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('misc.legal');
  return {
    title: t('metaTitle', { title: t('titles.privacy') }),
    description: privacyDocument.summary,
  };
}

export default function PrivacyPage() {
  return <LegalDocumentPage document={privacyDocument} />;
}
