import { CHAT_GROUP_HISTORY_LOOKBACK_SECONDS } from '@/lib/chat/constants';
import type { GroupRumorHistory, MarmotClient } from '@internet-privacy/marmot-ts';
import { deserializeApplicationData } from '@internet-privacy/marmot-ts';
import { bytesToHex, unixNow } from 'applesauce-core/helpers';
import { mapEventsToTimeline } from 'applesauce-core/observable';
import { onlyEvents, RelayPool } from 'applesauce-relay';
import { BehaviorSubject, Subscription, lastValueFrom } from 'rxjs';

export class GroupSubscriptionManager {
  private readonly client: MarmotClient<GroupRumorHistory>;
  private readonly pool: RelayPool;
  private readonly unreadGroupIds$ = new BehaviorSubject<string[]>([]);
  private readonly lastMessageAtByGroup = new Map<string, number>();
  private readonly lastSeenAtByGroup = new Map<string, number>();
  private readonly processedEventIdsByGroup = new Map<string, Set<string>>();
  private readonly subscriptionsByGroup = new Map<string, Subscription>();
  private readonly ingestQueueByGroup = new Map<string, Promise<void>>();
  private watchAbortController: AbortController | null = null;
  private running = false;

  constructor(client: MarmotClient<GroupRumorHistory>, pool: RelayPool) {
    this.client = client;
    this.pool = pool;
  }

  get unreadConversationIds() {
    return this.unreadGroupIds$;
  }

  async start(): Promise<void> {
    if (this.running) {
      return;
    }

    this.running = true;
    this.watchAbortController = new AbortController();

    for await (const groups of this.client.watchGroups()) {
      if (!this.running || this.watchAbortController.signal.aborted) {
        break;
      }

      await this.syncGroups(groups);
    }
  }

  stop(): void {
    this.running = false;
    this.watchAbortController?.abort();
    this.watchAbortController = null;

    for (const subscription of this.subscriptionsByGroup.values()) {
      subscription.unsubscribe();
    }

    this.subscriptionsByGroup.clear();
    this.ingestQueueByGroup.clear();
    this.lastMessageAtByGroup.clear();
    this.lastSeenAtByGroup.clear();
    this.processedEventIdsByGroup.clear();
    this.unreadGroupIds$.next([]);
  }

  markConversationSeen(conversationId: string, seenAtSeconds: number): void {
    const normalized = Math.max(0, Math.floor(seenAtSeconds));
    this.lastSeenAtByGroup.set(conversationId, normalized);

    try {
      localStorage.setItem(this.storageKey(conversationId), String(normalized));
    } catch {
      // Ignore local storage failures.
    }

    this.recomputeUnreadConversationIds();
  }

  private async syncGroups(groups: Awaited<ReturnType<MarmotClient<GroupRumorHistory>['loadAllGroups']>>) {
    const activeIds = new Set(groups.map((group) => group.idStr));

    for (const [groupId, subscription] of this.subscriptionsByGroup.entries()) {
      if (!activeIds.has(groupId)) {
        subscription.unsubscribe();
        this.subscriptionsByGroup.delete(groupId);
        this.ingestQueueByGroup.delete(groupId);
      }
    }

    await Promise.all(groups.map((group) => this.ensureGroupSubscription(group)));
  }

  private async ensureGroupSubscription(
    group: Awaited<ReturnType<MarmotClient<GroupRumorHistory>['getGroup']>>
  ) {
    if (this.subscriptionsByGroup.has(group.idStr) || !group.groupData || !group.relays?.length) {
      return;
    }

    const filter = {
      '#h': [bytesToHex(group.groupData.nostrGroupId)],
      since: unixNow() - CHAT_GROUP_HISTORY_LOOKBACK_SECONDS,
    };

    const processed = this.getProcessedEventIds(group.idStr);
    await this.seedLastMessageAt(group);

    void lastValueFrom(this.pool.request(group.relays, filter).pipe(mapEventsToTimeline()))
      .then((events) => this.enqueueIngest(group, events, processed))
      .catch(() => {
        // Ignore initial sync failures. Live subscription may still recover.
      });

    const liveSubscription = this.pool
      .subscription(group.relays, filter)
      .pipe(onlyEvents())
      .subscribe({
        next: (event) => {
          void this.enqueueIngest(group, [event], processed);
        },
      });

    const subscription = new Subscription();
    subscription.add(liveSubscription);
    this.subscriptionsByGroup.set(group.idStr, subscription);
  }

  private async enqueueIngest(
    group: Awaited<ReturnType<MarmotClient<GroupRumorHistory>['getGroup']>>,
    events: Parameters<Awaited<ReturnType<MarmotClient<GroupRumorHistory>['getGroup']>>['ingest']>[0],
    processed: Set<string>
  ): Promise<void> {
    const queue = this.ingestQueueByGroup.get(group.idStr) ?? Promise.resolve();
    const next = queue
      .then(async () => {
        const newEvents = events.filter((event) => !processed.has(event.id));
        if (newEvents.length === 0) {
          return;
        }

        for await (const result of group.ingest(newEvents)) {
          processed.add(result.event.id);

          if (result.kind === 'processed' && result.result.kind === 'applicationMessage') {
            try {
              const rumor = deserializeApplicationData(result.result.message);
              const previous = this.lastMessageAtByGroup.get(group.idStr) ?? 0;
              if (rumor.created_at > previous) {
                this.lastMessageAtByGroup.set(group.idStr, rumor.created_at);
                this.recomputeUnreadConversationIds();
              }
            } catch {
              // Ignore malformed application messages.
            }
          }
        }
      })
      .catch(() => {
        // Swallow queue errors so future events can continue ingesting.
      });

    this.ingestQueueByGroup.set(group.idStr, next);
    await next;
  }

  private async seedLastMessageAt(
    group: Awaited<ReturnType<MarmotClient<GroupRumorHistory>['getGroup']>>
  ): Promise<void> {
    if (!group.history) {
      return;
    }

    const rumors = await group.history.queryRumors({ limit: 1 });
    const newest = rumors[0];
    if (!newest) {
      return;
    }

    this.lastMessageAtByGroup.set(group.idStr, newest.created_at);
    this.recomputeUnreadConversationIds();
  }

  private getProcessedEventIds(groupId: string): Set<string> {
    const existing = this.processedEventIdsByGroup.get(groupId);
    if (existing) {
      return existing;
    }

    const created = new Set<string>();
    this.processedEventIdsByGroup.set(groupId, created);
    return created;
  }

  private recomputeUnreadConversationIds(): void {
    const unreadIds: string[] = [];

    for (const [groupId, lastMessageAt] of this.lastMessageAtByGroup.entries()) {
      const lastSeen = this.getLastSeen(groupId);
      if (lastMessageAt > lastSeen) {
        unreadIds.push(groupId);
      }
    }

    unreadIds.sort();
    this.unreadGroupIds$.next(unreadIds);
  }

  private getLastSeen(groupId: string): number {
    const existing = this.lastSeenAtByGroup.get(groupId);
    if (existing !== undefined) {
      return existing;
    }

    try {
      const raw = localStorage.getItem(this.storageKey(groupId));
      const parsed = raw ? Number(raw) : 0;
      const normalized = Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
      this.lastSeenAtByGroup.set(groupId, normalized);
      return normalized;
    } catch {
      this.lastSeenAtByGroup.set(groupId, 0);
      return 0;
    }
  }

  private storageKey(groupId: string): string {
    return `evento-chat-last-seen:${groupId}`;
  }
}
