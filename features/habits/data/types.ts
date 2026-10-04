/** Document shapes for Habits. No Firebase imports here. */

export type Habit = {
  id: string;
  name: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type HabitLog = {
  /** Stable id: `${habitId}_${date}` for upserts. */
  id: string;
  habitId: string;
  /** Local calendar day as YYYY-MM-DD. */
  date: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type HabitInput = {
  name: string;
  active?: boolean;
};

export type HabitWithToday = Habit & {
  completedToday: boolean;
  streak: number;
  /** Mon→Sun completion for the week containing `asOf`. */
  week: boolean[];
};
