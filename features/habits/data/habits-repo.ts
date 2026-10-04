import { logId } from "@/features/habits/data/habits";
import type { Habit, HabitInput, HabitLog } from "@/features/habits/data/types";
import { fromIso, nowIso } from "@/lib/local-db/dates";
import { newEntityId } from "@/lib/local-db/ids";
import { requireLocalDb } from "@/lib/local-db/db";
import { writeOutboxOp } from "@/lib/local-db/outbox";
import { requestSync } from "@/lib/local-db/sync-scheduler";
import type { HabitLogRow, HabitRow } from "@/lib/local-db/types";

function rowToHabit(row: HabitRow): Habit {
  return {
    id: row.id,
    name: row.name,
    active: Boolean(row.active),
    createdAt: fromIso(row.createdAt),
    updatedAt: fromIso(row.updatedAt),
  };
}

function rowToLog(row: HabitLogRow): HabitLog {
  return {
    id: row.id,
    habitId: row.habitId,
    date: row.date,
    completed: Boolean(row.completed),
    createdAt: fromIso(row.createdAt),
    updatedAt: fromIso(row.updatedAt),
  };
}

export async function getHabits(uid: string): Promise<Habit[]> {
  const db = requireLocalDb(uid);
  const rows = await db.habits.orderBy("updatedAt").reverse().toArray();
  return rows
    .map(rowToHabit)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export async function getHabitLogs(uid: string): Promise<HabitLog[]> {
  const db = requireLocalDb(uid);
  const rows = await db.habitLogs.toArray();
  return rows.map(rowToLog);
}

export async function addHabit(
  uid: string,
  input: HabitInput,
): Promise<Habit> {
  const db = requireLocalDb(uid);
  const id = newEntityId();
  const createdAt = nowIso();
  const row: HabitRow = {
    id,
    name: input.name.trim(),
    active: input.active === false ? 0 : 1,
    createdAt,
    updatedAt: createdAt,
  };

  await db.transaction("rw", db.habits, db.outbox, async () => {
    await db.habits.add(row);
    await writeOutboxOp(uid, "habits", id, "upsert", null);
  });
  requestSync();

  return rowToHabit(row);
}

export async function updateHabit(
  uid: string,
  id: string,
  patch: Partial<HabitInput & { active: boolean }>,
): Promise<void> {
  const db = requireLocalDb(uid);
  const existing = await db.habits.get(id);
  if (!existing) return;

  const next: HabitRow = {
    ...existing,
    updatedAt: nowIso(),
  };
  if (patch.name !== undefined) {
    const trimmed = patch.name.trim();
    if (trimmed) next.name = trimmed;
  }
  if (patch.active !== undefined) next.active = patch.active ? 1 : 0;

  await db.transaction("rw", db.habits, db.outbox, async () => {
    await db.habits.put(next);
    await writeOutboxOp(uid, "habits", id, "upsert", null);
  });
  requestSync();
}

export async function deleteHabit(uid: string, id: string): Promise<void> {
  const db = requireLocalDb(uid);
  const relatedLogs = await db.habitLogs.where("habitId").equals(id).toArray();

  await db.transaction("rw", db.habits, db.habitLogs, db.outbox, async () => {
    await db.habits.delete(id);
    await writeOutboxOp(uid, "habits", id, "delete", null);

    for (const log of relatedLogs) {
      await db.habitLogs.delete(log.id);
      await writeOutboxOp(uid, "habitLogs", log.id, "delete", null);
    }
  });
  requestSync();
}

export async function toggleHabitLog(
  uid: string,
  habitId: string,
  date: string,
): Promise<HabitLog> {
  const db = requireLocalDb(uid);
  const id = logId(habitId, date);
  const existing = await db.habitLogs.get(id);
  const now = nowIso();

  const row: HabitLogRow = existing
    ? {
        ...existing,
        completed: existing.completed ? 0 : 1,
        updatedAt: now,
      }
    : {
        id,
        habitId,
        date,
        completed: 1,
        createdAt: now,
        updatedAt: now,
      };

  await db.transaction("rw", db.habitLogs, db.outbox, async () => {
    await db.habitLogs.put(row);
    await writeOutboxOp(uid, "habitLogs", id, "upsert", null);
  });
  requestSync();

  return rowToLog(row);
}
