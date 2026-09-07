import type {
  MoneyEntry,
  MoneyEntryInput,
} from "@/features/budget/data/types";
import { fromIso, nowIso, toIso } from "@/lib/local-db/dates";
import { newEntityId } from "@/lib/local-db/ids";
import { requireLocalDb } from "@/lib/local-db/db";
import { writeOutboxOp } from "@/lib/local-db/outbox";
import { requestSync } from "@/lib/local-db/sync-scheduler";
import type { ExpenseRow } from "@/lib/local-db/types";

function rowToEntry(row: ExpenseRow): MoneyEntry {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    amount: row.amount,
    type: row.type,
    occurredAt: fromIso(row.occurredAt),
    note: row.note ?? undefined,
    createdAt: fromIso(row.createdAt),
    updatedAt: fromIso(row.updatedAt),
  };
}

export async function getExpenses(uid: string): Promise<MoneyEntry[]> {
  const db = requireLocalDb(uid);
  const rows = await db.expenses.orderBy("occurredAt").reverse().toArray();
  return rows.map(rowToEntry);
}

export async function addExpense(
  uid: string,
  input: MoneyEntryInput,
): Promise<MoneyEntry> {
  const db = requireLocalDb(uid);
  const id = newEntityId();
  const createdAt = nowIso();
  const row: ExpenseRow = {
    id,
    title: input.title.trim(),
    category: input.category.trim(),
    amount: input.amount,
    type: input.type,
    occurredAt: toIso(input.occurredAt),
    note: input.note?.trim() || null,
    createdAt,
    updatedAt: createdAt,
  };

  await db.transaction("rw", db.expenses, db.outbox, async () => {
    await db.expenses.add(row);
    await writeOutboxOp(uid, "expenses", id, "upsert", null);
  });
  requestSync();

  return rowToEntry(row);
}

export async function updateExpense(
  uid: string,
  id: string,
  patch: Partial<MoneyEntryInput>,
): Promise<void> {
  const db = requireLocalDb(uid);
  const existing = await db.expenses.get(id);
  if (!existing) return;

  const next: ExpenseRow = {
    ...existing,
    updatedAt: nowIso(),
  };
  if (patch.title !== undefined) next.title = patch.title.trim();
  if (patch.category !== undefined) next.category = patch.category.trim();
  if (patch.amount !== undefined) next.amount = patch.amount;
  if (patch.type !== undefined) next.type = patch.type;
  if (patch.occurredAt !== undefined) next.occurredAt = toIso(patch.occurredAt);
  if (patch.note !== undefined) next.note = patch.note.trim() || null;

  await db.transaction("rw", db.expenses, db.outbox, async () => {
    await db.expenses.put(next);
    await writeOutboxOp(uid, "expenses", id, "upsert", null);
  });
  requestSync();
}

export async function deleteExpense(uid: string, id: string): Promise<void> {
  const db = requireLocalDb(uid);
  await db.transaction("rw", db.expenses, db.outbox, async () => {
    await db.expenses.delete(id);
    await writeOutboxOp(uid, "expenses", id, "delete", null);
  });
  requestSync();
}
