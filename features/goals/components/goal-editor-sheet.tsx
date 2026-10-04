"use client";

import { FormEvent, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { toDateKey } from "@/features/goals/data/goals";
import type { Goal, GoalCategory, GoalInput } from "@/features/goals/data/types";
import {
  GOAL_CATEGORIES,
  GOAL_CATEGORY_LABELS,
} from "@/features/goals/data/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

type GoalEditorSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal | null;
  onSave: (input: GoalInput) => Promise<unknown>;
  onDelete?: (id: string) => Promise<unknown>;
};

export function GoalEditorSheet({
  open,
  onOpenChange,
  goal,
  onSave,
  onDelete,
}: GoalEditorSheetProps) {
  const editing = goal !== null;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<GoalCategory>("personal");
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (goal) {
      setTitle(goal.title);
      setDescription(goal.description);
      setCategory(goal.category);
      setDeadline(goal.deadline ? toDateKey(goal.deadline) : "");
    } else {
      setTitle("");
      setDescription("");
      setCategory("personal");
      setDeadline("");
    }
    setFormError(null);
  }, [open, goal]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setFormError("Enter a goal title.");
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      await onSave({
        title: trimmed,
        description,
        category,
        deadline: deadline
          ? new Date(
              Number(deadline.slice(0, 4)),
              Number(deadline.slice(5, 7)) - 1,
              Number(deadline.slice(8, 10)),
            )
          : null,
      });
      onOpenChange(false);
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
          <SheetTitle>{editing ? "Edit goal" : "New goal"}</SheetTitle>
          <SheetDescription>
            Set a clear target and optional deadline. Weekly reviews go on the
            main screen.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="flex max-h-[calc(92dvh-5.5rem)] flex-col gap-4 overflow-y-auto px-5 py-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
        >
          <div className="space-y-2">
            <Label htmlFor="goal-title">Title</Label>
            <Input
              id="goal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Run a half marathon"
              className="h-11 rounded-xl"
              maxLength={120}
              disabled={saving}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-description">Description</Label>
            <Textarea
              id="goal-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why this matters / how you'll get there"
              className="min-h-24 rounded-xl"
              maxLength={500}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={category}
                onValueChange={(value) => setCategory(value as GoalCategory)}
                disabled={saving}
              >
                <SelectTrigger className="h-11 w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_CATEGORIES.map((key) => (
                    <SelectItem key={key} value={key}>
                      {GOAL_CATEGORY_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal-deadline">Deadline</Label>
              <Input
                id="goal-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="h-11 rounded-xl"
                disabled={saving}
              />
            </div>
          </div>

          {formError ? (
            <p className="text-xs text-destructive">{formError}</p>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="submit"
              size="lg"
              className="h-11 flex-1 rounded-xl"
              disabled={saving}
            >
              {editing ? "Save changes" : "Create goal"}
            </Button>
            {editing && onDelete ? (
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="h-11 rounded-xl text-destructive hover:text-destructive"
                disabled={saving}
                onClick={() => {
                  void (async () => {
                    setSaving(true);
                    try {
                      await onDelete(goal.id);
                      onOpenChange(false);
                    } finally {
                      setSaving(false);
                    }
                  })();
                }}
              >
                <Trash2 className="size-4" aria-hidden />
                Delete
              </Button>
            ) : null}
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
