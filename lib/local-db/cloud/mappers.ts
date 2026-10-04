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

export function habitRowToFirestorePayload(row: {
  name: string;
  active: number;
  createdAt: string;
  updatedAt: string;
}): Record<string, unknown> {
  return {
    name: row.name,
    active: Boolean(row.active),
    createdAt: toFirestoreTimestamp(row.createdAt),
    updatedAt: toFirestoreTimestamp(row.updatedAt),
  };
}

export function firestoreHabitToRow(
  id: string,
  data: DocumentData,
): {
  id: string;
  name: string;
  active: number;
  createdAt: string;
  updatedAt: string;
} {
  return {
    id,
    name: String(data.name ?? ""),
    active: data.active === false ? 0 : 1,
    createdAt: firestoreDateToIso(data.createdAt),
    updatedAt: firestoreDateToIso(data.updatedAt),
  };
}

export function habitLogRowToFirestorePayload(row: {
  habitId: string;
  date: string;
  completed: number;
  createdAt: string;
  updatedAt: string;
}): Record<string, unknown> {
  return {
    habitId: row.habitId,
    date: row.date,
    completed: Boolean(row.completed),
    createdAt: toFirestoreTimestamp(row.createdAt),
    updatedAt: toFirestoreTimestamp(row.updatedAt),
  };
}

export function firestoreHabitLogToRow(
  id: string,
  data: DocumentData,
): {
  id: string;
  habitId: string;
  date: string;
  completed: number;
  createdAt: string;
  updatedAt: string;
} {
  return {
    id,
    habitId: String(data.habitId ?? ""),
    date: String(data.date ?? ""),
    completed: data.completed ? 1 : 0,
    createdAt: firestoreDateToIso(data.createdAt),
    updatedAt: firestoreDateToIso(data.updatedAt),
  };
}

function deadlineToDateKey(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (typeof value === "string") {
    // Prefer YYYY-MM-DD; fall back to ISO date prefix.
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    if (value.length >= 10) return value.slice(0, 10);
    return null;
  }
  const iso = firestoreDateToIsoOrNull(value);
  return iso ? iso.slice(0, 10) : null;
}

export function goalRowToFirestorePayload(row: {
  title: string;
  description: string;
  category: string;
  deadline: string | null;
  status: "active" | "completed";
  createdAt: string;
  updatedAt: string;
}): Record<string, unknown> {
  return {
    title: row.title,
    description: row.description,
    category: row.category,
    deadline: row.deadline,
    status: row.status,
    createdAt: toFirestoreTimestamp(row.createdAt),
    updatedAt: toFirestoreTimestamp(row.updatedAt),
  };
}

export function firestoreGoalToRow(
  id: string,
  data: DocumentData,
): {
  id: string;
  title: string;
  description: string;
  category: string;
  deadline: string | null;
  status: "active" | "completed";
  createdAt: string;
  updatedAt: string;
} {
  return {
    id,
    title: String(data.title ?? ""),
    description: String(data.description ?? ""),
    category: String(data.category ?? "other"),
    deadline: deadlineToDateKey(data.deadline),
    status: data.status === "completed" ? "completed" : "active",
    createdAt: firestoreDateToIso(data.createdAt),
    updatedAt: firestoreDateToIso(data.updatedAt),
  };
}

export function goalUpdateRowToFirestorePayload(row: {
  goalId: string;
  date: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}): Record<string, unknown> {
  return {
    goalId: row.goalId,
    date: row.date,
    note: row.note,
    createdAt: toFirestoreTimestamp(row.createdAt),
    updatedAt: toFirestoreTimestamp(row.updatedAt),
  };
}

export function firestoreGoalUpdateToRow(
  id: string,
  data: DocumentData,
): {
  id: string;
  goalId: string;
  date: string;
  note: string;
  createdAt: string;
  updatedAt: string;
} {
  return {
    id,
    goalId: String(data.goalId ?? ""),
    date: String(data.date ?? ""),
    note: String(data.note ?? ""),
    createdAt: firestoreDateToIso(data.createdAt),
    updatedAt: firestoreDateToIso(data.updatedAt),
  };
}
