import type { MoneyEntry } from "@/features/budget/data/types";

/** Start of the calendar month containing `date` (local time). */
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

/** Exclusive end of the calendar month containing `date` (local time). */
export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1, 0, 0, 0, 0);
}

export function shiftMonth(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function formatMonthLabel(date: Date, now = new Date()): string {
  const sameMonth =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth();
  if (sameMonth) return "This month";
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/** Keep entries whose occurredAt falls in the calendar month of `month`. */
export function filterEntriesForMonth(
  entries: MoneyEntry[],
  month: Date,
): MoneyEntry[] {
  const start = startOfMonth(month).getTime();
  const end = endOfMonth(month).getTime();
  return entries.filter((entry) => {
    const t = entry.occurredAt.getTime();
    return t >= start && t < end;
  });
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}
