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
  cost: number | null;
  creator_user_id: string;
  hosts: EventHost[];
  max_capacity?: number | null;
  show_capacity_count?: boolean;
  guestListSettings?: {
    isPublic: boolean;
    allowPublicRSVP: boolean;
  };

  // Password protection
  password_protected?: boolean;
  password?: string; // Only returned for hosts in manage mode

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
  subject?: string;
  recipients?: string;
  recipientCount?: number;
  delivered?: number;
  failed?: number;
  pending?: number;
}

// Cohost Invite
export interface CohostInvite {
  id: string;
  event_id: string;
  inviter_id: string;
  invitee_id: string | null;
  invitee_email: string | null;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  created_at: string;
  updated_at: string;
  responded_at: string | null;
  inviter?: UserDetails;
  invitee?: UserDetails;
  events?: EventWithUser;
}

export type CohostInviteTarget = { userId: string } | { email: string };

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

// Password-protected event response (minimal data when locked)
export interface PasswordProtectedEventResponse {
  id: string;
  title: string;
  cover?: string;
  password_protected: true;
  hosts: Array<{
    id: string;
    name: string;
    username: string;
    avatar: string;
    image?: string;
  }>;
}

// Contact host message form
export interface ContactHostForm {
  name: string;
  email: string;
  message: string;
}

// Password verification request/response
export interface VerifyEventPasswordRequest {
  password: string;
}

export interface VerifyEventPasswordResponse {
  success: boolean;
  message: string;
}

// Registration types
export type RegistrationQuestionType =
  | 'text'
  | 'long_text'
  | 'single_select'
  | 'multi_select'
  | 'url'
  | 'phone'
  | 'checkbox'
  | 'instagram'
  | 'twitter'
  | 'youtube'
  | 'linkedin'
  | 'company';

export interface RegistrationQuestion {
  id: string;
  type: RegistrationQuestionType;
  label: string;
  placeholder?: string;
  options?: string[];
  is_required: boolean;
  sort_order: number;
  is_enabled: boolean;
}

export type ApprovalMode = 'auto' | 'manual';

export interface RegistrationSettings {
  registration_required: boolean;
  approval_mode: ApprovalMode;
  questions: RegistrationQuestion[];
}

export type RegistrationStatus = 'pending' | 'approved' | 'denied';

export interface UserRegistration {
  id: string;
  event_id: string;
  email: string;
  name: string;
  approval_status: RegistrationStatus;
  created_at: string;
  reviewed_at?: string;
  denial_reason?: string;
}

export interface MyRegistrationResponse {
  has_registration: boolean;
  registration: UserRegistration | null;
}

export interface SubmitRegistrationRequest {
  email: string;
  name: string;
  answers: Array<{
    question_id: string;
    answer: string;
  }>;
}

export interface SubmitRegistrationResponse {
  registration_id: string;
  status: RegistrationStatus;
  auto_approved: boolean;
  rsvp_id?: string;
  requires_verification?: boolean;
  email?: string;
  message: string;
}

export interface RegistrationSubmission {
  id: string;
  user_id: string | null;
  email: string;
  name: string;
  approval_status: RegistrationStatus;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  user_details?: {
    id: string;
    username: string;
    name: string;
    image: string;
    verification_status: VerificationStatus;
  };
}

export interface RegistrationAnswer {
  question_id: string;
  question_label: string;
  question_type: RegistrationQuestionType;
  answer: string;
}

export interface RegistrationSubmissionDetail extends RegistrationSubmission {
  denial_reason?: string;
  answers: RegistrationAnswer[];
}

export interface RegistrationSubmissionsResponse {
  registrations: RegistrationSubmission[];
  total: number;
  counts: {
    pending: number;
    approved: number;
    denied: number;
  };
}

export interface CreateRegistrationQuestionRequest {
  type: RegistrationQuestionType;
  label: string;
  placeholder?: string;
  options?: string[];
  is_required?: boolean;
}

export interface UpdateRegistrationQuestionRequest {
  label?: string;
  placeholder?: string;
  options?: string[];
  is_required?: boolean;
  is_enabled?: boolean;
}
