/**
 * Lightweight sync scheduler — keeps sync-worker free of circular init issues
 * with outbox enqueue.
 */

type SyncRunner = () => void;

let runner: SyncRunner | null = null;
let pending = false;

export function setSyncRunner(next: SyncRunner | null): void {
  runner = next;
  if (next && pending) {
    pending = false;
    next();
  }
}

export function requestSync(): void {
  if (runner) {
    runner();
    return;
  }
  pending = true;
}
