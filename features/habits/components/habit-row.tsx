"use client";

import { Check, Flame } from "lucide-react";
import { WeekDots } from "@/features/habits/components/week-dots";
import type { HabitWithToday } from "@/features/habits/data/types";
import { cn } from "@/lib/utils";

type HabitRowProps = {
  habit: HabitWithToday;
  todayIndex: number;
  onToggle: (habitId: string) => void;
};

export function HabitRow({ habit, todayIndex, onToggle }: HabitRowProps) {
  const done = habit.completedToday;

  return (
    <button
      type="button"
      onClick={() => onToggle(habit.id)}
      aria-pressed={done}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border border-border/80 bg-card px-3.5 py-3 text-left shadow-sm transition-all",
        "hover:bg-accent/30 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        done && "border-primary/25 bg-primary/5",
      )}
    >
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          done
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/30 bg-background text-transparent",
        )}
        aria-hidden
      >
        <Check className="size-5" strokeWidth={2.5} />
      </span>

      <span className="min-w-0 flex-1 space-y-1.5">
        <span className="flex items-center gap-2">
          <span
            className={cn(
              "truncate text-[15px] font-medium tracking-tight",
              done && "text-muted-foreground line-through decoration-muted-foreground/50",
            )}
          >
            {habit.name}
          </span>
          {habit.streak > 0 ? (
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-orange-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-orange-600 dark:text-orange-400">
              <Flame className="size-3" aria-hidden />
              {habit.streak}
            </span>
          ) : null}
        </span>
        <WeekDots week={habit.week} todayIndex={todayIndex} />
      </span>
    </button>
  );
}
