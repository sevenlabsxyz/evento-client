/**
 * Structure for the /e/security page. Copy lives in the `security` message
 * namespace (messages/<locale>/security.json). Every statement mirrors
 * behaviour in this repo (evento-client), the Evento API repo (evento-api), or
 * docs.evento.so — update the copy whenever the referenced code changes.
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

type SecurityMessages = IntlMessages['security'];
export type SecurityFactKey = keyof SecurityMessages['facts'];
export type SecuritySectionKey = keyof SecurityMessages['sections'];
export type SecurityPointKey = keyof SecurityMessages['points'];
export type SecurityLinkKey = keyof SecurityMessages['links'];

/** Bump whenever the content changes (rendered in the reader's locale). */
export const SECURITY_LAST_UPDATED_ISO = '2026-10-23';

/** Contact published in the Privacy Policy (§12) for suspected compromises. */
export const SECURITY_CONTACT_EMAIL = 'legal@evento.so';
export const SECURITY_REPORT_MAILTO = `mailto:${SECURITY_CONTACT_EMAIL}?subject=${encodeURIComponent(
  'Security report'
)}`;

const CLIENT_REPO_URL = 'https://github.com/sevenlabsxyz/evento-client';

export interface SecurityLink {
  labelKey: SecurityLinkKey;
  href: string;
  external?: boolean;
}

export interface SecurityFact {
  id: string;
  icon: LucideIcon;
  key: SecurityFactKey;
}

export interface SecurityPoint {
  key: SecurityPointKey;
  link?: SecurityLink;
}

export interface SecuritySectionContent {
  id: string;
  key: SecuritySectionKey;
  points: SecurityPoint[];
  actions?: SecurityLink[];
}

export const SECURITY_FACTS: SecurityFact[] = [
  { id: 'sign-in', icon: KeyRound, key: 'signIn' },
  { id: 'self-custody', icon: Wallet, key: 'selfCustody' },
  { id: 'seed-encryption', icon: LockKeyhole, key: 'seedEncryption' },
  { id: 'event-passwords', icon: Fingerprint, key: 'eventPasswords' },
  { id: 'transport', icon: Globe, key: 'transport' },
  { id: 'public-api', icon: Code2, key: 'publicApi' },
];

export const SECURITY_SECTIONS: SecuritySectionContent[] = [
  {
    id: 'accounts',
    key: 'accounts',
    points: [
      { key: 'emailOrGoogle' },
      { key: 'cookieSessions' },
      { key: 'serverVerified' },
      { key: 'compromisedAccount' },
    ],
  },
  {
    id: 'wallet',
    key: 'wallet',
    points: [
      { key: 'keysOnDevice' },
      { key: 'encryptedAtRest' },
      { key: 'shortLivedMemory' },
      { key: 'backupsStayWithYou' },
      { key: 'whatEventoCantDo' },
    ],
  },
  {
    id: 'payments',
    key: 'payments',
    points: [
      { key: 'lightningAddress' },
      { key: 'signedNotices' },
      { key: 'ticketsPayHost' },
      { key: 'orderStorage' },
    ],
  },
  {
    id: 'events',
    key: 'events',
    points: [
      { key: 'privateByDefault' },
      { key: 'passwordProtected' },
      { key: 'signedAccessCookie' },
      { key: 'hiddenUntilApproved' },
      { key: 'guestList' },
    ],
  },
  {
    id: 'data',
    key: 'data',
    points: [
      { key: 'whereItLives' },
      { key: 'encryptedInTransit' },
      { key: 'whatWeCollect', link: { labelKey: 'privacyPolicy', href: '/privacy' } },
      { key: 'yourRights' },
    ],
  },
  {
    id: 'platform',
    key: 'platform',
    points: [
      { key: 'rateLimits' },
      { key: 'sanitizedRichText' },
      { key: 'securityHeaders' },
      {
        key: 'openSource',
        link: { labelKey: 'viewOnGithub', href: CLIENT_REPO_URL, external: true },
      },
    ],
  },
  {
    id: 'developers',
    key: 'developers',
    points: [
      {
        key: 'readOnlyApi',
        link: { labelKey: 'apiDocs', href: 'https://docs.evento.so/api/overview', external: true },
      },
      { key: 'unkeyKeys' },
      {
        key: 'shownOnce',
        link: { labelKey: 'manageApiKeys', href: '/e/settings/api-keys' },
      },
      { key: 'apiRateLimited' },
      { key: 'embedApi' },
    ],
  },
  {
    id: 'disclosure',
    key: 'disclosure',
    points: [
      { key: 'howToReport' },
      { key: 'whatToInclude' },
      { key: 'inScope' },
      { key: 'outOfScope' },
      { key: 'groundRules' },
    ],
    actions: [
      { labelKey: 'emailReport', href: SECURITY_REPORT_MAILTO, external: true },
      { labelKey: 'helpSupport', href: '/e/contact' },
    ],
  },
];
