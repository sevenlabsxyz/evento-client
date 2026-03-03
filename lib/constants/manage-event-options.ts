import {
  ClipboardList,
  DollarSign,
  FileText,
  Mail,
  Music,
  Shield,
  UserPlus,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export interface ManageEventOption {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  route: string;
  isPriority?: boolean;
}

interface GetManageEventOptionsParams {
  eventId: string;
  eventType?: string | null;
  eventStatus?: string | null;
}

export function getManageEventOptions({
  eventId,
  eventType,
  eventStatus,
}: GetManageEventOptionsParams): ManageEventOption[] {
  const isRegistrationType = eventType === 'registration' || eventType === 'ticketed';
  const showRegistrationOption = isRegistrationType;
  const showSubmissionsOption = isRegistrationType && eventStatus === 'published';

  return [
    ...(showSubmissionsOption
      ? [
          {
            id: 'registration-submissions',
            title: 'Registrations',
            description: 'Review and manage guest registrations',
            icon: ClipboardList,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-700',
            route: `/e/${eventId}/manage/registration/submissions`,
            isPriority: true,
          },
        ]
      : []),
    {
      id: 'event-details',
      title: 'Event Details',
      description: 'Setup event time and location',
      icon: FileText,
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
      route: `/e/${eventId}/manage/details`,
    },
    {
      id: 'guest-list',
      title: 'Guest List',
      description: 'View guests and invites',
      icon: Users,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      route: `/e/${eventId}/manage/guests`,
    },
    ...(showRegistrationOption
      ? [
          {
            id: 'registration-questions',
            title: 'Registration Forms',
            description: 'Create and edit your registration form',
            icon: FileText,
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-600',
            route: `/e/${eventId}/manage/registration`,
          },
        ]
      : []),
    {
      id: 'cohosts',
      title: 'Cohosts',
      description: 'Invite others to help manage',
      icon: UserPlus,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      route: `/e/${eventId}/manage/hosts`,
    },
    {
      id: 'security-privacy',
      title: 'Security & Privacy',
      description: 'Visibility and password settings',
      icon: Shield,
      iconBg: 'bg-sky-100',
      iconColor: 'text-sky-600',
      route: `/e/${eventId}/manage/security`,
    },
    {
      id: 'email-blasts',
      title: 'Email Blasts',
      description: 'Send emails to guests',
      icon: Mail,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      route: `/e/${eventId}/manage/email-blast`,
    },
    {
      id: 'music',
      title: 'Music',
      description: 'Add Spotify and Wavlake tracks',
      icon: Music,
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      route: `/e/${eventId}/manage/music`,
    },
    {
      id: 'contributions',
      title: 'Contributions',
      description: 'Accept event donations',
      icon: DollarSign,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      route: `/e/${eventId}/manage/contributions`,
    },
    {
      id: 'crowdfunding',
      title: 'Crowdfunding',
      description: 'Set up a Lightning crowdfunding campaign',
      icon: Zap,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      route: `/e/${eventId}/manage/crowdfunding`,
    },
  ];
}
