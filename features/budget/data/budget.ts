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
  BudgetCategory,
  BudgetCategoryInput,
  BudgetSummaryView,
  CategorySpendView,
  ExpenseListItemView,
  MoneyEntry,
  SpendingDayView,
} from "@/features/budget/data/types";

function budgetCollection(uid: string) {
  return collection(firestore, "users", uid, "budget");
}

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    return new Date(value);
  }
  return new Date();
}

function mapCategory(id: string, data: DocumentData): BudgetCategory {
  return {
    id,
    name: String(data.name ?? ""),
    limit: Number(data.limit ?? 0),
    isFixed: Boolean(data.isFixed),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export async function getBudgetCategories(
  uid: string,
): Promise<BudgetCategory[]> {
  const snapshot = await getDocs(
    query(budgetCollection(uid), orderBy("name", "asc")),
  );
  return snapshot.docs.map((d) => mapCategory(d.id, d.data()));
}

export async function addBudgetCategory(
  uid: string,
  input: BudgetCategoryInput,
): Promise<BudgetCategory> {
  const isFixed = Boolean(input.isFixed);
  const now = serverTimestamp();
  const ref = await addDoc(budgetCollection(uid), {
    name: input.name.trim(),
    limit: input.limit,
    isFixed,
    createdAt: now,
    updatedAt: now,
  });
  const createdAt = new Date();
  return {
    id: ref.id,
    name: input.name.trim(),
    limit: input.limit,
    isFixed,
    createdAt,
    updatedAt: createdAt,
  };
}

export async function updateBudgetCategory(
  uid: string,
  id: string,
  patch: Partial<BudgetCategoryInput>,
): Promise<void> {
  const updates: DocumentData = { updatedAt: serverTimestamp() };
  if (patch.name !== undefined) updates.name = patch.name.trim();
  if (patch.limit !== undefined) updates.limit = patch.limit;
  if (patch.isFixed !== undefined) updates.isFixed = Boolean(patch.isFixed);
  await updateDoc(doc(firestore, "users", uid, "budget", id), updates);
}

export async function deleteBudgetCategory(
  uid: string,
  id: string,
): Promise<void> {
  await deleteDoc(doc(firestore, "users", uid, "budget", id));
}

/** Derive income / expense / remaining totals from money entries. */
export function deriveBudgetSummary(
  entries: MoneyEntry[],
  monthLabel = "All time",
): BudgetSummaryView {
  let income = 0;
  let expenses = 0;
  for (const entry of entries) {
    if (entry.type === "income") income += entry.amount;
    else expenses += entry.amount;
  }
  return {
    monthLabel,
    income,
    expenses,
    remaining: income - expenses,
  };
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/**
 * Expense totals by day for the calendar month of `month`.
 * Days outside the month (or future days in the current month) are omitted
 * from the chart buckets â€” we chart each day that has spend or all days
 * up to today within the month when viewing the current month.
 */
export function deriveSpendingByDay(
  entries: MoneyEntry[],
  month: Date = new Date(),
  now = new Date(),
): SpendingDayView[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const isCurrentMonth =
    year === now.getFullYear() && monthIndex === now.getMonth();
  const lastDay = isCurrentMonth ? now.getDate() : daysInMonth;

  const buckets = Array.from({ length: lastDay }, (_, i) => {
    const day = i + 1;
    const date = new Date(year, monthIndex, day);
    return {
      key: date.toDateString(),
      label: String(day),
      amount: 0,
    };
  });

  const indexByKey = new Map(buckets.map((b, i) => [b.key, i]));

  for (const entry of entries) {
    if (entry.type !== "expense") continue;
    const key = entry.occurredAt.toDateString();
    const idx = indexByKey.get(key);
    if (idx === undefined) continue;
    buckets[idx]!.amount += entry.amount;
  }

  // Compact chart: show weekday labels for last 7 days of the window when many days
  if (buckets.length > 10) {
    return buckets.slice(-7).map((b) => {
      const d = new Date(b.key);
      return { label: DAY_LABELS[d.getDay()]!, amount: b.amount };
    });
  }

  return buckets.map(({ label, amount }) => ({ label, amount }));
}

/** Merge category limits with expense spend totals. */
export function deriveCategorySpend(
  categories: BudgetCategory[],
  entries: MoneyEntry[],
): CategorySpendView[] {
  const spentByName = new Map<string, number>();
  for (const entry of entries) {
    if (entry.type !== "expense") continue;
    const key = entry.category.trim().toLowerCase();
    spentByName.set(key, (spentByName.get(key) ?? 0) + entry.amount);
  }

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    spent: spentByName.get(category.name.trim().toLowerCase()) ?? 0,
    budget: category.limit,
    isFixed: category.isFixed,
  }));
}

/** Recent expenses for the list UI (newest first). */
export function deriveRecentExpenses(
  entries: MoneyEntry[],
  limit = 10,
): ExpenseListItemView[] {
  return entries
    .filter((e) => e.type === "expense")
    .slice()
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
    .slice(0, limit)
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      category: entry.category,
      amount: entry.amount,
      date: formatRelativeDate(entry.occurredAt),
    }));
}

function formatRelativeDate(date: Date, now = new Date()): string {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTarget = new Date(date);
  startOfTarget.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (startOfToday.getTime() - startOfTarget.getTime()) / 86_400_000,
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
