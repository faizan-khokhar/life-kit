/** Dexie row shapes — dates stored as ISO strings. */

export type SyncCollection =
  | "notes"
  | "noteFolders"
  | "budget"
  | "expenses";

export type OutboxOp = "upsert" | "delete";

export type OutboxRow = {
  id: string;
  collection: SyncCollection;
  docId: string;
  op: OutboxOp;
  /** JSON payload for upsert; null for delete. */
  payloadJson: string | null;
  createdAt: string;
  attempts: number;
  lastError?: string;
};

export type MetaRow = {
  key: string;
  value: string;
};

export type NoteRow = {
  id: string;
  title: string | null;
  type: "text" | "checklist";
  body: string;
  itemsJson: string;
  color: string;
  folderId: string | null;
  pinned: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NoteFolderRow = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type BudgetCategoryRow = {
  id: string;
  name: string;
  limit: number;
  isFixed: number;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseRow = {
  id: string;
  title: string;
  category: string;
  amount: number;
  type: "income" | "expense";
  occurredAt: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};
