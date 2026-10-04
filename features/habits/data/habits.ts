import type { Habit, HabitLog, HabitWithToday } from "@/features/habits/data/types";

/** Local calendar day as YYYY-MM-DD. */
export function toDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function logId(habitId: string, date: string): string {
  return `${habitId}_${date}`;
}

/** Monday (local) of the week containing `date`. */
export function startOfWeekMonday(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 Sun … 6 Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function shiftDateKey(dateKey: string, days: number): string {
  const d = parseDateKey(dateKey);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

export function formatDateLabel(dateKey: string): string {
  const d = parseDateKey(dateKey);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function weekDayLabels(weekStart: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d.toLocaleDateString(undefined, { weekday: "narrow" });
  });
}

function isCompleted(
  logsByKey: Map<string, HabitLog>,
  habitId: string,
  date: string,
): boolean {
  return logsByKey.get(logId(habitId, date))?.completed === true;
}

/** Consecutive completed days ending at `asOf` (or yesterday if today incomplete). */
export function computeStreak(
  logs: HabitLog[],
  habitId: string,
  asOf: string = toDateKey(),
): number {
  const logsByKey = new Map(logs.map((log) => [log.id, log]));
  let cursor = asOf;
  if (!isCompleted(logsByKey, habitId, cursor)) {
    cursor = shiftDateKey(asOf, -1);
  }
  let streak = 0;
  while (isCompleted(logsByKey, habitId, cursor)) {
    streak += 1;
    cursor = shiftDateKey(cursor, -1);
  }
  return streak;
}

export function weekFlags(
  logs: HabitLog[],
  habitId: string,
  asOf: string = toDateKey(),
): boolean[] {
  const logsByKey = new Map(logs.map((log) => [log.id, log]));
  const weekStart = startOfWeekMonday(parseDateKey(asOf));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return isCompleted(logsByKey, habitId, toDateKey(d));
  });
}

export function toggleLog(
  logs: HabitLog[],
  habitId: string,
  date: string,
): HabitLog[] {
  const id = logId(habitId, date);
  const existing = logs.find((log) => log.id === id);
  const now = new Date();
  if (existing) {
    return logs.map((log) =>
      log.id === id
        ? { ...log, completed: !log.completed, updatedAt: now }
        : log,
    );
  }
  return [
    ...logs,
    {
      id,
      habitId,
      date,
      completed: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function deriveHabitsForDay(
  habits: Habit[],
  logs: HabitLog[],
  date: string = toDateKey(),
): HabitWithToday[] {
  const active = habits.filter((h) => h.active);
  return active.map((habit) => ({
    ...habit,
    completedToday: logs.some(
      (log) =>
        log.habitId === habit.id &&
        log.date === date &&
        log.completed,
    ),
    streak: computeStreak(logs, habit.id, date),
    week: weekFlags(logs, habit.id, date),
  }));
}

export function dayProgress(habits: HabitWithToday[]): {
  done: number;
  total: number;
  percent: number;
} {
  const total = habits.length;
  const done = habits.filter((h) => h.completedToday).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { done, total, percent };
}
