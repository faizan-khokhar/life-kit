import type {
  Goal,
  GoalCategory,
  GoalFilter,
  GoalUpdate,
  GoalWithUpdates,
} from "@/features/goals/data/types";

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

/**
 * Sunday that closes the week being reviewed.
 * On Sunday → today; Mon–Sat → last Sunday.
 */
export function reviewWeekSundayKey(date: Date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - d.getDay());
  return toDateKey(d);
}

export function isSunday(date: Date = new Date()): boolean {
  return date.getDay() === 0;
}

export function updateId(goalId: string, date: string): string {
  return `${goalId}_${date}`;
}

export function formatDeadline(deadline: Date | null): string | null {
  if (!deadline) return null;
  return deadline.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatWeekLabel(dateKey: string): string {
  const d = parseDateKey(dateKey);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function isValidCategory(value: string): value is GoalCategory {
  return (
    value === "personal" ||
    value === "health" ||
    value === "career" ||
    value === "finance" ||
    value === "learning" ||
    value === "other"
  );
}

export function deriveGoalsWithUpdates(
  goals: Goal[],
  updates: GoalUpdate[],
  weekKey: string = reviewWeekSundayKey(),
): GoalWithUpdates[] {
  const byGoal = new Map<string, GoalUpdate[]>();
  for (const update of updates) {
    const list = byGoal.get(update.goalId) ?? [];
    list.push(update);
    byGoal.set(update.goalId, list);
  }

  return goals.map((goal) => {
    const goalUpdates = (byGoal.get(goal.id) ?? []).sort((a, b) =>
      b.date.localeCompare(a.date),
    );
    return {
      ...goal,
      updates: goalUpdates,
      thisWeekUpdate:
        goalUpdates.find((u) => u.date === weekKey) ?? null,
    };
  });
}

export function filterGoals(
  goals: GoalWithUpdates[],
  filter: GoalFilter,
): GoalWithUpdates[] {
  if (filter === "all") return goals;
  return goals.filter((g) => g.status === filter);
}

export function sortGoals(goals: GoalWithUpdates[]): GoalWithUpdates[] {
  return [...goals].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "active" ? -1 : 1;
    }
    const aDead = a.deadline?.getTime() ?? Number.POSITIVE_INFINITY;
    const bDead = b.deadline?.getTime() ?? Number.POSITIVE_INFINITY;
    if (aDead !== bDead) return aDead - bDead;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });
}
