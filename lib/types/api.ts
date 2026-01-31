import { EventHost } from './event';

// Standard API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// API Error type
export interface ApiError {
  success: false;
  message: string;
  status?: number;
}

// User Details - complete profile information
export interface UserDetails {
  id: string;
  username: string;
  name: string;
  email?: string; // Optional email field
  bio: string;
  image: string;
  bio_link?: string;
  x_handle?: string;
  instagram_handle?: string;
  ln_address?: string; // Lightning address
  lightning_address?: string; // Lightning address (alternative field name)
  nip05?: string; // Nostr identifier
  verification_status: VerificationStatus;
  verification_date?: string;
}

// Interests types
export interface Interest {
  id: string;
  name: string;
  slug: string;
  description: string;
  parent_interest_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  children?: Interest[];
}

export interface InterestWithParent {
  id: string;
  name: string;
  slug: string;
  description: string;
  parent_interest: {
    id: string;
    name: string;
    slug: string;
  } | null;
  selected_at: string;
}

// Prompts types
export interface Prompt {
  id: string;
  question: string;
  category: string;
  placeholder_text: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPrompt {
  id: string;
  prompt: {
    id: string;
    question: string;
    category: string;
  };
  answer: string;
  display_order: number;
  is_visible: boolean;
  answered_at: string;
  updated_at: string;
}

// Invite system types
export type InviteTarget =
  | {
      email: string;
      type: 'email';
    }
  | {
      id: string;
      username: string;
      name: string;
      verification_status: string;
      image: string | null;
    };

export type InviteItem =
  | UserDetails
  | {
      id: string;
      username: string;
      name: string;
      email: string;
      isEmailInvite: true;
      bio: string;
      image: string;
      verification_status: VerificationStatus;
      bio_link?: string;
      x_handle?: string;
      instagram_handle?: string;
      ln_address?: string;
      nip05?: string;
      verification_date?: string;
    };

// User search results
export interface UserSearchResult {
  id: string;
  username: string;
  name: string;
  verification_status: string;
  image: string;
}

// Event - complete event information
export interface Event {
  id: string;
  title: string;
  description: string;
  cover?: string;
  location: string;
  timezone: string;
  status: 'draft' | 'published' | 'cancelled' | 'archived';
  visibility: 'public' | 'private';
  type?: 'rsvp' | 'registration' | 'ticketed'; // Event type (defaults to 'rsvp' for backward compatibility)
  cost: number | null;
  creator_user_id: string;
  hosts: EventHost[];

  // Date components (stored separately for timezone handling)
  start_date_day: number;
  start_date_month: number;
  start_date_year: number;
  start_date_hours: number;
  start_date_minutes: number;

  end_date_day: number;
  end_date_month: number;
  end_date_year: number;
  end_date_hours: number;
  end_date_minutes: number;

  // Computed ISO dates
  computed_start_date: string;
  computed_end_date: string;

  // Media & Links
  spotify_url: string;
  wavlake_url: string;

  // Contribution methods
  contrib_cashapp: string;
  contrib_venmo: string;
  contrib_paypal: string;
  contrib_btclightning: string;

  created_at: string;
  updated_at: string;

  // Relations (populated in some responses)
  user_details?: UserDetails;
  hosts?: Array<{
    id: string;
    name: string;
    username: string;
    avatar: string;
    image?: string;
    title?: string;
    company?: string;
  }>;
}

// Event Invite
export interface EventInvite {
  id: string;
  event_id: string;
  inviter_id: string;
  invitee_id: string;
  invitee_email: string;
  message: string;
  status: 'pending' | 'responded';
  response: 'going' | 'not_going' | 'maybe' | null;
  created_at: string;
  updated_at: string;
  events: EventWithUser;
}

// Event RSVP
export interface EventRSVP {
  id: string;
  event_id: string;
  user_id: string;
  status: 'yes' | 'no' | 'maybe';
  created_at: string;
  updated_at: string;
  user_details?: UserDetails;
}

// Event Comment
export interface EventComment {
  id: string;
  event_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_details?: UserDetails;
}

// Event Settings
export interface EventSettings {
  id: string;
  event_id: string;
  max_capacity: number | null;
  show_capacity_count: boolean;
}

// Form types for API requests
export interface CreateEventForm {
  title: string;
  description: string;
  location: string;
  cover?: string;
  timezone: string;
  status: 'draft' | 'published';
  visibility: 'public' | 'private';
  cost?: number;

