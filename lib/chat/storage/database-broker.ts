import type { Rumor } from 'applesauce-common/helpers/gift-wrap';
import { bytesToHex, matchFilter, type Filter, type NostrEvent } from 'applesauce-core/helpers';
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import {
  GroupRumorHistory,
  InviteReader,
  InviteStore,
  KeyPackageStore,
  KeyValueGroupStateBackend,
  type GroupHistoryFactory,
  type GroupRumorHistoryBackend,
  type GroupStateStoreBackend,
} from '@internet-privacy/marmot-ts';
import localforage from 'localforage';

interface StoredRumor {
  groupId: string;
  created_at: number;
  id: string;
  rumor: Rumor;
}

interface RumorDatabaseSchema extends DBSchema {
  rumors: {
    key: [string, string];
    value: StoredRumor;
    indexes: {
      by_group_created_at: [string, number];
    };
  };
}

class IndexedDbRumorHistoryBackend implements GroupRumorHistoryBackend {
  private readonly groupKey: string;
  private readonly database: IDBPDatabase<RumorDatabaseSchema>;

  constructor(database: IDBPDatabase<RumorDatabaseSchema>, groupId: Uint8Array) {
    this.database = database;
    this.groupKey = bytesToHex(groupId);
  }

  async queryRumors(filters: Filter | Filter[]): Promise<Rumor[]> {
    const normalized = Array.isArray(filters) ? filters : [filters];
    const primaryFilter = normalized[0] ?? {};
    const range = IDBKeyRange.bound(
      [this.groupKey, primaryFilter.since ?? 0],
      [this.groupKey, primaryFilter.until ?? Number.MAX_SAFE_INTEGER],
      false,
      false
    );

    const tx = this.database.transaction('rumors', 'readonly');
    const index = tx.objectStore('rumors').index('by_group_created_at');
    const cursor = await index.openCursor(range, 'prev');
    const stored: StoredRumor[] = [];
    let current = cursor;

    while (current && (primaryFilter.limit === undefined || stored.length < primaryFilter.limit)) {
      stored.push(current.value);
      current = await current.continue();
    }

    return stored
      .map((entry) => entry.rumor)
      .filter((rumor) => normalized.some((filter) => matchFilter(filter, rumor as NostrEvent)));
  }

  async addRumor(rumor: Rumor): Promise<void> {
    await this.database.put('rumors', {
      groupId: this.groupKey,
      created_at: rumor.created_at,
      id: rumor.id,
      rumor,
    });
  }

  async clear(): Promise<void> {
    const range = IDBKeyRange.bound(
      [this.groupKey, 0],
      [this.groupKey, Number.MAX_SAFE_INTEGER],
      false,
      false
    );
    const keys = await this.database.getAllKeysFromIndex('rumors', 'by_group_created_at', range);
    const tx = this.database.transaction('rumors', 'readwrite');
    const store = tx.objectStore('rumors');

    for (const key of keys) {
      await store.delete(key);
    }

    await tx.done;
  }
}

interface StorageInterfaces {
  groupStateBackend: GroupStateStoreBackend;
  historyFactory: GroupHistoryFactory<GroupRumorHistory>;
  keyPackageStore: KeyPackageStore;
  inviteStore: InviteStore;
}

export class ChatDatabaseBroker {
  private readonly rumorDatabases = new Map<
    string,
    IDBPDatabase<RumorDatabaseSchema> | Promise<IDBPDatabase<RumorDatabaseSchema>>
  >();
  private readonly storageByPubkey = new Map<string, StorageInterfaces>();

  private async getRumorDatabase(pubkey: string): Promise<IDBPDatabase<RumorDatabaseSchema>> {
    const existing = this.rumorDatabases.get(pubkey);
    if (existing) {
      return existing;
    }

    const pending = openDB<RumorDatabaseSchema>(`evento-chat-${pubkey}`, 1, {
      upgrade(database) {
        const rumors = database.createObjectStore('rumors', {
          keyPath: ['groupId', 'id'],
        });
        rumors.createIndex('by_group_created_at', ['groupId', 'created_at']);
      },
    }).then((database) => {
      this.rumorDatabases.set(pubkey, database);
      return database;
    });

    this.rumorDatabases.set(pubkey, pending);
    return pending;
  }

  async getStorageInterfaces(pubkey: string): Promise<StorageInterfaces> {
    const existing = this.storageByPubkey.get(pubkey);
    if (existing) {
      return existing;
    }

    const keyValueDatabase = `evento-chat-kv-${pubkey}`;
    const groupStateBackend = new KeyValueGroupStateBackend(
      localforage.createInstance({
        name: keyValueDatabase,
        storeName: 'groups',
      })
    );
    const keyPackageStore = new KeyPackageStore(
      localforage.createInstance({
        name: keyValueDatabase,
        storeName: 'keyPackages',
      })
    );

    const rumorDatabase = await this.getRumorDatabase(pubkey);
    const historyFactory: GroupHistoryFactory<GroupRumorHistory> = (groupId) =>
      new GroupRumorHistory(new IndexedDbRumorHistoryBackend(rumorDatabase, groupId));

    const inviteStore: InviteStore = {
      unread: localforage.createInstance({
        name: keyValueDatabase,
        storeName: 'invites-unread',
      }),
      received: localforage.createInstance({
        name: keyValueDatabase,
        storeName: 'invites-received',
      }),
      seen: localforage.createInstance({
        name: keyValueDatabase,
        storeName: 'invites-seen',
      }),
    };

    const value: StorageInterfaces = {
      groupStateBackend,
      historyFactory,
      keyPackageStore,
      inviteStore,
    };

    this.storageByPubkey.set(pubkey, value);
    return value;
  }
}

export const chatDatabaseBroker = new ChatDatabaseBroker();
