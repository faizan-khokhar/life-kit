export type SyncStatusSnapshot = {
  ready: boolean;
  syncing: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
  lastError: string | null;
  online: boolean;
};

type Listener = (snapshot: SyncStatusSnapshot) => void;

let snapshot: SyncStatusSnapshot = {
  ready: false,
  syncing: false,
  pendingCount: 0,
  lastSyncedAt: null,
  lastError: null,
  online: typeof navigator !== "undefined" ? navigator.onLine : true,
};

const listeners = new Set<Listener>();

export function getSyncStatusSnapshot(): SyncStatusSnapshot {
  return snapshot;
}

export function subscribeSyncStatus(listener: Listener): () => void {
  listeners.add(listener);
  listener(snapshot);
  return () => {
    listeners.delete(listener);
  };
}

export function notifySyncStatus(
  patch: Partial<SyncStatusSnapshot>,
): void {
  snapshot = { ...snapshot, ...patch };
  for (const listener of listeners) {
    listener(snapshot);
  }
}
