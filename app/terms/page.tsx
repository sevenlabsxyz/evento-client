import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { LegalDocumentPage } from '@/app/legal/legal-document-page';
import { legalDocuments } from '@/app/legal/legal-documents';

const termsDocument = legalDocuments.terms;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('misc.legal');
  return {
    title: t('metaTitle', { title: t('titles.terms') }),
    description: termsDocument.summary,
  };
}

export default function TermsPage() {
  return <LegalDocumentPage document={termsDocument} />;
}
