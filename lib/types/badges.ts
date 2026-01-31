/**
 * Badge type definitions for the badges system
 */

// Badge definition (from /v1/badges endpoint)
export interface Badge {
  id: string;
  slug: string;
  name: string;
  description: string;
  image_url: string;
  type: string;
}

// User's earned badge (from /v1/user/badges endpoint)
export interface UserBadge {
  id: string;
  display_order: number | null;
  earned_at: string;
  seen_at: string | null;
  badge: Badge;
}

// Request body for updating a user badge
export interface UpdateUserBadgeRequest {
  display_order?: number | null;
  mark_seen?: boolean;
}
