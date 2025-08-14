// Notification API types based on the Knock API responses

/**
 * Knock notification message object
 */
export interface NotificationMessage {
  id: string;
  tenant: string | null;
  workflow_key: string;
  actor: {
    id: string;
    object: string;
  } | null;
  recipient: {
    id: string;
    object: string;
  };
  status: 'unseen' | 'seen' | 'read' | 'archived';
  blocks: {
    channel_id: string;
    rendered_content: {
      subject?: string;
      body?: string;
      html?: string;
      markdown?: string;
      plain_text?: string;
    };
    seen_at: string | null;
    read_at: string | null;
    interacted_at: string | null;
    archived_at: string | null;
  }[];
  activities: {
    id: string;
    actor: {
      id: string;
      object: string;
    } | null;
    created_at: string;
  }[];
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
  trigger_data: Record<string, any>;
}

/**
 * Knock feed response (paginated list of messages)
 */
export interface NotificationFeedResponse {
  entries: NotificationMessage[];
  meta: {
    total_count: number;
    unseen_count: number;
    unread_count: number;
  };
  page_info: {
    after: string | null;
    before: string | null;
    page_size: number;
  };
}

/**
 * Notification filter parameters
 */
export interface NotificationFilterParams {
  page_size?: number;
  after?: string;
  before?: string;
  archived?: boolean;
  status?: 'seen' | 'read' | 'unseen' | 'unread';
  tenant?: string;
  source?: string;
  trigger_data?: Record<string, string>;
}

/**
 * Notification bulk action parameters
 */
export interface NotificationBulkActionParams {
  message_ids: string[];
}

/**
 * Mark all notifications parameters
 */
export interface MarkAllNotificationsParams {
  before?: string;
  workflow_keys?: string[];
  tenant?: string;
}

/**
 * UI representation of a notification for display
 */
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
