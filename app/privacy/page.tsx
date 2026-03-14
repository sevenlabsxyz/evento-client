import type { Metadata } from 'next';

import { LegalDocumentPage } from '@/app/legal/legal-document-page';
import { legalDocuments } from '@/app/legal/legal-documents';

const privacyDocument = legalDocuments.privacy;

export const metadata: Metadata = {
  title: `${privacyDocument.title} | Evento`,
  description: privacyDocument.summary,
};

export default function PrivacyPage() {
  return <LegalDocumentPage document={privacyDocument} />;
}