  start_date_day: number;
  start_date_month: number;
  start_date_year: number;
  start_date_hours: number;
  start_date_minutes: number;

  end_date_day: number;
  end_date_month: number;
  end_date_year: number;
  end_date_hours: number;
  end_date_minutes: number;

  spotify_url?: string;
  wavlake_url?: string;
  contrib_cashapp?: string;
  contrib_venmo?: string;
  contrib_paypal?: string;
  contrib_btclightning?: string;

  settings?: {
    max_capacity?: number;
    show_capacity_count?: boolean;
  };
}

export interface UpdateUserForm {
  username?: string;
  name?: string;
  bio?: string;
  bio_link?: string;
  x_handle?: string;
  instagram_handle?: string;
  image?: string;
  ln_address?: string;
  nip05?: string;
}

// Authentication types
export interface LoginRequest {
  email: string;
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
}

export interface AuthResponse {
  user: UserDetails;
  message: string;
}

// Follow relationship
export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

// Notification types
export interface Notification {
  id: string;
  user_id: string;
  type: 'event_invite' | 'event_comment' | 'event_rsvp' | 'user_follow' | 'event_reminder';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: any; // Additional context data
}

// Gallery item
export interface GalleryItem {
  id: string;
  event_id: string;
  user_id: string;
  image_url: string;
  caption?: string;
  created_at: string;
  user_details?: UserDetails;
}

// Search results
export interface SearchResults {
  users: UserDetails[];
  events: Event[];
}

// Event with populated user details (for feed, etc.)
export interface EventWithUser extends Event {
  user_details: UserDetails;
}

// Email Blast
export interface EmailBlast {
  id: string;
  event_id: string;
  user_id: string;
  message: string;
  recipient_filter: EmailBlastRecipientFilter;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  scheduled_for: string | null;
  created_at: string;
  updated_at: string;
  // Additional fields for UI display
  subject?: string;
  recipients?: string;
  recipientCount?: number;
  delivered?: number;
  failed?: number;
  pending?: number;
}

// Email Blast creation form
export interface CreateEmailBlastForm {
  message: string;
  recipientFilter: EmailBlastRecipientFilter;
  scheduledFor?: string | null;
}

// User List (for saved events)
export interface UserList {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  event_count: number;
}

// List Event (event saved in a list)
export interface ListEvent {
  list_event_id: string;
  event_id: string;
  added_at: string;
  added_by: string;
  event: EventWithUser;
}

// Saved status for an event
export interface SavedEventStatus {
  event_id: string;
  saved_in_lists: Array<{
    list_id: string;
    list_name: string;
    is_default: boolean;
  }>;
  is_saved: boolean;
}

// Create list form
export interface CreateListForm {
  name: string;
  description?: string;
}

// Update list form
export interface UpdateListForm {
  name?: string;
  description?: string;
}

// Add event to list form
export interface AddEventToListForm {
  event_id: string;
}

// Utility types
export type RSVPStatus = 'yes' | 'no' | 'maybe';
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'archived';
export type EventVisibility = 'public' | 'private';
export type VerificationStatus = 'verified' | 'pending' | null;
export type EmailBlastRecipientFilter = 'all' | 'yes_only' | 'yes_and_maybe';
export type EventType = 'rsvp' | 'registration' | 'ticketed';

// ============================================
// TICKETING TYPES
// ============================================

// Ticket Type - defines available ticket categories for an event
export interface TicketType {
  id: string;
  event_id: string;
  name: string;
  description?: string;
  price_amount: number;
  price_currency: string;
  quantity_total: number;
  quantity_sold: number;
  quantity_available: number;
  is_sold_out: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Discount Code - percentage-based discount codes
export interface DiscountCode {
  id: string;
  event_id: string;
  code: string;
  percentage: number;
  usage_limit: number;
  usage_count: number;
  is_active: boolean;
  created_at: string;
}

// Order Status
export type OrderStatus = 'pending' | 'paid' | 'expired' | 'cancelled';

// Order - represents a checkout attempt
export interface Order {
  id: string;
  event_id: string;
  buyer_id?: string;
  subtotal_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  total_sats?: number;
  exchange_rate?: number;
  discount_code_id?: string;
  correlation_hash?: string;
  payment_hash?: string;
  verify_url?: string;
  preimage?: string;
  bolt11_invoice?: string;
  invoice_expires_at?: string;
  status: OrderStatus;
  created_at: string;
  paid_at?: string;
}

// Order Item - line item in an order
export interface OrderItem {
  id: string;
  order_id: string;
  ticket_type_id: string;
  assigned_user_id?: string;
  assigned_email?: string;
  unit_price: number;
  unit_price_sats: number;
  created_at: string;
}

// Ticket Status
export type TicketStatus = 'active' | 'used' | 'cancelled';

// Ticket - issued after order is paid
export interface Ticket {
  id: string;
  order_id: string;
  order_item_id: string;
  ticket_type_id: string;
  event_id: string;
  owner_id?: string;
  assigned_email?: string;
  token: string;
  status: TicketStatus;
  checked_in_at?: string;
  created_at: string;
  // Populated relations
  ticket_type?: TicketType;
  event?: Event;
  owner?: UserDetails;
}

// Ticket with event details for My Tickets view
export interface TicketWithEvent extends Ticket {
  ticket_types: {
    name: string;
    description?: string;
  };
  events: {
    id: string;
    title: string;
    cover?: string;
    computed_start_date: string;
    timezone: string;
    location?: string;
  };
}

// Pending Ticket Claim
export interface PendingTicketClaim {
  id: string;
  email: string;
  ticket_id: string;
  created_at: string;
  claimed_at?: string;
  ticket?: TicketWithEvent;
}

// Checkout Request
export interface CheckoutRequest {
  items: Array<{
    ticketTypeId: string;
    assignedUserId?: string;
    assignedEmail?: string;
  }>;
  discountCodeId?: string;
}

// Checkout Response
export interface CheckoutResponse {
  orderId: string;
  invoice?: string;
  totalSats?: number;
  totalAmount: number;
  currency: string;
  expiresAt?: string;
}

// Order Status Response
export interface OrderStatusResponse {
  orderId: string;
  status: OrderStatus;
  totalSats?: number;
  totalAmount: number;
  currency: string;
}

// Validate Discount Response
export interface ValidateDiscountResponse {
  valid: boolean;
  discountCodeId?: string;
  percentage?: number;
  message?: string;
}

// Sales Summary for Host Dashboard
export interface SalesSummary {
  totalRevenueSats: number;
  totalRevenueFiat: number;
  currency: string;
  ticketsSold: number;
  ticketsByType: Array<{
    ticketTypeId: string;
    name: string;
    sold: number;
    total: number;
    revenueSats: number;
  }>;
  salesByDay: Array<{
    date: string;
    count: number;
    cumulative: number;
  }>;
  discountUsage: Array<{
    code: string;
    percentage: number;
    used: number;
    limit: number;
  }>;
}

// Attendee (checked-in ticket holder)
export interface Attendee {
  ticketId: string;
  ticketType: string;
  ownerName?: string;
  ownerUsername?: string;
  ownerImage?: string;
  checkedInAt: string;
}

// Check-in Request
export interface CheckInRequest {
  token: string;
}

// Check-in Response
export interface CheckInResponse {
  success: boolean;
  status: 'valid' | 'already_used' | 'invalid' | 'wrong_event' | 'cancelled';
  message: string;
  ticket?: {
    id: string;
    ticketType: string;
    ownerName?: string;
    ownerUsername?: string;
    ownerImage?: string;
    checkedInAt?: string;
  };
}

// Create Ticket Type Form
export interface CreateTicketTypeForm {
  name: string;
  description?: string;
  price_amount: number;
  price_currency: string;
  quantity_total: number;
}

// Update Ticket Type Form
export interface UpdateTicketTypeForm {
  name?: string;
  description?: string;
  price_amount?: number;
  price_currency?: string;
  quantity_total?: number;
  is_active?: boolean;
}

// Create Discount Code Form
export interface CreateDiscountCodeForm {
  code: string;
  percentage: number;
  usage_limit: number;
}
