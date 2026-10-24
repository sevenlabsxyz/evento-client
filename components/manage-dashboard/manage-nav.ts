import type { EventDashboard } from '@/lib/types/manage';
import {
  Bell,
  ClipboardList,
  FileText,
  HandCoins,
  Layers,
  LayoutDashboard,
  type LucideIcon,
  Megaphone,
  MessagesSquare,
  Music,
  PencilLine,
  PiggyBank,
  ScanLine,
  Shield,
  Ticket,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';

/** Key under `manage.nav.*`, translated at render time. */
export type ManageNavLabelKey =
  | 'overview'
  | 'guests'
  | 'guestList'
  | 'registrations'
  | 'registrationForm'
  | 'checkIn'
  | 'ticketsMoney'
  | 'tickets'
  | 'sales'
  | 'contributions'
  | 'crowdfunding'
  | 'communications'
  | 'emailBlasts'
  | 'reminders'
  | 'content'
  | 'eventDetails'
  | 'subEvents'
  | 'music'
  | 'commentsPhotos'
  | 'team'
  | 'cohosts'
  | 'settings'
  | 'securityPrivacy';

export interface ManageNavItem {
  id: string;
  labelKey: ManageNavLabelKey;
  href: string;
  icon: LucideIcon;
  badge?: number;
  match?: 'exact' | 'prefix';
}

export interface ManageNavSection {
  id: string;
  labelKey: ManageNavLabelKey;
  items: ManageNavItem[];
}

type ManageNavEvent = Pick<EventDashboard['event'], 'id' | 'type' | 'status'>;

interface ManageNavCounts {
  pendingRegistrations?: number;
}

export function getManageBasePath(eventId: string): string {
  return `/e/${eventId}/manage`;
}

export function getManageNavSections(
  event: ManageNavEvent,
  counts?: ManageNavCounts
): ManageNavSection[] {
  const base = getManageBasePath(event.id);
  const hasRegistration = event.type === 'registration' || event.type === 'ticketed';
  const isTicketed = event.type === 'ticketed';
  const pendingRegistrations = counts?.pendingRegistrations ?? 0;

  const sections: ManageNavSection[] = [
    {
      id: 'overview',
      labelKey: 'overview',
      items: [
        {
          id: 'overview',
          labelKey: 'overview',
          href: base,
          icon: LayoutDashboard,
          match: 'exact',
        },
      ],
    },
    {
      id: 'people',
      labelKey: 'guests',
      items: [
        { id: 'guests', labelKey: 'guestList', href: `${base}/guests`, icon: Users },
        ...(hasRegistration
          ? [
              {
                id: 'registrations',
                labelKey: 'registrations' as const,
                href: `${base}/registration/submissions`,
                icon: ClipboardList,
                badge: pendingRegistrations > 0 ? pendingRegistrations : undefined,
              },
              {
                id: 'registration-form',
                labelKey: 'registrationForm' as const,
                href: `${base}/registration`,
                icon: FileText,
                match: 'exact' as const,
              },
            ]
          : []),
        ...(isTicketed
          ? [
              {
                id: 'check-in',
                labelKey: 'checkIn' as const,
                href: `${base}/check-in`,
                icon: ScanLine,
              },
            ]
          : []),
      ],
    },
    {
      id: 'sales',
      labelKey: 'ticketsMoney',
      items: [
        ...(isTicketed
          ? [
              {
                id: 'tickets',
                labelKey: 'tickets' as const,
                href: `${base}/tickets`,
                icon: Ticket,
              },
              { id: 'sales', labelKey: 'sales' as const, href: `${base}/sales`, icon: TrendingUp },
            ]
          : []),
        {
          id: 'contributions',
          labelKey: 'contributions',
          href: `${base}/contributions`,
          icon: HandCoins,
        },
        {
          id: 'crowdfunding',
          labelKey: 'crowdfunding',
          href: `${base}/crowdfunding`,
          icon: PiggyBank,
        },
      ],
    },
    {
      id: 'communications',
      labelKey: 'communications',
      items: [
        {
          id: 'email-blast',
          labelKey: 'emailBlasts',
          href: `${base}/email-blast`,
          icon: Megaphone,
        },
        { id: 'reminders', labelKey: 'reminders', href: `${base}/reminders`, icon: Bell },
      ],
    },
    {
      id: 'content',
      labelKey: 'content',
      items: [
        { id: 'details', labelKey: 'eventDetails', href: `${base}/details`, icon: PencilLine },
        { id: 'sub-events', labelKey: 'subEvents', href: `${base}/sub-events`, icon: Layers },
        { id: 'music', labelKey: 'music', href: `${base}/music`, icon: Music },
        {
          id: 'moderation',
          labelKey: 'commentsPhotos',
          href: `${base}/moderation`,
          icon: MessagesSquare,
        },
      ],
    },
    {
      id: 'team',
      labelKey: 'team',
      items: [{ id: 'hosts', labelKey: 'cohosts', href: `${base}/hosts`, icon: UserPlus }],
    },
    {
      id: 'settings',
      labelKey: 'settings',
      items: [
        { id: 'security', labelKey: 'securityPrivacy', href: `${base}/security`, icon: Shield },
      ],
    },
  ];

  return sections.filter((section) => section.items.length > 0);
}

function isPrefixMatch(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Resolve the single active nav item for a pathname.
 * Items match by their `match` mode (default prefix) and the longest href wins, so
 * `/registration/submissions` beats `/registration`. Nested routes that no item
 * claims (e.g. `/registration/add/[type]`) fall back to the closest ancestor item,
 * excluding the overview root.
 */
export function getActiveManageNavItemId(
  sections: ManageNavSection[],
  pathname: string | null,
  basePath: string
): string | null {
  if (!pathname) {
    return null;
  }

  const current = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const items = sections.flatMap((section) => section.items);

  let bestMatch: ManageNavItem | null = null;
  for (const item of items) {
    const matches =
      item.match === 'exact' ? current === item.href : isPrefixMatch(current, item.href);
    if (matches && (!bestMatch || item.href.length > bestMatch.href.length)) {
      bestMatch = item;
    }
  }

  if (bestMatch) {
    return bestMatch.id;
  }

  let ancestor: ManageNavItem | null = null;
  for (const item of items) {
    if (item.href === basePath) {
      continue;
    }
    if (
      isPrefixMatch(current, item.href) &&
      (!ancestor || item.href.length > ancestor.href.length)
    ) {
      ancestor = item;
    }
  }

  return ancestor?.id ?? null;
}
