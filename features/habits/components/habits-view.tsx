"use client";

import { useMemo, useState } from "react";
import { Flame, Plus, Settings2 } from "lucide-react";
import { HabitProgress } from "@/features/habits/components/habit-progress";
import { HabitRow } from "@/features/habits/components/habit-row";
import { ManageHabitsSheet } from "@/features/habits/components/manage-habits-sheet";
import {
  formatDateLabel,
  parseDateKey,
  startOfWeekMonday,
  toDateKey,
} from "@/features/habits/data/habits";
import { useHabitsData } from "@/features/habits/data/use-habits-data";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";

export function HabitsView() {
  const today = useMemo(() => toDateKey(), []);
  const {
    habits,
    habitsForDay,
    progress,
    loading,
    error,
    toggleToday,
    addHabit,
    updateHabit,
    deleteHabit,
  } = useHabitsData(today);

  const [manageOpen, setManageOpen] = useState(false);

  const todayIndex = useMemo(() => {
    const weekStart = startOfWeekMonday(parseDateKey(today));
    const todayDate = parseDateKey(today);
    return Math.round(
      (todayDate.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24),
    );
  }, [today]);

  const bestStreak = useMemo(
    () => habitsForDay.reduce((max, h) => Math.max(max, h.streak), 0),
    [habitsForDay],
  );

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">Habits</h2>
          <p className="text-sm text-muted-foreground">
            Tap a habit to check it off for today.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 shrink-0 gap-1.5 rounded-full"
          onClick={() => setManageOpen(true)}
        >
          <Settings2 className="size-3.5" aria-hidden />
          Manage
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <HabitProgress
        done={progress.done}
        total={progress.total}
        percent={progress.percent}
        dateLabel={formatDateLabel(today)}
      />

      {bestStreak > 0 ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Flame className="size-3.5 text-orange-500" aria-hidden />
          Best current streak:{" "}
          <span className="font-medium text-foreground">
            {bestStreak} day{bestStreak === 1 ? "" : "s"}
          </span>
        </p>
      ) : null}

      {habitsForDay.length === 0 ? (
        <Empty className="border border-dashed border-border/80 py-14">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Flame />
            </EmptyMedia>
            <EmptyTitle>No active habits</EmptyTitle>
            <EmptyDescription>
              Create a habit to start your daily check-in. Keep it small and
              repeatable.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              className="rounded-xl"
              onClick={() => setManageOpen(true)}
            >
              Add habit
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <ul className="space-y-2.5">
          {habitsForDay.map((habit) => (
            <li key={habit.id}>
              <HabitRow
                habit={habit}
                todayIndex={todayIndex}
                onToggle={(id) => {
                  void toggleToday(id);
                }}
              />
            </li>
          ))}
        </ul>
      )}

      <div className="fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 lg:right-8 lg:bottom-8">
        <Button
          type="button"
          size="lg"
          className="size-14 rounded-full shadow-lg"
          onClick={() => setManageOpen(true)}
          aria-label="Add or manage habits"
        >
          <Plus className="size-6" />
        </Button>
      </div>

      <ManageHabitsSheet
        open={manageOpen}
        onOpenChange={setManageOpen}
        habits={habits}
        onAdd={(name) => addHabit({ name })}
        onUpdate={updateHabit}
        onDelete={deleteHabit}
      />
    </div>
  );
}
