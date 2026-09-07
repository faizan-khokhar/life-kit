import Dexie, { type EntityTable } from "dexie";
import type {
  BudgetCategoryRow,
  ExpenseRow,
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
