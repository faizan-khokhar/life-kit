"use client";

import { Cloud, RefreshCw } from "lucide-react";
import { useSyncStatus } from "@/lib/local-db/use-sync-status";
import { Button } from "@/components/ui/button";

function formatSyncedAt(iso: string | null): string {
  if (!iso) return "Not synced yet";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Not synced yet";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function SyncStatusRow() {
  const {
    ready,
    syncing,
    pendingCount,
    lastSyncedAt,
    lastError,
    online,
    syncNow,
  } = useSyncStatus();

  let description = "Cloud backup via Firebase";
  if (!ready) {
    description = "Preparing local database…";
  } else if (!online) {
    description =
      pendingCount > 0
        ? `Offline · ${pendingCount} change${pendingCount === 1 ? "" : "s"} waiting`
        : "Offline · local data only";
  } else if (syncing) {
    description = "Syncing with cloud…";
  } else if (lastError) {
    description = lastError;
  } else if (pendingCount > 0) {
    description = `${pendingCount} change${pendingCount === 1 ? "" : "s"} pending · Last: ${formatSyncedAt(lastSyncedAt)}`;
  } else {
    description = `Up to date · Last: ${formatSyncedAt(lastSyncedAt)}`;
  }

  return (
    <div className="flex items-center gap-3 px-6 py-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Cloud className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Sync</p>
        <p
          className={`text-xs ${lastError ? "text-destructive" : "text-muted-foreground"}`}
        >
          {description}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0"
        disabled={!ready || syncing || !online}
        aria-label="Sync now"
        onClick={() => {
          void syncNow();
        }}
      >
        <RefreshCw
          className={`size-4 ${syncing ? "animate-spin" : ""}`}
          aria-hidden
        />
      </Button>
    </div>
  );
}
