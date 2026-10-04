"use client";

import { Check, ChevronDown, Pencil, PenLine } from "lucide-react";
import {
  formatDeadline,
  formatWeekLabel,
} from "@/features/goals/data/goals";
import type { GoalWithUpdates } from "@/features/goals/data/types";
import { GOAL_CATEGORY_LABELS } from "@/features/goals/data/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GoalCardProps = {
  goal: GoalWithUpdates;
  expanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onLogProgress: () => void;
  onToggleComplete: () => void;
};

export function GoalCard({
  goal,
  expanded,
  onToggleExpand,
  onEdit,
  onLogProgress,
  onToggleComplete,
}: GoalCardProps) {
  const deadlineLabel = formatDeadline(goal.deadline);
  const completed = goal.status === "completed";

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-card shadow-sm transition-colors",
        completed && "opacity-80",
      )}
    >
      <button
        type="button"
        onClick={onToggleExpand}
        aria-expanded={expanded}
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="min-w-0 flex-1 space-y-1.5">
          <span className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "text-[15px] font-medium tracking-tight",
                completed &&
                  "text-muted-foreground line-through decoration-muted-foreground/50",
              )}
            >
              {goal.title}
            </span>
            <Badge variant="secondary" className="text-[10px]">
              {GOAL_CATEGORY_LABELS[goal.category]}
            </Badge>
            {completed ? (
              <Badge variant="outline" className="text-[10px]">
                Done
              </Badge>
            ) : null}
          </span>
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {deadlineLabel ? <span>Due {deadlineLabel}</span> : <span>No deadline</span>}
            <span>
              {goal.updates.length} update{goal.updates.length === 1 ? "" : "s"}
            </span>
            {goal.thisWeekUpdate ? (
              <span className="text-primary">Reviewed this week</span>
            ) : null}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "mt-1 size-4 shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {expanded ? (
        <div className="space-y-4 border-t border-border/70 px-4 py-3.5">
          {goal.description ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {goal.description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground/80 italic">
              No description
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              className="rounded-xl"
              onClick={onLogProgress}
              disabled={completed}
            >
              <PenLine className="size-3.5" aria-hidden />
              Log progress
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-xl"
              onClick={onEdit}
            >
              <Pencil className="size-3.5" aria-hidden />
              Edit
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-xl"
              onClick={onToggleComplete}
            >
              <Check className="size-3.5" aria-hidden />
              {completed ? "Reopen" : "Complete"}
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Weekly reflections
            </p>
            {goal.updates.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/80 px-3 py-4 text-center text-sm text-muted-foreground">
                No weekly notes yet. Log your first Sunday review.
              </p>
            ) : (
              <ul className="space-y-2">
                {goal.updates.map((update) => (
                  <li
                    key={update.id}
                    className="rounded-xl bg-muted/50 px-3 py-2.5"
                  >
                    <p className="text-[11px] font-medium text-muted-foreground">
                      Week of {formatWeekLabel(update.date)}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">
                      {update.note}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
