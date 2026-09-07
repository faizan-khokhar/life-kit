"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { closeLocalDb, openLocalDb } from "@/lib/local-db/db";
import { pullAll } from "@/lib/local-db/cloud/sync-cycle";
import {
  startSyncWorker,
  stopSyncWorker,
  syncNow,
} from "@/lib/local-db/sync-worker";
import { countPendingOutbox } from "@/lib/local-db/outbox";
import { notifySyncStatus } from "@/lib/local-db/sync-status-store";

type LocalDbContextValue = {
  uid: string | undefined;
  ready: boolean;
  error: string | null;
};

const LocalDbContext = createContext<LocalDbContextValue>({
  uid: undefined,
  ready: false,
  error: null,
});

export function LocalDbProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const uid = user?.uid;
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      stopSyncWorker();
      setReady(false);
      setError(null);
      notifySyncStatus({
        ready: false,
        syncing: false,
        pendingCount: 0,
        lastError: null,
      });

      if (!uid) {
        await closeLocalDb();
        return;
      }

      try {
        const db = openLocalDb(uid);
        if (typeof navigator === "undefined" || navigator.onLine) {
          try {
            await pullAll(uid);
          } catch (pullErr) {
            console.warn("Initial cloud pull failed:", pullErr);
          }
        }

        if (cancelled) return;

        const pendingCount = await countPendingOutbox(uid);
        const meta = await db.meta.get("lastSyncedAt");
        notifySyncStatus({
          ready: true,
          pendingCount,
          lastSyncedAt: meta?.value ?? null,
          lastError: null,
          online: navigator.onLine,
        });

        startSyncWorker(uid);
        setReady(true);
        void syncNow();
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Failed to open local database.";
        setError(message);
        notifySyncStatus({ ready: false, lastError: message });
        setReady(false);
      }
    }

    if (authLoading) return;
    void boot();

    return () => {
      cancelled = true;
      stopSyncWorker();
    };
  }, [uid, authLoading]);

  const value = useMemo(
    () => ({
      uid,
      ready: Boolean(uid) && ready,
      error,
    }),
    [uid, ready, error],
  );

  return (
    <LocalDbContext.Provider value={value}>{children}</LocalDbContext.Provider>
  );
}

export function useLocalDb(): LocalDbContextValue {
  return useContext(LocalDbContext);
}
