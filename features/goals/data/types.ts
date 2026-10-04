/** Document shapes for Goals. No Firebase imports here. */

export type GoalStatus = "active" | "completed";

export type GoalCategory =
  | "personal"
  | "health"
  | "career"
  | "finance"
  | "learning"
  | "other";

export type Goal = {
  id: string;
  title: string;
  description: string;
  category: GoalCategory;
  deadline: Date | null;
  status: GoalStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type GoalUpdate = {
  /** Stable id: `${goalId}_${date}` for weekly upserts. */
  id: string;
  goalId: string;
  /** Sunday (local) of the reviewed week as YYYY-MM-DD. */
  date: string;
  note: string;
  createdAt: Date;
  updatedAt: Date;
};

export type GoalInput = {
  title: string;
  description?: string;
  category?: GoalCategory;
  deadline?: Date | null;
  status?: GoalStatus;
};

export type GoalWithUpdates = Goal & {
  updates: GoalUpdate[];
  thisWeekUpdate: GoalUpdate | null;
};

export type GoalFilter = "active" | "completed" | "all";

export const GOAL_CATEGORIES: GoalCategory[] = [
  "personal",
  "health",
  "career",
  "finance",
  "learning",
  "other",
];

export const GOAL_CATEGORY_LABELS: Record<GoalCategory, string> = {
  personal: "Personal",
  health: "Health",
  career: "Career",
  finance: "Finance",
  learning: "Learning",
  other: "Other",
};
