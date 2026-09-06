import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  type DocumentData,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase/client";
import { NOTE_COLORS } from "@/features/notes/data/notes";
import type {
  ChecklistItem,
  Note,
  NoteColor,
  NoteInput,
  NoteType,
} from "@/features/notes/data/types";

function notesCollection(uid: string) {
  return collection(firestore, "users", uid, "notes");
}

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    return new Date(value);
  }
  return new Date();
}

function toDateOrNull(value: unknown): Date | null {
  if (value == null) return null;
  return toDate(value);
}

function mapColor(value: unknown): NoteColor {
  const color = String(value ?? "default");
  return (NOTE_COLORS as string[]).includes(color)
    ? (color as NoteColor)
    : "default";
}

function mapItems(value: unknown): ChecklistItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((raw, index) => {
    const item = raw as Record<string, unknown>;
    return {
      id: String(item.id ?? `item-${index}`),
      text: String(item.text ?? ""),
      done: Boolean(item.done),
    };
  });
}

function mapNote(id: string, data: DocumentData): Note {
  const type: NoteType = data.type === "checklist" ? "checklist" : "text";
  return {
    id,
    title:
      data.title == null || data.title === ""
        ? null
        : String(data.title),
    type,
    body: String(data.body ?? ""),
    items: mapItems(data.items),
    color: mapColor(data.color),
    folderId: data.folderId ? String(data.folderId) : null,
    pinned: Boolean(data.pinned),
    deletedAt: toDateOrNull(data.deletedAt),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function serializeItems(items: ChecklistItem[]) {
  return items.map((item) => ({
    id: item.id,
    text: item.text,
    done: item.done,
  }));
}

/** Active notes only (`deletedAt` null / missing). */
export async function getNotes(uid: string): Promise<Note[]> {
  const snapshot = await getDocs(
    query(notesCollection(uid), orderBy("updatedAt", "desc")),
  );
  return snapshot.docs
    .map((d) => mapNote(d.id, d.data()))
    .filter((note) => note.deletedAt == null);
}

/** All notes including soft-deleted (for future trash). */
export async function getAllNotes(uid: string): Promise<Note[]> {
  const snapshot = await getDocs(
    query(notesCollection(uid), orderBy("updatedAt", "desc")),
  );
  return snapshot.docs.map((d) => mapNote(d.id, d.data()));
}

export async function addNote(
  uid: string,
  input: NoteInput,
): Promise<Note> {
  const now = serverTimestamp();
  const title =
    input.title?.trim() ? input.title.trim() : null;
  const type = input.type;
  const body = input.body ?? "";
  const items = input.items ?? [];
  const color = input.color ?? "default";
  const folderId = input.folderId ?? null;
  const pinned = input.pinned ?? false;

  const ref = await addDoc(notesCollection(uid), {
    title,
    type,
    body,
    items: serializeItems(items),
    color,
    folderId,
    pinned,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  });

  const createdAt = new Date();
  return {
    id: ref.id,
    title,
    type,
    body,
    items,
    color,
    folderId,
    pinned,
    deletedAt: null,
    createdAt,
    updatedAt: createdAt,
  };
}

export async function updateNote(
  uid: string,
  id: string,
  patch: Partial<Omit<Note, "id" | "createdAt" | "deletedAt">>,
): Promise<void> {
  const updates: DocumentData = { updatedAt: serverTimestamp() };

  if (patch.title !== undefined) {
    updates.title = patch.title?.trim() ? patch.title.trim() : null;
  }
  if (patch.type !== undefined) updates.type = patch.type;
  if (patch.body !== undefined) updates.body = patch.body;
  if (patch.items !== undefined) updates.items = serializeItems(patch.items);
  if (patch.color !== undefined) updates.color = patch.color;
  if (patch.folderId !== undefined) updates.folderId = patch.folderId;
  if (patch.pinned !== undefined) updates.pinned = patch.pinned;

  await updateDoc(doc(firestore, "users", uid, "notes", id), updates);
}

/** Soft delete â€” sets `deletedAt`; never removes the document. */
export async function softDeleteNote(uid: string, id: string): Promise<void> {
  await updateDoc(doc(firestore, "users", uid, "notes", id), {
    deletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/** Restore from trash (no UI yet). */
export async function restoreNote(uid: string, id: string): Promise<void> {
  await updateDoc(doc(firestore, "users", uid, "notes", id), {
    deletedAt: null,
    updatedAt: serverTimestamp(),
  });
}

/** Clear folderId on active notes that referenced a deleted folder. */
export async function clearNotesFolder(
  uid: string,
  folderId: string,
  noteIds: string[],
): Promise<void> {
  await Promise.all(
    noteIds.map((id) =>
      updateDoc(doc(firestore, "users", uid, "notes", id), {
        folderId: null,
        updatedAt: serverTimestamp(),
      }),
    ),
  );
}
