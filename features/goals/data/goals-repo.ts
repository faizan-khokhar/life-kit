import {
  isValidCategory,
  parseDateKey,
  toDateKey,
  updateId,
} from "@/features/goals/data/goals";
import type {
  Goal,
  GoalInput,
  GoalUpdate,
} from "@/features/goals/data/types";
import { fromIso, nowIso } from "@/lib/local-db/dates";
import { newEntityId } from "@/lib/local-db/ids";
import { requireLocalDb } from "@/lib/local-db/db";
import { writeOutboxOp } from "@/lib/local-db/outbox";
import { requestSync } from "@/lib/local-db/sync-scheduler";
import type { GoalRow, GoalUpdateRow } from "@/lib/local-db/types";

function deadlineToKey(deadline: Date | null | undefined): string | null {
  if (!deadline) return null;
  return toDateKey(deadline);
}

function rowToGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: isValidCategory(row.category) ? row.category : "other",
    deadline: row.deadline ? parseDateKey(row.deadline) : null,
    status: row.status,
    createdAt: fromIso(row.createdAt),
    updatedAt: fromIso(row.updatedAt),
  };
}

function rowToUpdate(row: GoalUpdateRow): GoalUpdate {
  return {
    id: row.id,
    goalId: row.goalId,
    date: row.date,
    note: row.note,
    createdAt: fromIso(row.createdAt),
    updatedAt: fromIso(row.updatedAt),
  };
}

export async function getGoals(uid: string): Promise<Goal[]> {
  const db = requireLocalDb(uid);
  const rows = await db.goals.toArray();
  return rows.map(rowToGoal);
}

export async function getGoalUpdates(uid: string): Promise<GoalUpdate[]> {
  const db = requireLocalDb(uid);
  const rows = await db.goalUpdates.toArray();
  return rows.map(rowToUpdate);
}

export async function addGoal(uid: string, input: GoalInput): Promise<Goal> {
  const db = requireLocalDb(uid);
  const id = newEntityId();
  const createdAt = nowIso();
  const row: GoalRow = {
    id,
    title: input.title.trim(),
    description: input.description?.trim() ?? "",
    category: input.category ?? "personal",
    deadline: deadlineToKey(input.deadline ?? null),
    status: input.status ?? "active",
    createdAt,
    updatedAt: createdAt,
  };

  await db.transaction("rw", db.goals, db.outbox, async () => {
    await db.goals.add(row);
    await writeOutboxOp(uid, "goals", id, "upsert", null);
  });
  requestSync();

  return rowToGoal(row);
}

export async function updateGoal(
  uid: string,
  id: string,
  patch: Partial<GoalInput>,
): Promise<void> {
  const db = requireLocalDb(uid);
  const existing = await db.goals.get(id);
  if (!existing) return;

  const next: GoalRow = {
    ...existing,
    updatedAt: nowIso(),
  };
  if (patch.title !== undefined) {
    const trimmed = patch.title.trim();
    if (trimmed) next.title = trimmed;
  }
  if (patch.description !== undefined) {
    next.description = patch.description.trim();
  }
  if (patch.category !== undefined) next.category = patch.category;
  if (patch.deadline !== undefined) {
    next.deadline = deadlineToKey(patch.deadline);
  }
  if (patch.status !== undefined) next.status = patch.status;

  await db.transaction("rw", db.goals, db.outbox, async () => {
    await db.goals.put(next);
    await writeOutboxOp(uid, "goals", id, "upsert", null);
  });
  requestSync();
}

export async function deleteGoal(uid: string, id: string): Promise<void> {
  const db = requireLocalDb(uid);
  const related = await db.goalUpdates.where("goalId").equals(id).toArray();

  await db.transaction("rw", db.goals, db.goalUpdates, db.outbox, async () => {
    await db.goals.delete(id);
    await writeOutboxOp(uid, "goals", id, "delete", null);

    for (const update of related) {
      await db.goalUpdates.delete(update.id);
      await writeOutboxOp(uid, "goalUpdates", update.id, "delete", null);
    }
  });
  requestSync();
}

export async function upsertGoalUpdate(
  uid: string,
  goalId: string,
  date: string,
  note: string,
): Promise<GoalUpdate> {
  const db = requireLocalDb(uid);
  const id = updateId(goalId, date);
  const existing = await db.goalUpdates.get(id);
  const now = nowIso();
  const trimmed = note.trim();

  const row: GoalUpdateRow = existing
    ? {
        ...existing,
        note: trimmed,
        updatedAt: now,
      }
    : {
        id,
        goalId,
        date,
        note: trimmed,
        createdAt: now,
        updatedAt: now,
      };

  await db.transaction("rw", db.goalUpdates, db.outbox, async () => {
    await db.goalUpdates.put(row);
    await writeOutboxOp(uid, "goalUpdates", id, "upsert", null);
  });
  requestSync();

  return rowToUpdate(row);
}
