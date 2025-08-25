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
  nip05?: string; // Nostr identifier
  verification_status: 'verified' | 'pending' | null;
  verification_date?: string;
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
      verification_status: 'verified' | 'pending' | null;
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
  cost: number | null;
  creator_user_id: string;

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

// Utility types
export type RSVPStatus = 'yes' | 'no' | 'maybe';
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'archived';
export type EventVisibility = 'public' | 'private';
export type VerificationStatus = 'verified' | 'pending' | null;
export type EmailBlastRecipientFilter = 'all' | 'yes_only' | 'yes_and_maybe';
