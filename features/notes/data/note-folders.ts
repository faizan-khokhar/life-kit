import type { NoteFolder, NoteFolderInput } from "@/features/notes/data/types";
import { fromIso, nowIso } from "@/lib/local-db/dates";
import { newEntityId } from "@/lib/local-db/ids";
import { requireLocalDb } from "@/lib/local-db/db";
import { writeOutboxOp } from "@/lib/local-db/outbox";
import { requestSync } from "@/lib/local-db/sync-scheduler";
import type { NoteFolderRow } from "@/lib/local-db/types";

function rowToFolder(row: NoteFolderRow): NoteFolder {
  return {
    id: row.id,
    name: row.name,
    createdAt: fromIso(row.createdAt),
    updatedAt: fromIso(row.updatedAt),
  };
}

export async function getNoteFolders(uid: string): Promise<NoteFolder[]> {
  const db = requireLocalDb(uid);
  const rows = await db.noteFolders.orderBy("name").toArray();
  return rows.map(rowToFolder);
}

export async function addNoteFolder(
  uid: string,
  input: NoteFolderInput,
): Promise<NoteFolder> {
  const db = requireLocalDb(uid);
  const id = newEntityId();
  const createdAt = nowIso();
  const name = input.name.trim();
  const row: NoteFolderRow = {
    id,
    name,
    createdAt,
    updatedAt: createdAt,
  };

  await db.transaction("rw", db.noteFolders, db.outbox, async () => {
    await db.noteFolders.add(row);
    await writeOutboxOp(uid, "noteFolders", id, "upsert", null);
  });
  requestSync();

  return rowToFolder(row);
}

export async function updateNoteFolder(
  uid: string,
  id: string,
  patch: Partial<NoteFolderInput>,
): Promise<void> {
  const db = requireLocalDb(uid);
  const existing = await db.noteFolders.get(id);
  if (!existing) return;

  const next: NoteFolderRow = {
    ...existing,
    updatedAt: nowIso(),
  };
  if (patch.name !== undefined) next.name = patch.name.trim();

  await db.transaction("rw", db.noteFolders, db.outbox, async () => {
    await db.noteFolders.put(next);
    await writeOutboxOp(uid, "noteFolders", id, "upsert", null);
  });
  requestSync();
}

/** Hard delete folder document. */
export async function deleteNoteFolder(uid: string, id: string): Promise<void> {
  const db = requireLocalDb(uid);
  await db.transaction("rw", db.noteFolders, db.outbox, async () => {
    await db.noteFolders.delete(id);
    await writeOutboxOp(uid, "noteFolders", id, "delete", null);
  });
  requestSync();
}
