export interface NotificationActor {
  id: string;
  object: string;
}

export interface NotificationBlock {
  channel_id: string;
  rendered_content: {
    subject?: string;
    body?: string;
    plain_text?: string;
  } | null;
  seen_at: string | null;
  read_at: string | null;
  interacted_at: string | null;
  archived_at: string | null;
}

export interface NotificationActivity {
  id: string;
  actor: NotificationActor;
  created_at: string;
}

export interface NotificationMessage {
  id: string;
  tenant: string;
  workflow_key: string;
  actor: NotificationActor | null;
  recipient: NotificationActor;
  status: 'unseen' | 'seen' | 'read' | 'archived';
  blocks: NotificationBlock[];
  activities: NotificationActivity[];
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  trigger_data: Record<string, unknown>;
}

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
  status: string;
  data: Record<string, unknown>;
  original: NotificationMessage;
}

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

export interface NotificationFilterParams {
  page_size?: number;
  after?: string;
  before?: string;
  archived?: boolean;
  status?: string;
  tenant?: string;
  source?: string;
  trigger_data?: Record<string, unknown>;
}

export interface NotificationBulkActionParams {
  message_ids: string[];
}

export interface MarkAllNotificationsParams {
  older_than?: string;
  newer_than?: string;
  before?: string;
  categories?: string[];
}
