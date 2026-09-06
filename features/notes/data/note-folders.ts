import {
  addDoc,
  collection,
  deleteDoc,
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
import type { NoteFolder, NoteFolderInput } from "@/features/notes/data/types";

function noteFoldersCollection(uid: string) {
  return collection(firestore, "users", uid, "noteFolders");
}

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    return new Date(value);
  }
  return new Date();
}

function mapFolder(id: string, data: DocumentData): NoteFolder {
  return {
    id,
    name: String(data.name ?? ""),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export async function getNoteFolders(uid: string): Promise<NoteFolder[]> {
  const snapshot = await getDocs(
    query(noteFoldersCollection(uid), orderBy("name", "asc")),
  );
  return snapshot.docs.map((d) => mapFolder(d.id, d.data()));
}

export async function addNoteFolder(
  uid: string,
  input: NoteFolderInput,
): Promise<NoteFolder> {
  const name = input.name.trim();
  const now = serverTimestamp();
  const ref = await addDoc(noteFoldersCollection(uid), {
    name,
    createdAt: now,
    updatedAt: now,
  });
  const createdAt = new Date();
  return {
    id: ref.id,
    name,
    createdAt,
    updatedAt: createdAt,
  };
}

export async function updateNoteFolder(
  uid: string,
  id: string,
  patch: Partial<NoteFolderInput>,
): Promise<void> {
  const updates: DocumentData = { updatedAt: serverTimestamp() };
  if (patch.name !== undefined) updates.name = patch.name.trim();
  await updateDoc(doc(firestore, "users", uid, "noteFolders", id), updates);
}

/** Hard delete folder document. */
export async function deleteNoteFolder(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(firestore, "users", uid, "noteFolders", id));
}
