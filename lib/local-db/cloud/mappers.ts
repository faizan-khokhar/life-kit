import type { DocumentData } from "firebase/firestore";
import {
  firestoreDateToIso,
  firestoreDateToIsoOrNull,
  toFirestoreTimestamp,
} from "@/lib/local-db/cloud/firestore-helpers";
import type { NoteRow } from "@/lib/local-db/types";

export function noteRowToFirestorePayload(
  row: NoteRow,
): Record<string, unknown> {
  const items = JSON.parse(row.itemsJson) as unknown[];
  return {
    title: row.title,
    type: row.type,
    body: row.body,
    items,
    color: row.color,
    folderId: row.folderId,
    pinned: Boolean(row.pinned),
    deletedAt: row.deletedAt ? toFirestoreTimestamp(row.deletedAt) : null,
    createdAt: toFirestoreTimestamp(row.createdAt),
    updatedAt: toFirestoreTimestamp(row.updatedAt),
  };
}

export function firestoreNoteToRow(id: string, data: DocumentData): NoteRow {
  const items = Array.isArray(data.items) ? data.items : [];
  return {
    id,
    title:
      data.title == null || data.title === ""
        ? null
        : String(data.title),
    type: data.type === "checklist" ? "checklist" : "text",
    body: String(data.body ?? ""),
    itemsJson: JSON.stringify(items),
    color: String(data.color ?? "default"),
    folderId: data.folderId ? String(data.folderId) : null,
    pinned: data.pinned ? 1 : 0,
    deletedAt: firestoreDateToIsoOrNull(data.deletedAt),
    createdAt: firestoreDateToIso(data.createdAt),
    updatedAt: firestoreDateToIso(data.updatedAt),
  };
}

export function noteFolderRowToFirestorePayload(row: {
  name: string;
  createdAt: string;
  updatedAt: string;
}): Record<string, unknown> {
  return {
    name: row.name,
    createdAt: toFirestoreTimestamp(row.createdAt),
    updatedAt: toFirestoreTimestamp(row.updatedAt),
  };
}

export function firestoreNoteFolderToRow(
  id: string,
  data: DocumentData,
): { id: string; name: string; createdAt: string; updatedAt: string } {
  return {
    id,
    name: String(data.name ?? ""),
    createdAt: firestoreDateToIso(data.createdAt),
    updatedAt: firestoreDateToIso(data.updatedAt),
  };
}

export function budgetCategoryRowToFirestorePayload(row: {
  name: string;
  limit: number;
  isFixed: number;
  createdAt: string;
  updatedAt: string;
}): Record<string, unknown> {
  return {
    name: row.name,
    limit: row.limit,
    isFixed: Boolean(row.isFixed),
    createdAt: toFirestoreTimestamp(row.createdAt),
    updatedAt: toFirestoreTimestamp(row.updatedAt),
  };
}

export function firestoreBudgetCategoryToRow(
  id: string,
  data: DocumentData,
): {
  id: string;
  name: string;
  limit: number;
  isFixed: number;
  createdAt: string;
  updatedAt: string;
} {
  return {
    id,
    name: String(data.name ?? ""),
    limit: Number(data.limit ?? 0),
    isFixed: data.isFixed ? 1 : 0,
    createdAt: firestoreDateToIso(data.createdAt),
    updatedAt: firestoreDateToIso(data.updatedAt),
  };
}

export function expenseRowToFirestorePayload(row: {
  title: string;
  category: string;
  amount: number;
  type: "income" | "expense";
  occurredAt: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}): Record<string, unknown> {
  return {
    title: row.title,
    category: row.category,
    amount: row.amount,
    type: row.type,
    occurredAt: toFirestoreTimestamp(row.occurredAt),
    note: row.note,
    createdAt: toFirestoreTimestamp(row.createdAt),
    updatedAt: toFirestoreTimestamp(row.updatedAt),
  };
}

export function firestoreExpenseToRow(
  id: string,
  data: DocumentData,
): {
  id: string;
  title: string;
  category: string;
  amount: number;
  type: "income" | "expense";
  occurredAt: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
} {
  return {
    id,
    title: String(data.title ?? ""),
    category: String(data.category ?? ""),
    amount: Number(data.amount ?? 0),
    type: data.type === "income" ? "income" : "expense",
    occurredAt: firestoreDateToIso(data.occurredAt),
    note: data.note ? String(data.note) : null,
    createdAt: firestoreDateToIso(data.createdAt),
    updatedAt: firestoreDateToIso(data.updatedAt),
  };
}
