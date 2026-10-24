/**
 * Copy for the /e/security page. Every statement mirrors behaviour in this
 * repo (evento-client), the Evento API repo (evento-api), or docs.evento.so —
 * update the copy whenever the referenced code changes.
 */
import {
  Code2,
  Fingerprint,
  Globe,
  KeyRound,
  LockKeyhole,
  type LucideIcon,
  Wallet,
} from 'lucide-react';

/** Bump whenever the content below changes. */
export const SECURITY_LAST_UPDATED = 'October 23, 2026';
export const SECURITY_LAST_UPDATED_ISO = '2026-10-23';

/** Contact published in the Privacy Policy (§12) for suspected compromises. */
export const SECURITY_CONTACT_EMAIL = 'legal@evento.so';
export const SECURITY_REPORT_MAILTO = `mailto:${SECURITY_CONTACT_EMAIL}?subject=${encodeURIComponent(
  'Security report'
)}`;

const CLIENT_REPO_URL = 'https://github.com/sevenlabsxyz/evento-client';

export interface SecurityLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface SecurityFact {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface SecurityPoint {
  title: string;
  body: string;
  link?: SecurityLink;
}

export interface SecuritySectionContent {
  id: string;
  /** Short label for the on-page navigation. */
  navLabel: string;
  title: string;
  summary: string;
  points: SecurityPoint[];
  actions?: SecurityLink[];
}

export const SECURITY_FACTS: SecurityFact[] = [
  {
    id: 'sign-in',
    icon: KeyRound,
    title: 'Passwordless sign-in',
    description: 'One-time email codes or Google, handled by Supabase Auth.',
  },
  {
    id: 'self-custody',
    icon: Wallet,
    title: 'Self-custodial wallet',
    description: 'Your recovery phrase is created on your device. Evento never receives it.',
  },
  {
    id: 'seed-encryption',
    icon: LockKeyhole,
    title: 'AES-256 seed encryption',
    description: 'Locked with your PIN via PBKDF2-SHA256 at 1,000,000 iterations.',
  },
  {
    id: 'event-passwords',
    icon: Fingerprint,
    title: 'Hashed event passwords',
    description: 'Stored as salted scrypt hashes and checked in constant time.',
  },
  {
    id: 'transport',
    icon: Globe,
    title: 'HTTPS everywhere',
    description: 'HSTS, a Content Security Policy, and framing blocked on every page.',
  },
  {
    id: 'public-api',
    icon: Code2,
    title: 'Read-only public API',
    description: 'Unkey-issued keys, 1,000 requests per day, public events only.',
  },
];

export const SECURITY_SECTIONS: SecuritySectionContent[] = [
  {
    id: 'accounts',
    navLabel: 'Accounts & sign-in',
    title: 'Accounts & sign-in',
    summary: 'No account passwords to leak or reuse.',
    points: [
      {
        title: 'Email codes or Google',
        body: 'Sign in with a one-time code sent to your email, or with your Google account. Both run through Supabase Auth.',
      },
      {
        title: 'Cookie sessions',
        body: 'Your session is kept in cookies set by Supabase Auth and refreshed on each request.',
      },
      {
        title: 'Verified on the server',
        body: 'Signed-in API requests are re-validated with Supabase Auth on the server, using your session cookie or a Bearer token.',
      },
      {
        title: 'Compromised account',
        body: `If you think someone else has access, email ${SECURITY_CONTACT_EMAIL} right away.`,
      },
    ],
  },
  {
    id: 'wallet',
    navLabel: 'Wallet',
    title: 'Wallet',
    summary: 'Self-custodial Lightning wallet built on the Breez SDK (Spark).',
    points: [
      {
        title: 'Keys created on your device',
        body: 'Your 12-word BIP39 recovery phrase is generated in your browser. It is never sent to Evento’s servers.',
      },
      {
        title: 'Encrypted at rest',
        body: 'The phrase is encrypted with AES-256-GCM using a key derived from your 6-digit PIN (PBKDF2-SHA256, 1,000,000 iterations, random salt) through the browser’s Web Crypto API, then saved in this browser’s local storage.',
      },
      {
        title: 'Short-lived in memory',
        body: 'After you unlock, the decrypted phrase stays only in memory and is cleared when you lock the wallet or after 30 minutes.',
      },
      {
        title: 'Backups stay with you',
        body: 'Export a PIN-encrypted backup file, or reveal your recovery phrase after re-entering your PIN. Evento stores neither.',
      },
      {
        title: 'What Evento can’t do',
        body: 'We can’t see your phrase, reset your PIN, or restore your wallet. Lose your device and your backup, and the funds can’t be recovered.',
      },
    ],
  },
  {
    id: 'payments',
    navLabel: 'Payments',
    title: 'Payments',
    summary: 'Bitcoin over Lightning, sent from your own wallet.',
    points: [
      {
        title: 'Lightning address',
        body: 'Your @evento.cash address is registered through Breez and saved to your public profile so people can pay you.',
      },
      {
        title: 'Signed payment notices',
        body: 'When your address receives a payment, Breez sends Evento an HMAC-SHA256-signed webhook so we can email you. We keep the payment hash, amount, and sender comment.',
      },
      {
        title: 'Tickets pay the host directly',
        body: 'Ticket invoices come from the host’s Lightning address. Evento checks the invoice amount matches the order and confirms payment by matching the preimage to the payment hash.',
      },
      {
        title: 'What we store for orders',
        body: 'Payment hash, verification URL, and preimage as proof of payment. Invoices expire after 10 minutes.',
      },
    ],
  },
  {
    id: 'events',
    navLabel: 'Events & privacy',
    title: 'Events & privacy',
    summary: 'Hosts decide who sees what, and the API enforces it.',
    points: [
      {
        title: 'Private by default',
        body: 'New events are private unless you make them public. Private events only reach people with the link and stay out of other people’s feeds.',
      },
      {
        title: 'Password-protected events',
        body: 'Event passwords are hashed with scrypt and a random 16-byte salt, then checked in constant time. Location, description, and payment handles stay hidden until the right password is entered.',
      },
      {
        title: 'Signed access cookie',
        body: 'A correct password sets an HttpOnly, HMAC-signed cookie scoped to that one event for 7 days. Hosts and confirmed guests don’t need it.',
      },
      {
        title: 'Hidden until approved',
        body: 'Registration events hide the location and guest list from unapproved guests by default. Hosts can hide the description too.',
      },
      {
        title: 'Guest list',
        body: 'Hosts can hide the guest list from everyone.',
      },
    ],
  },
  {
    id: 'data',
    navLabel: 'Your data',
    title: 'Your data',
    summary: 'Stored with Supabase, encrypted in transit.',
    points: [
      {
        title: 'Where it lives',
        body: 'Account, profile, and event data are stored in Supabase and accessed through the Evento API.',
      },
      {
        title: 'Encrypted in transit',
        body: 'All traffic uses HTTPS. HSTS tells browsers to always use HTTPS for two years, subdomains included, and insecure requests are upgraded.',
      },
      {
        title: 'What we collect',
        body: 'The profile details you give us, your event activity, and device and usage data.',
        link: { label: 'Privacy Policy', href: '/privacy' },
      },
      {
        title: 'Your rights',
        body: 'Ask for access, correction, or deletion at privacy@evento.so.',
      },
    ],
  },
  {
    id: 'platform',
    navLabel: 'Platform protections',
    title: 'Platform protections',
    summary: 'Defenses built into the app and the API.',
    points: [
      {
        title: 'Rate limits',
        body: 'Abuse-prone endpoints are throttled, for example invite emails (20 a day per user), AI descriptions (10 a minute), and discount-code checks (30 a minute per IP).',
      },
      {
        title: 'Sanitized rich text',
        body: 'Event descriptions, blog posts, and email blasts pass through DOMPurify with a strict tag and attribute allowlist. Links that open a new tab get rel="noopener noreferrer".',
      },
      {
        title: 'Security headers',
        body: 'A Content Security Policy allowlists scripts, frames, and network connections. Other sites can’t frame Evento, and nosniff, a strict referrer policy, and a Permissions-Policy (microphone off) apply to every page.',
      },
      {
        title: 'Open source',
        body: 'The web client is open source under GPL-3.0, so anyone can audit it.',
        link: { label: 'View on GitHub', href: CLIENT_REPO_URL, external: true },
      },
    ],
  },
  {
    id: 'developers',
    navLabel: 'Developers & API keys',
    title: 'Developers & API keys',
    summary: 'Scoped, revocable keys for read-only access.',
    points: [
      {
        title: 'Read-only Public API',
        body: 'Only GET endpoints, returning published public events, their guest lists, and user event lists.',
        link: { label: 'API docs', href: 'https://docs.evento.so/api/overview', external: true },
      },
      {
        title: 'Unkey-issued keys',
        body: 'Keys carry only the events:read permission and go in the x-evento-api-key header.',
      },
      {
        title: 'Shown once, revocable',
        body: 'A key is shown once when created. Evento stores only Unkey’s key ID, and you can revoke keys any time (up to 10 per account).',
        link: { label: 'Manage API keys', href: '/e/settings/api-keys' },
      },
      {
        title: 'Rate limited',
        body: '1,000 requests per day per key. Requests over the limit get HTTP 429.',
      },
      {
        title: 'Embed API',
        body: 'Needs no key and only returns published public events.',
      },
    ],
  },
  {
    id: 'disclosure',
    navLabel: 'Report a vulnerability',
    title: 'Report a vulnerability',
    summary: 'Found a security issue? Tell us privately.',
    points: [
      {
        title: 'How to report',
        body: `Email ${SECURITY_CONTACT_EMAIL} with “Security report” in the subject. If you’re signed in, you can also use Help & Support. Please don’t open public GitHub issues for vulnerabilities.`,
      },
      {
        title: 'What to include',
        body: 'The affected URL or endpoint, steps to reproduce, the impact you observed, and how to reach you.',
      },
      {
        title: 'In scope',
        body: 'The Evento web app, the Evento API, and the open-source web client.',
      },
      {
        title: 'Out of scope',
        body: 'Third-party services (Supabase, Breez, Google, Unkey), denial-of-service or volume testing, spam, social engineering, and attacks that need an already-compromised device.',
      },
      {
        title: 'Ground rules',
        body: 'Use your own accounts and test data, don’t access other people’s data, and give us reasonable time to fix the issue before you disclose it.',
      },
    ],
    actions: [
      { label: 'Email security report', href: SECURITY_REPORT_MAILTO, external: true },
      { label: 'Help & Support', href: '/e/contact' },
    ],
  },
];
