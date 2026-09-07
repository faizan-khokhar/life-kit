import { countPendingOutbox } from "@/lib/local-db/outbox";
import { getLocalDbUid } from "@/lib/local-db/db";
import { runSyncCycle } from "@/lib/local-db/cloud/sync-cycle";
import { setSyncRunner } from "@/lib/local-db/sync-scheduler";
import { notifySyncStatus } from "@/lib/local-db/sync-status-store";

let flushTimer: ReturnType<typeof setTimeout> | null = null;
let inFlight: Promise<void> | null = null;
let startedForUid: string | null = null;
let onlineHandler: (() => void) | null = null;
let visibilityHandler: (() => void) | null = null;

const DEBOUNCE_MS = 400;

async function refreshPendingCount(uid: string): Promise<void> {
  try {
    const pendingCount = await countPendingOutbox(uid);
    notifySyncStatus({ pendingCount });
  } catch {
    // DB may be closing
  }
}

async function flushNow(uid: string): Promise<void> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    notifySyncStatus({ online: false, syncing: false });
    await refreshPendingCount(uid);
    return;
  }

  if (inFlight) {
    await inFlight;
    return;
  }

  inFlight = (async () => {
    try {
      await runSyncCycle(uid);
    } catch {
      // Error recorded in status store
    } finally {
      await refreshPendingCount(uid);
      inFlight = null;
    }
  })();

  await inFlight;
}

function scheduleFlush(): void {
  const uid = getLocalDbUid();
  if (!uid) return;

  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushNow(uid);
  }, DEBOUNCE_MS);
}

export function startSyncWorker(uid: string): void {
  if (startedForUid === uid) return;
  stopSyncWorker();
  startedForUid = uid;

  setSyncRunner(scheduleFlush);

  onlineHandler = () => {
    notifySyncStatus({ online: navigator.onLine });
    if (navigator.onLine) scheduleFlush();
  };
  visibilityHandler = () => {
    if (document.visibilityState === "visible") scheduleFlush();
  };

  window.addEventListener("online", onlineHandler);
  window.addEventListener("offline", onlineHandler);
  document.addEventListener("visibilitychange", visibilityHandler);

  notifySyncStatus({ online: navigator.onLine });
  scheduleFlush();
}

export function stopSyncWorker(): void {
  setSyncRunner(null);
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (onlineHandler) {
    window.removeEventListener("online", onlineHandler);
    window.removeEventListener("offline", onlineHandler);
    onlineHandler = null;
  }
  if (visibilityHandler) {
    document.removeEventListener("visibilitychange", visibilityHandler);
    visibilityHandler = null;
  }
  startedForUid = null;
}

/** Immediate sync (e.g. after hydrate). */
export async function syncNow(): Promise<void> {
  const uid = getLocalDbUid();
  if (!uid) return;
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  await flushNow(uid);
}
