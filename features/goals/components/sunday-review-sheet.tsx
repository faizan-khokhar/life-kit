"use client";

import { useEffect, useRef, useState } from "react";
import { formatWeekLabel } from "@/features/goals/data/goals";
import type { GoalWithUpdates } from "@/features/goals/data/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

type SundayReviewSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weekKey: string;
  goals: GoalWithUpdates[];
  /** When set, focus a single goal; otherwise review all active goals. */
  focusGoalId?: string | null;
  onSave: (goalId: string, note: string) => Promise<unknown>;
};

export function SundayReviewSheet({
  open,
  onOpenChange,
  weekKey,
  goals,
  focusGoalId = null,
  onSave,
}: SundayReviewSheetProps) {
  const targets = focusGoalId
    ? goals.filter((g) => g.id === focusGoalId)
    : goals.filter((g) => g.status === "active");

  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open && !wasOpen.current) {
      const next: Record<string, string> = {};
      const list = focusGoalId
        ? goals.filter((g) => g.id === focusGoalId)
        : goals.filter((g) => g.status === "active");
      for (const goal of list) {
        next[goal.id] = goal.thisWeekUpdate?.note ?? "";
      }
      setNotes(next);
      setError(null);
    }
    wasOpen.current = open;
  }, [open, focusGoalId, goals]);

  async function saveAll() {
    const entries = targets
      .map((goal) => ({
        goalId: goal.id,
        note: (notes[goal.id] ?? "").trim(),
      }))
      .filter((entry) => entry.note.length > 0);

    if (entries.length === 0) {
      setError("Write at least one progress note.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      for (const entry of entries) {
        await onSave(entry.goalId, entry.note);
      }
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save review.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92dvh] gap-0 overflow-hidden rounded-t-3xl p-0"
      >
        <SheetHeader className="border-b border-border/80 px-5 py-4 text-left">
          <SheetTitle>
            {focusGoalId ? "Log progress" : "Sunday review"}
          </SheetTitle>
          <SheetDescription>
            Week of {formatWeekLabel(weekKey)}. What did you do toward each
            goal?
          </SheetDescription>
        </SheetHeader>

        <div className="flex max-h-[calc(92dvh-5.5rem)] flex-col gap-4 overflow-y-auto px-5 py-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          {targets.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted-foreground">
              No active goals to review. Create a goal first.
            </p>
          ) : (
            targets.map((goal) => (
              <div key={goal.id} className="space-y-2">
                <Label htmlFor={`review-${goal.id}`}>{goal.title}</Label>
                <Textarea
                  id={`review-${goal.id}`}
                  value={notes[goal.id] ?? ""}
                  onChange={(e) =>
                    setNotes((prev) => ({
                      ...prev,
                      [goal.id]: e.target.value,
                    }))
                  }
                  placeholder="What moved this week?"
                  className="min-h-24 rounded-xl"
                  maxLength={800}
                  disabled={saving}
                />
              </div>
            ))
          )}

          {error ? (
            <p className="text-xs text-destructive">{error}</p>
          ) : null}

          {targets.length > 0 ? (
            <Button
              type="button"
              size="lg"
              className="h-11 rounded-xl"
              disabled={saving}
              onClick={() => void saveAll()}
            >
              {saving ? "Saving…" : "Save review"}
            </Button>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
