"use client";

import { useEffect, useState } from "react";
import {
  getSyncStatusSnapshot,
  subscribeSyncStatus,
  type SyncStatusSnapshot,
} from "@/lib/local-db/sync-status-store";
import { syncNow } from "@/lib/local-db/sync-worker";

export function useSyncStatus(): SyncStatusSnapshot & {
  syncNow: () => Promise<void>;
} {
  const [status, setStatus] = useState<SyncStatusSnapshot>(
    getSyncStatusSnapshot,
  );

  useEffect(() => subscribeSyncStatus(setStatus), []);

  return {
    ...status,
    syncNow,
  };
}
