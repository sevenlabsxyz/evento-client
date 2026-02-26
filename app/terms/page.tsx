import type { Metadata } from 'next';

import { LegalDocumentPage } from '@/app/legal/legal-document-page';
import { legalDocuments } from '@/app/legal/legal-documents';

const termsDocument = legalDocuments.terms;

export const metadata: Metadata = {
  title: `${termsDocument.title} | Evento`,
  description: termsDocument.summary,
};

export default function TermsPage() {
  return <LegalDocumentPage document={termsDocument} />;
}
