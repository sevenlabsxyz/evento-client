export interface NotificationActor {
  id: string;
  object: string;
}

export interface NotificationRenderedContent {
  subject?: string;
  body?: string;
  plain_text?: string;
}

export interface NotificationBlock {
  channel_id: string;
  rendered_content?: NotificationRenderedContent;
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

export type NotificationStatus = 'unseen' | 'unread' | 'seen' | 'read' | 'archived';

export interface NotificationMessage {
  id: string;
  tenant: string;
  workflow_key: string | null;
  actor: NotificationActor | null;
  recipient: NotificationActor;
  status: NotificationStatus;
  blocks: NotificationBlock[];
  activities: NotificationActivity[];
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  trigger_data?: Record<string, string | number | boolean | null>;
}

export interface NotificationFeedMeta {
  total_count: number;
  unseen_count: number;
  unread_count: number;
}

export interface NotificationFeedPageInfo {
  after: string | null;
  before: string | null;
  page_size: number;
}

export interface NotificationFeedResponse {
  entries: NotificationMessage[];
  meta?: NotificationFeedMeta;
  page_info?: NotificationFeedPageInfo;
}

export interface NotificationActorSummary {
  id: string;
  type: string;
}

export interface UINotification {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  actor?: NotificationActorSummary;
  category: string;
  status: NotificationStatus;
  data: Record<string, unknown>;
  original: NotificationMessage;
}

export interface NotificationFilterParams {
  page_size?: number;
  after?: string;
  before?: string;
  archived?: boolean;
  status?: NotificationStatus;
  tenant?: string;
  source?: string;
  trigger_data?: Record<string, string | number | boolean | null>;
}

export interface NotificationBulkActionParams {
  message_ids: string[];
}

export interface MarkAllNotificationsParams {
  before?: string;
  workflow_keys?: string[];
  tenant?: string;
}
