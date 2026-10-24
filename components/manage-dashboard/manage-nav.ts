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

export interface ManageNavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  match?: 'exact' | 'prefix';
}

export interface ManageNavSection {
  id: string;
  label: string;
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
      label: 'Overview',
      items: [
        {
          id: 'overview',
          label: 'Overview',
          href: base,
          icon: LayoutDashboard,
          match: 'exact',
        },
      ],
    },
    {
      id: 'people',
      label: 'Guests',
      items: [
        { id: 'guests', label: 'Guest list', href: `${base}/guests`, icon: Users },
        ...(hasRegistration
          ? [
              {
                id: 'registrations',
                label: 'Registrations',
                href: `${base}/registration/submissions`,
                icon: ClipboardList,
                badge: pendingRegistrations > 0 ? pendingRegistrations : undefined,
              },
              {
                id: 'registration-form',
                label: 'Registration form',
                href: `${base}/registration`,
                icon: FileText,
                match: 'exact' as const,
              },
            ]
          : []),
        ...(isTicketed
          ? [{ id: 'check-in', label: 'Check-in', href: `${base}/check-in`, icon: ScanLine }]
          : []),
      ],
    },
    {
      id: 'sales',
      label: 'Tickets & money',
      items: [
        ...(isTicketed
          ? [
              { id: 'tickets', label: 'Tickets', href: `${base}/tickets`, icon: Ticket },
              { id: 'sales', label: 'Sales', href: `${base}/sales`, icon: TrendingUp },
            ]
          : []),
        {
          id: 'contributions',
          label: 'Contributions',
          href: `${base}/contributions`,
          icon: HandCoins,
        },
        {
          id: 'crowdfunding',
          label: 'Crowdfunding',
          href: `${base}/crowdfunding`,
          icon: PiggyBank,
        },
      ],
    },
    {
      id: 'communications',
      label: 'Communications',
      items: [
        { id: 'email-blast', label: 'Email blasts', href: `${base}/email-blast`, icon: Megaphone },
        { id: 'reminders', label: 'Reminders', href: `${base}/reminders`, icon: Bell },
      ],
    },
    {
      id: 'content',
      label: 'Content',
      items: [
        { id: 'details', label: 'Event details', href: `${base}/details`, icon: PencilLine },
        { id: 'sub-events', label: 'Sub-events', href: `${base}/sub-events`, icon: Layers },
        { id: 'music', label: 'Music', href: `${base}/music`, icon: Music },
        {
          id: 'moderation',
          label: 'Comments & photos',
          href: `${base}/moderation`,
          icon: MessagesSquare,
        },
      ],
    },
    {
      id: 'team',
      label: 'Team',
      items: [{ id: 'hosts', label: 'Cohosts', href: `${base}/hosts`, icon: UserPlus }],
    },
    {
      id: 'settings',
      label: 'Settings',
      items: [
        { id: 'security', label: 'Security & privacy', href: `${base}/security`, icon: Shield },
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
