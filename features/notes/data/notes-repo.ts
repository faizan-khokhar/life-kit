import { NOTE_COLORS } from "@/features/notes/data/notes";
import type {
  ChecklistItem,
  Note,
  NoteColor,
  NoteInput,
  NoteType,
} from "@/features/notes/data/types";
import { fromIso, fromIsoOrNull, nowIso } from "@/lib/local-db/dates";
import { newEntityId } from "@/lib/local-db/ids";
import { requireLocalDb } from "@/lib/local-db/db";
import { writeOutboxOp } from "@/lib/local-db/outbox";
import { requestSync } from "@/lib/local-db/sync-scheduler";
import type { NoteRow } from "@/lib/local-db/types";

function mapColor(value: string): NoteColor {
  return (NOTE_COLORS as string[]).includes(value)
    ? (value as NoteColor)
    : "default";
}

function mapItems(itemsJson: string): ChecklistItem[] {
  try {
    const raw = JSON.parse(itemsJson) as unknown;
    if (!Array.isArray(raw)) return [];
    return raw.map((item, index) => {
      const row = item as Record<string, unknown>;
      return {
        id: String(row.id ?? `item-${index}`),
        text: String(row.text ?? ""),
        done: Boolean(row.done),
      };
    });
  } catch {
    return [];
  }
}

function serializeItems(items: ChecklistItem[]): string {
  return JSON.stringify(
    items.map((item) => ({
      id: item.id,
      text: item.text,
      done: item.done,
    })),
  );
}

function rowToNote(row: NoteRow): Note {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    body: row.body,
    items: mapItems(row.itemsJson),
    color: mapColor(row.color),
    folderId: row.folderId,
    pinned: Boolean(row.pinned),
    deletedAt: fromIsoOrNull(row.deletedAt),
    createdAt: fromIso(row.createdAt),
    updatedAt: fromIso(row.updatedAt),
  };
}

/** Active notes only (`deletedAt` null). */
export async function getNotes(uid: string): Promise<Note[]> {
  const db = requireLocalDb(uid);
  const rows = await db.notes.orderBy("updatedAt").reverse().toArray();
  return rows.filter((row) => row.deletedAt == null).map(rowToNote);
}

/** All notes including soft-deleted (for future trash). */
export async function getAllNotes(uid: string): Promise<Note[]> {
  const db = requireLocalDb(uid);
  const rows = await db.notes.orderBy("updatedAt").reverse().toArray();
  return rows.map(rowToNote);
}

export async function addNote(
  uid: string,
  input: NoteInput,
): Promise<Note> {
  const db = requireLocalDb(uid);
  const id = newEntityId();
  const createdAt = nowIso();
  const title = input.title?.trim() ? input.title.trim() : null;
  const type: NoteType = input.type;
  const body = input.body ?? "";
  const items = input.items ?? [];
  const color = input.color ?? "default";
  const folderId = input.folderId ?? null;
  const pinned = input.pinned ?? false;

  const row: NoteRow = {
    id,
    title,
    type,
    body,
    itemsJson: serializeItems(items),
    color,
    folderId,
    pinned: pinned ? 1 : 0,
    deletedAt: null,
    createdAt,
    updatedAt: createdAt,
  };

  await db.transaction("rw", db.notes, db.outbox, async () => {
    await db.notes.add(row);
    await writeOutboxOp(uid, "notes", id, "upsert", null);
  });
  requestSync();

  return rowToNote(row);
}

export async function updateNote(
  uid: string,
  id: string,
  patch: Partial<Omit<Note, "id" | "createdAt" | "deletedAt">>,
): Promise<void> {
  const db = requireLocalDb(uid);
  const existing = await db.notes.get(id);
  if (!existing) return;

  const updatedAt = nowIso();
  const next: NoteRow = {
    ...existing,
    updatedAt,
  };

  if (patch.title !== undefined) {
    next.title = patch.title?.trim() ? patch.title.trim() : null;
  }
  if (patch.type !== undefined) next.type = patch.type;
  if (patch.body !== undefined) next.body = patch.body;
  if (patch.items !== undefined) next.itemsJson = serializeItems(patch.items);
  if (patch.color !== undefined) next.color = patch.color;
  if (patch.folderId !== undefined) next.folderId = patch.folderId;
  if (patch.pinned !== undefined) next.pinned = patch.pinned ? 1 : 0;

  await db.transaction("rw", db.notes, db.outbox, async () => {
    await db.notes.put(next);
    await writeOutboxOp(uid, "notes", id, "upsert", null);
  });
  requestSync();
}

/** Soft delete — sets `deletedAt`; never removes the document. */
export async function softDeleteNote(uid: string, id: string): Promise<void> {
  const db = requireLocalDb(uid);
  const existing = await db.notes.get(id);
  if (!existing) return;

  const updatedAt = nowIso();
  const next: NoteRow = {
    ...existing,
    deletedAt: updatedAt,
    updatedAt,
  };

  await db.transaction("rw", db.notes, db.outbox, async () => {
    await db.notes.put(next);
    await writeOutboxOp(uid, "notes", id, "upsert", null);
  });
  requestSync();
}

/** Restore from trash (no UI yet). */
export async function restoreNote(uid: string, id: string): Promise<void> {
  const db = requireLocalDb(uid);
  const existing = await db.notes.get(id);
  if (!existing) return;

  const updatedAt = nowIso();
  const next: NoteRow = {
    ...existing,
    deletedAt: null,
    updatedAt,
  };

  await db.transaction("rw", db.notes, db.outbox, async () => {
    await db.notes.put(next);
    await writeOutboxOp(uid, "notes", id, "upsert", null);
  });
  requestSync();
}

/** Clear folderId on active notes that referenced a deleted folder. */
export async function clearNotesFolder(
  uid: string,
  _folderId: string,
  noteIds: string[],
): Promise<void> {
  const db = requireLocalDb(uid);
  const updatedAt = nowIso();

  await db.transaction("rw", db.notes, db.outbox, async () => {
    for (const id of noteIds) {
      const existing = await db.notes.get(id);
      if (!existing) continue;
      const next: NoteRow = {
        ...existing,
        folderId: null,
        updatedAt,
      };
      await db.notes.put(next);
      await writeOutboxOp(uid, "notes", id, "upsert", null);
    }
  });
  requestSync();
}
