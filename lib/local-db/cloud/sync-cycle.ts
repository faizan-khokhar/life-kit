import { requireLocalDb } from "@/lib/local-db/db";
import { nowIso } from "@/lib/local-db/dates";
import {
  pullCollection,
  pushDelete,
  pushUpsert,
} from "@/lib/local-db/cloud/firestore-helpers";
import {
  budgetCategoryRowToFirestorePayload,
  expenseRowToFirestorePayload,
  firestoreBudgetCategoryToRow,
  firestoreExpenseToRow,
  firestoreGoalToRow,
  firestoreGoalUpdateToRow,
  firestoreHabitLogToRow,
  firestoreHabitToRow,
  firestoreNoteFolderToRow,
  firestoreNoteToRow,
  goalRowToFirestorePayload,
  goalUpdateRowToFirestorePayload,
  habitLogRowToFirestorePayload,
  habitRowToFirestorePayload,
  noteFolderRowToFirestorePayload,
  noteRowToFirestorePayload,
} from "@/lib/local-db/cloud/mappers";
import {
  bumpOutboxAttempt,
  hasPendingOutboxForDoc,
  listPendingOutbox,
  removeOutbox,
} from "@/lib/local-db/outbox";
import type { OutboxRow, SyncCollection } from "@/lib/local-db/types";
import { notifySyncStatus } from "@/lib/local-db/sync-status-store";

const HARD_DELETE_COLLECTIONS: SyncCollection[] = [
  "noteFolders",
  "budget",
  "expenses",
  "habits",
  "habitLogs",
  "goals",
  "goalUpdates",
];

async function resolveUpsertPayload(
  uid: string,
  row: OutboxRow,
): Promise<Record<string, unknown> | null> {
  const db = requireLocalDb(uid);

  if (row.collection === "notes") {
    const local = await db.notes.get(row.docId);
    if (!local) return null;
    return noteRowToFirestorePayload(local);
  }
  if (row.collection === "noteFolders") {
    const local = await db.noteFolders.get(row.docId);
    if (!local) return null;
    return noteFolderRowToFirestorePayload(local);
  }
  if (row.collection === "budget") {
    const local = await db.budgetCategories.get(row.docId);
    if (!local) return null;
    return budgetCategoryRowToFirestorePayload(local);
  }
  if (row.collection === "expenses") {
    const local = await db.expenses.get(row.docId);
    if (!local) return null;
    return expenseRowToFirestorePayload(local);
  }
  if (row.collection === "habits") {
    const local = await db.habits.get(row.docId);
    if (!local) return null;
    return habitRowToFirestorePayload(local);
  }
  if (row.collection === "habitLogs") {
    const local = await db.habitLogs.get(row.docId);
    if (!local) return null;
    return habitLogRowToFirestorePayload(local);
  }
  if (row.collection === "goals") {
    const local = await db.goals.get(row.docId);
    if (!local) return null;
    return goalRowToFirestorePayload(local);
  }
  if (row.collection === "goalUpdates") {
    const local = await db.goalUpdates.get(row.docId);
    if (!local) return null;
    return goalUpdateRowToFirestorePayload(local);
  }
  return row.payloadJson ? (JSON.parse(row.payloadJson) as Record<string, unknown>) : null;
}

async function pushOne(uid: string, row: OutboxRow): Promise<void> {
  if (row.op === "delete") {
    await pushDelete(uid, row.collection, row.docId);
    await removeOutbox(uid, row.id);
    return;
  }

  const payload = await resolveUpsertPayload(uid, row);
  if (!payload) {
    // Local row gone — drop stale upsert
    await removeOutbox(uid, row.id);
    return;
  }

  await pushUpsert(uid, row.collection, row.docId, payload);
  await removeOutbox(uid, row.id);
}

export async function pushOutbox(uid: string): Promise<void> {
  const pending = await listPendingOutbox(uid);
  for (const row of pending) {
    try {
      await pushOne(uid, row);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Sync push failed.";
      await bumpOutboxAttempt(uid, row.id, message);
      notifySyncStatus({ lastError: message });
      // Stop on first failure; retry later
      throw err;
    }
  }
}

function remoteWins(
  localUpdatedAt: string | undefined,
  remoteUpdatedAt: string,
): boolean {
  if (!localUpdatedAt) return true;
  return (
    new Date(remoteUpdatedAt).getTime() > new Date(localUpdatedAt).getTime()
  );
}

async function mergeNotes(uid: string): Promise<void> {
  const db = requireLocalDb(uid);
  const remote = await pullCollection(uid, "notes");
  for (const { id, data } of remote) {
    if (await hasPendingOutboxForDoc(uid, "notes", id)) continue;
    const row = firestoreNoteToRow(id, data);
    const local = await db.notes.get(id);
    if (!local || remoteWins(local.updatedAt, row.updatedAt)) {
      await db.notes.put(row);
    }
  }
}

