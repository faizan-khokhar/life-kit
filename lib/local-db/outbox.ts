import { newEntityId } from "@/lib/local-db/ids";
import { nowIso } from "@/lib/local-db/dates";
import { requireLocalDb } from "@/lib/local-db/db";
import type { OutboxOp, SyncCollection } from "@/lib/local-db/types";
import { requestSync } from "@/lib/local-db/sync-scheduler";

/**
 * Write a coalesced outbox row. Safe inside a parent Dexie transaction
 * that already includes `outbox`.
 */
export async function writeOutboxOp(
  uid: string,
  collection: SyncCollection,
  docId: string,
  op: OutboxOp,
  payload: Record<string, unknown> | null,
): Promise<void> {
  const db = requireLocalDb(uid);
  const existing = await db.outbox.where({ collection, docId }).toArray();
  if (existing.length > 0) {
    await db.outbox.bulkDelete(existing.map((row) => row.id));
  }

  if (op === "delete") {
    await db.outbox.add({
      id: newEntityId(),
      collection,
      docId,
      op: "delete",
      payloadJson: null,
      createdAt: nowIso(),
      attempts: 0,
    });
    return;
  }

  await db.outbox.add({
    id: newEntityId(),
    collection,
    docId,
    op: "upsert",
    payloadJson: JSON.stringify(payload ?? {}),
    createdAt: nowIso(),
    attempts: 0,
  });
}

/**
 * Enqueue a sync op (coalesced) and request background sync.
 */
export async function enqueueOutbox(
  uid: string,
  collection: SyncCollection,
  docId: string,
  op: OutboxOp,
  payload: Record<string, unknown> | null,
): Promise<void> {
  await writeOutboxOp(uid, collection, docId, op, payload);
  requestSync();
}

export async function listPendingOutbox(uid: string) {
  const db = requireLocalDb(uid);
  return db.outbox.orderBy("createdAt").toArray();
}

export async function removeOutbox(uid: string, id: string): Promise<void> {
  const db = requireLocalDb(uid);
  await db.outbox.delete(id);
}

export async function bumpOutboxAttempt(
  uid: string,
  id: string,
  error: string,
): Promise<void> {
  const db = requireLocalDb(uid);
  const row = await db.outbox.get(id);
  if (!row) return;
  await db.outbox.update(id, {
    attempts: row.attempts + 1,
    lastError: error.slice(0, 500),
  });
}

export async function hasPendingOutboxForDoc(
  uid: string,
  collection: SyncCollection,
  docId: string,
): Promise<boolean> {
  const db = requireLocalDb(uid);
  const count = await db.outbox.where({ collection, docId }).count();
  return count > 0;
}

export async function countPendingOutbox(uid: string): Promise<number> {
  const db = requireLocalDb(uid);
  return db.outbox.count();
}
