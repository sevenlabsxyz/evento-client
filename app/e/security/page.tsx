import type { Metadata } from 'next';
import SecurityPageClient from './page-client';

export const metadata: Metadata = {
  title: 'Security — Evento',
  description:
    'How Evento secures accounts, the self-custodial wallet, payments, events, and data — and how to report a vulnerability.',
};

export default function SecurityPage() {
  return <SecurityPageClient />;
}