async function mergeHardDeleteCollection(
  uid: string,
  collection: SyncCollection,
): Promise<void> {
  const db = requireLocalDb(uid);
  const remote = await pullCollection(uid, collection);
  const remoteIds = new Set(remote.map((r) => r.id));

  for (const { id, data } of remote) {
    if (await hasPendingOutboxForDoc(uid, collection, id)) continue;

    if (collection === "noteFolders") {
      const row = firestoreNoteFolderToRow(id, data);
      const local = await db.noteFolders.get(id);
      if (!local || remoteWins(local.updatedAt, row.updatedAt)) {
        await db.noteFolders.put(row);
      }
    } else if (collection === "budget") {
      const row = firestoreBudgetCategoryToRow(id, data);
      const local = await db.budgetCategories.get(id);
      if (!local || remoteWins(local.updatedAt, row.updatedAt)) {
        await db.budgetCategories.put(row);
      }
    } else if (collection === "expenses") {
      const row = firestoreExpenseToRow(id, data);
      const local = await db.expenses.get(id);
      if (!local || remoteWins(local.updatedAt, row.updatedAt)) {
        await db.expenses.put(row);
      }
    } else if (collection === "habits") {
      const row = firestoreHabitToRow(id, data);
      const local = await db.habits.get(id);
      if (!local || remoteWins(local.updatedAt, row.updatedAt)) {
        await db.habits.put(row);
      }
    } else if (collection === "habitLogs") {
      const row = firestoreHabitLogToRow(id, data);
      const local = await db.habitLogs.get(id);
      if (!local || remoteWins(local.updatedAt, row.updatedAt)) {
        await db.habitLogs.put(row);
      }
    } else if (collection === "goals") {
      const row = firestoreGoalToRow(id, data);
      const local = await db.goals.get(id);
      if (!local || remoteWins(local.updatedAt, row.updatedAt)) {
        await db.goals.put(row);
      }
    } else if (collection === "goalUpdates") {
      const row = firestoreGoalUpdateToRow(id, data);
      const local = await db.goalUpdates.get(id);
      if (!local || remoteWins(local.updatedAt, row.updatedAt)) {
        await db.goalUpdates.put(row);
      }
    }
  }

  // Remove local docs deleted remotely (when no pending outbox)
  if (collection === "noteFolders") {
    const locals = await db.noteFolders.toArray();
    for (const local of locals) {
      if (remoteIds.has(local.id)) continue;
      if (await hasPendingOutboxForDoc(uid, collection, local.id)) continue;
      await db.noteFolders.delete(local.id);
    }
  } else if (collection === "budget") {
    const locals = await db.budgetCategories.toArray();
    for (const local of locals) {
      if (remoteIds.has(local.id)) continue;
      if (await hasPendingOutboxForDoc(uid, collection, local.id)) continue;
      await db.budgetCategories.delete(local.id);
    }
  } else if (collection === "expenses") {
    const locals = await db.expenses.toArray();
    for (const local of locals) {
      if (remoteIds.has(local.id)) continue;
      if (await hasPendingOutboxForDoc(uid, collection, local.id)) continue;
      await db.expenses.delete(local.id);
    }
  } else if (collection === "habits") {
    const locals = await db.habits.toArray();
    for (const local of locals) {
      if (remoteIds.has(local.id)) continue;
      if (await hasPendingOutboxForDoc(uid, collection, local.id)) continue;
      await db.habits.delete(local.id);
    }
  } else if (collection === "habitLogs") {
    const locals = await db.habitLogs.toArray();
    for (const local of locals) {
      if (remoteIds.has(local.id)) continue;
      if (await hasPendingOutboxForDoc(uid, collection, local.id)) continue;
      await db.habitLogs.delete(local.id);
    }
  } else if (collection === "goals") {
    const locals = await db.goals.toArray();
    for (const local of locals) {
      if (remoteIds.has(local.id)) continue;
      if (await hasPendingOutboxForDoc(uid, collection, local.id)) continue;
      await db.goals.delete(local.id);
    }
  } else if (collection === "goalUpdates") {
    const locals = await db.goalUpdates.toArray();
    for (const local of locals) {
      if (remoteIds.has(local.id)) continue;
      if (await hasPendingOutboxForDoc(uid, collection, local.id)) continue;
      await db.goalUpdates.delete(local.id);
    }
  }
}

export async function pullAll(uid: string): Promise<void> {
  const db = requireLocalDb(uid);
  await mergeNotes(uid);
  for (const collection of HARD_DELETE_COLLECTIONS) {
    await mergeHardDeleteCollection(uid, collection);
  }
  await db.meta.put({ key: "lastPulledAt", value: nowIso() });
}

export async function runSyncCycle(uid: string): Promise<void> {
  notifySyncStatus({ syncing: true, lastError: null });
  try {
    await pushOutbox(uid);
    await pullAll(uid);
    const syncedAt = nowIso();
    const db = requireLocalDb(uid);
    await db.meta.put({ key: "lastSyncedAt", value: syncedAt });
    notifySyncStatus({
      syncing: false,
      lastSyncedAt: syncedAt,
      lastError: null,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Sync failed.";
    notifySyncStatus({ syncing: false, lastError: message });
    throw err;
  }
}
