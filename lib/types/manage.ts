// Types for the event manage dashboard and the host-facing ticketing endpoints.

export type EventDashboardActivityType =
  | 'rsvp'
  | 'registration'
  | 'ticket'
  | 'comment'
  | 'photo'
  | 'pledge'
  | 'invite_response';

export interface EventDashboardActivity {
  id: string;
  type: EventDashboardActivityType;
  createdAt: string;
  actor: {
    id: string | null;
    username: string | null;
    name: string | null;
    image: string | null;
  } | null;
  detail: string | null;
}

export type ContributionMethod = 'cashapp' | 'venmo' | 'paypal' | 'lightning';

export interface EventDashboard {
  event: {
    id: string;
    title: string;
    cover: string | null;
    status: 'draft' | 'published' | 'archived';
    visibility: 'public' | 'private';
    type: 'rsvp' | 'registration' | 'ticketed';
    timezone: string | null;
    computed_start_date: string | null;
    computed_end_date: string | null;
    published_at: string | null;
    created_at: string;
    parent_event_id: string | null;
    password_protected: boolean;
    has_description: boolean;
    has_location: boolean;
    location_name: string | null;
  };
  viewer: { isCreator: boolean; isHost: boolean };
  rsvps: { yes: number; maybe: number; no: number; total: number };
  capacity: { max: number | null; showCount: boolean; remaining: number | null; isFull: boolean };
  registration: {
    required: boolean;
    approvalMode: 'auto' | 'manual';
    pending: number;
    approved: number;
    denied: number;
    questionCount: number;
  } | null;
  tickets: {
    typesCount: number;
    activeTypesCount: number;
    sold: number;
    capacity: number;
    revenueSats: number;
    paidOrders: number;
    pendingOrders: number;
    issued: number;
    checkedIn: number;
  } | null;
  invites: { total: number; pending: number; responded: number; expired: number; going: number };
  team: { hosts: number; pendingCohostInvites: number };
  engagement: { comments: number; photos: number };
  campaign: {
    id: string;
    status: string;
    raisedSats: number;
    goalSats: number | null;
    pledgeCount: number;
    progressPercent: number;
  } | null;
  communications: {
    blasts: {
      total: number;
      scheduled: number;
      completed: number;
      failed: number;
      nextScheduledFor: string | null;
    };
    reminders: { offsets: string[]; sent: string[] };
  };
  subEvents: { count: number };
  contributions: { enabled: boolean; methods: ContributionMethod[] };
  timeline: Array<{ date: string; rsvps: number; registrations: number; tickets: number }>;
  recentActivity: EventDashboardActivity[];
}

export interface EventInvitePerson {
  id: string;
  username: string | null;
  name: string | null;
  image: string | null;
}

export type EventInviteStatus = 'pending' | 'responded' | 'expired';
export type EventInviteStatusFilter = EventInviteStatus | 'all';

export interface EventInviteRecord {
  id: string;
  status: EventInviteStatus;
  response: 'yes' | 'no' | 'maybe' | null;
  message: string | null;
  created_at: string;
  updated_at: string | null;
  invitee_email: string | null;
  invitee: EventInvitePerson | null;
  inviter: EventInvitePerson | null;
}

export type TicketCurrency = 'USD' | 'EUR' | 'GBP' | 'BRL' | 'NGN';

export interface TicketType {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price_amount: number;
  price_currency: TicketCurrency;
  quantity_total: number;
  quantity_sold: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  quantity_available?: number;
  is_sold_out?: boolean;
}

export interface CreateTicketTypeInput {
  name: string;
  description?: string;
  price_amount: number;
  price_currency: TicketCurrency;
  quantity_total: number;
  sort_order?: number;
}

export type UpdateTicketTypeInput = Partial<CreateTicketTypeInput>;

export interface DiscountCode {
  id: string;
  event_id: string;
  code: string;
  percentage: number;
  usage_limit: number;
  usage_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface CreateDiscountCodeInput {
  code: string;
  percentage: number;
  usage_limit: number;
}

export interface UpdateDiscountCodeInput {
  usage_limit?: number;
  is_active?: boolean;
}

export interface EventSales {
  summary: {
    totalRevenue: { sats: number; fiatEquivalent: number; currency: string };
    totalTicketsSold: number;
  };
  ticketTypes: Array<{
    id: string;
    name: string;
    sold: number;
    total: number;
    revenue: number;
    currency: string;
  }>;
  salesOverTime: Array<{ date: string; tickets: number }>;
  discountCodes: Array<{ code: string; percentage: number; used: number; limit: number }>;
}

export type EventAttendeeStatus = 'active' | 'used' | 'cancelled';

export interface EventAttendee {
  ticketId: string;
  name: string | null;
  email: string | null;
  image: string | null;
  ticketType: string | null;
  status: EventAttendeeStatus;
  checkedInAt: string | null;
  purchasedAt: string | null;
}

export interface EventAttendeesResponse {
  attendees: EventAttendee[];
  summary: { total: number; checkedIn: number };
}

export interface CheckInResult {
  valid: boolean;
  error?: string;
  alreadyUsed?: boolean;
  ticketId?: string;
  attendee?: { name: string | null; image: string | null };
  ticketType?: string | null;
  checkedInAt?: string | null;
}

export type CheckInVariables = { token: string } | { ticketId: string };

export interface UndoCheckInResult {
  ticketId: string;
  status: 'active';
}

export interface DuplicatedEvent {
  id: string;
  title: string;
  status: EventDashboard['event']['status'];
  type: EventDashboard['event']['type'];
  visibility: EventDashboard['event']['visibility'];
  creator_user_id: string;
}
