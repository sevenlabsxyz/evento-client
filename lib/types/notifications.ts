/**
 * Notification types for the application
 */

// Raw notification message from the API
export interface NotificationMessage {
  id: string;
  tenant: string;
  created_at: string;
  status: 'unseen' | 'seen' | 'read' | 'archived';
  workflow_key?: string;
  data?: Record<string, any>;
  trigger_data?: Record<string, any>;
  actor?: {
    id: string;
    object: string;
  } | null;
  recipient?: {
    id: string;
    object: string;
  };
  blocks: Array<{
    channel_id: string;
    seen_at: Date | null;
    read_at: Date | null;
    interacted_at: Date | null;
    archived_at: Date | null;
    rendered_content?: {
      subject?: string;
      body?: string;
      plain_text?: string;
    };
  }>;
}

// UI-friendly notification format
export interface UINotification {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  actor?: {
    id: string;
    type: string;
  };
  category: string;
  status: 'unseen' | 'seen' | 'read' | 'archived';
  data?: Record<string, any>;
  original: NotificationMessage;
}

// Notification feed response from API
export interface NotificationFeedResponse {
  data: {
    entries: NotificationMessage[];
    page_info: {
      after: string | null;
      before: string | null;
      page_size: number;
    };
    meta?: {
      total_count: number;
      unread_count: number;
      unseen_count: number;
    };
  };
}

// Filter parameters for notifications
export interface NotificationFilterParams {
  page_size?: number;
  after?: string;
  before?: string;
  archived?: boolean;
  status?: 'unseen' | 'seen' | 'read' | 'archived';
  tenant?: string;
  source?: string;
  trigger_data?: Record<string, any>;
}

// Bulk action parameters
export interface NotificationBulkActionParams {
  notification_ids: string[];
  action: 'read' | 'archive' | 'unarchive' | 'delete';
}

// Mark all notifications parameters
export interface MarkAllNotificationsParams {
  status?: 'read' | 'archived';
  before?: string;
  workflow_keys?: string[];
  tenant?: string;
}
