import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  Timestamp,
  type DocumentData,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase/client";
import type { SyncCollection } from "@/lib/local-db/types";

export function userCollection(uid: string, name: SyncCollection) {
  return collection(firestore, "users", uid, name);
}

export function userDoc(uid: string, name: SyncCollection, id: string) {
  return doc(firestore, "users", uid, name, id);
}

export async function pushUpsert(
  uid: string,
  collectionName: SyncCollection,
  docId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  await setDoc(userDoc(uid, collectionName, docId), payload, { merge: true });
}

export async function pushDelete(
  uid: string,
  collectionName: SyncCollection,
  docId: string,
): Promise<void> {
  await deleteDoc(userDoc(uid, collectionName, docId));
}

export async function pullCollection(
  uid: string,
  collectionName: SyncCollection,
): Promise<Array<{ id: string; data: DocumentData }>> {
  const snapshot = await getDocs(userCollection(uid, collectionName));
  return snapshot.docs.map((d) => ({ id: d.id, data: d.data() }));
}

/** Convert ISO / Date-ish values in payloads to Firestore Timestamps where needed. */
export function toFirestoreTimestamp(value: unknown): Timestamp {
  if (value instanceof Timestamp) return value;
  if (value instanceof Date) return Timestamp.fromDate(value);
  if (typeof value === "string" || typeof value === "number") {
    return Timestamp.fromDate(new Date(value));
  }
  return Timestamp.now();
}

export function firestoreDateToIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return new Date(value).toISOString();
  if (typeof value === "number") return new Date(value).toISOString();
  return new Date().toISOString();
}

export function firestoreDateToIsoOrNull(value: unknown): string | null {
  if (value == null) return null;
  return firestoreDateToIso(value);
}
