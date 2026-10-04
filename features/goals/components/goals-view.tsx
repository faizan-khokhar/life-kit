"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, Plus, Target } from "lucide-react";
import { GoalCard } from "@/features/goals/components/goal-card";
import { GoalEditorSheet } from "@/features/goals/components/goal-editor-sheet";
import { SundayReviewSheet } from "@/features/goals/components/sunday-review-sheet";
import {
  formatWeekLabel,
  isSunday,
} from "@/features/goals/data/goals";
import { useGoalsData } from "@/features/goals/data/use-goals-data";
import type { GoalFilter, GoalWithUpdates } from "@/features/goals/data/types";
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
import { cn } from "@/lib/utils";

const FILTERS: { id: GoalFilter; label: string }[] = [
  { id: "active", label: "Active" },
  { id: "completed", label: "Done" },
  { id: "all", label: "All" },
];

export function GoalsView() {
  const {
    weekKey,
    visibleGoals,
    activeGoals,
    filter,
    setFilter,
    loading,
    error,
    addGoal,
    updateGoal,
    deleteGoal,
    logProgress,
  } = useGoalsData();

  const sunday = useMemo(() => isSunday(), []);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalWithUpdates | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewFocusId, setReviewFocusId] = useState<string | null>(null);

  function openCreate() {
    setEditingGoal(null);
    setEditorOpen(true);
  }

  function openEdit(goal: GoalWithUpdates) {
    setEditingGoal(goal);
    setEditorOpen(true);
  }

  function openReview(goalId: string | null = null) {
    setReviewFocusId(goalId);
    setReviewOpen(true);
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">Goals</h2>
          <p className="text-sm text-muted-foreground">
            Track targets and log a short weekly review.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 shrink-0 gap-1.5 rounded-full"
          onClick={() => openReview(null)}
          disabled={activeGoals.length === 0}
        >
          <CalendarCheck className="size-3.5" aria-hidden />
          Review
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div
        className={cn(
          "rounded-2xl border px-4 py-3.5 shadow-sm",
          sunday
            ? "border-primary/30 bg-primary/5"
            : "border-border/80 bg-card",
        )}
      >
        <p className="text-sm font-medium text-foreground">
          {sunday ? "Sunday review day" : "Weekly check-in"}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Week of {formatWeekLabel(weekKey)}.{" "}
          {activeGoals.filter((g) => g.thisWeekUpdate).length}/
          {activeGoals.length} active goals reviewed.
        </p>
        <Button
          type="button"
          size="sm"
          className="mt-3 rounded-xl"
          onClick={() => openReview(null)}
          disabled={activeGoals.length === 0}
        >
          {sunday ? "Start Sunday review" : "Log this week's progress"}
        </Button>
      </div>

      <div className="flex gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              "h-8 rounded-full px-3 text-xs font-medium transition-colors",
              filter === item.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {visibleGoals.length === 0 ? (
        <Empty className="border border-dashed border-border/80 py-14">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Target />
            </EmptyMedia>
            <EmptyTitle>
              {filter === "completed" ? "No completed goals" : "No goals yet"}
            </EmptyTitle>
            <EmptyDescription>
              {filter === "completed"
                ? "Mark a goal complete when you finish it."
                : "Create a goal, then capture a short note each week."}
            </EmptyDescription>
          </EmptyHeader>
          {filter !== "completed" ? (
            <EmptyContent>
              <Button className="rounded-xl" onClick={openCreate}>
                Add goal
              </Button>
            </EmptyContent>
          ) : null}
        </Empty>
      ) : (
        <ul className="space-y-2.5">
          {visibleGoals.map((goal) => (
            <li key={goal.id}>
              <GoalCard
                goal={goal}
                expanded={expandedId === goal.id}
                onToggleExpand={() =>
                  setExpandedId((id) => (id === goal.id ? null : goal.id))
                }
                onEdit={() => openEdit(goal)}
                onLogProgress={() => openReview(goal.id)}
                onToggleComplete={() => {
                  void updateGoal(goal.id, {
                    status:
                      goal.status === "completed" ? "active" : "completed",
                  });
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
          onClick={openCreate}
          aria-label="Add goal"
        >
          <Plus className="size-6" />
        </Button>
      </div>

      <GoalEditorSheet
        open={editorOpen}
        onOpenChange={setEditorOpen}
        goal={editingGoal}
        onSave={async (input) => {
          if (editingGoal) {
            await updateGoal(editingGoal.id, input);
          } else {
            await addGoal(input);
          }
        }}
        onDelete={
          editingGoal
            ? async (id) => {
                await deleteGoal(id);
                if (expandedId === id) setExpandedId(null);
              }
            : undefined
        }
      />

      <SundayReviewSheet
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        weekKey={weekKey}
        goals={activeGoals}
        focusGoalId={reviewFocusId}
        onSave={(goalId, note) => logProgress(goalId, note)}
      />
    </div>
  );
}
