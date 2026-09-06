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
import type {
  MoneyEntry,
  MoneyEntryInput,
  MoneyEntryType,
} from "@/features/budget/data/types";

function expensesCollection(uid: string) {
  return collection(firestore, "users", uid, "expenses");
}

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    return new Date(value);
  }
  return new Date();
}

function mapEntry(id: string, data: DocumentData): MoneyEntry {
  const type: MoneyEntryType =
    data.type === "income" ? "income" : "expense";
  return {
    id,
    title: String(data.title ?? ""),
    category: String(data.category ?? ""),
    amount: Number(data.amount ?? 0),
    type,
    occurredAt: toDate(data.occurredAt),
    note: data.note ? String(data.note) : undefined,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export async function getExpenses(uid: string): Promise<MoneyEntry[]> {
  const snapshot = await getDocs(
    query(expensesCollection(uid), orderBy("occurredAt", "desc")),
  );
  return snapshot.docs.map((d) => mapEntry(d.id, d.data()));
}

export async function addExpense(
  uid: string,
  input: MoneyEntryInput,
): Promise<MoneyEntry> {
  const now = serverTimestamp();
  const payload = {
    title: input.title.trim(),
    category: input.category.trim(),
    amount: input.amount,
    type: input.type,
    occurredAt: Timestamp.fromDate(input.occurredAt),
    ...(input.note?.trim() ? { note: input.note.trim() } : {}),
    createdAt: now,
    updatedAt: now,
  };
  const ref = await addDoc(expensesCollection(uid), payload);
  const createdAt = new Date();
  return {
    id: ref.id,
    title: input.title.trim(),
    category: input.category.trim(),
    amount: input.amount,
    type: input.type,
    occurredAt: input.occurredAt,
    note: input.note?.trim() || undefined,
    createdAt,
    updatedAt: createdAt,
  };
}

export async function updateExpense(
  uid: string,
  id: string,
  patch: Partial<MoneyEntryInput>,
): Promise<void> {
  const updates: DocumentData = { updatedAt: serverTimestamp() };
  if (patch.title !== undefined) updates.title = patch.title.trim();
  if (patch.category !== undefined) updates.category = patch.category.trim();
  if (patch.amount !== undefined) updates.amount = patch.amount;
  if (patch.type !== undefined) updates.type = patch.type;
  if (patch.occurredAt !== undefined) {
    updates.occurredAt = Timestamp.fromDate(patch.occurredAt);
  }
  if (patch.note !== undefined) {
    updates.note = patch.note.trim() || null;
  }
  await updateDoc(doc(firestore, "users", uid, "expenses", id), updates);
}

export async function deleteExpense(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(firestore, "users", uid, "expenses", id));
}
