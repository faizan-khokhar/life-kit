import Dexie, { type EntityTable } from "dexie";
import type {
  BudgetCategoryRow,
  ExpenseRow,
  GoalRow,
  GoalUpdateRow,
  HabitLogRow,
  HabitRow,
  MetaRow,
  NoteFolderRow,
  NoteRow,
  OutboxRow,
} from "@/lib/local-db/types";

export type LifeKitDB = Dexie & {
  notes: EntityTable<NoteRow, "id">;
  noteFolders: EntityTable<NoteFolderRow, "id">;
  budgetCategories: EntityTable<BudgetCategoryRow, "id">;
  expenses: EntityTable<ExpenseRow, "id">;
  habits: EntityTable<HabitRow, "id">;
  habitLogs: EntityTable<HabitLogRow, "id">;
  goals: EntityTable<GoalRow, "id">;
  goalUpdates: EntityTable<GoalUpdateRow, "id">;
  outbox: EntityTable<OutboxRow, "id">;
  meta: EntityTable<MetaRow, "key">;
};

let activeUid: string | null = null;
let activeDb: LifeKitDB | null = null;

function createDb(uid: string): LifeKitDB {
  const db = new Dexie(`lifekit-${uid}`) as LifeKitDB;
  db.version(1).stores({
    notes: "id, folderId, updatedAt, deletedAt",
    noteFolders: "id, name",
    budgetCategories: "id, name",
    expenses: "id, occurredAt, type",
    outbox: "id, [collection+docId], createdAt",
    meta: "key",
  });
  db.version(2).stores({
    habits: "id, active, updatedAt",
    habitLogs: "id, habitId, date, updatedAt",
  });
  db.version(3).stores({
    goals: "id, status, updatedAt",
    goalUpdates: "id, goalId, date, updatedAt",
  });
  return db;
}

/** Open (or reuse) the IndexedDB for this Firebase uid. */
export function openLocalDb(uid: string): LifeKitDB {
  if (activeDb && activeUid === uid) return activeDb;
  if (activeDb) {
    activeDb.close();
    activeDb = null;
    activeUid = null;
  }
  activeUid = uid;
  activeDb = createDb(uid);
  return activeDb;
}

export function getLocalDb(): LifeKitDB | null {
  return activeDb;
}

export function getLocalDbUid(): string | null {
  return activeUid;
}

/** Require an open DB for the given uid (throws if mismatch / missing). */
export function requireLocalDb(uid: string): LifeKitDB {
  if (!activeDb || activeUid !== uid) {
    throw new Error("Local database is not ready for this user.");
  }
  return activeDb;
}

export async function closeLocalDb(): Promise<void> {
  if (activeDb) {
    activeDb.close();
    activeDb = null;
    activeUid = null;
  }
}
