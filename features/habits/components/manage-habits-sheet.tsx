"use client";

import { FormEvent, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { Habit } from "@/features/habits/data/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type ManageHabitsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habits: Habit[];
  onAdd: (name: string) => Promise<unknown>;
  onUpdate: (
    id: string,
    patch: { name?: string; active?: boolean },
  ) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
};

export function ManageHabitsSheet({
  open,
  onOpenChange,
  habits,
  onAdd,
  onUpdate,
  onDelete,
}: ManageHabitsSheetProps) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError("Enter a habit name.");
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      await onAdd(trimmed);
      setName("");
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(id: string) {
    const trimmed = editName.trim();
    if (!trimmed) {
      setFormError("Name can't be empty.");
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      await onUpdate(id, { name: trimmed });
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[88dvh] gap-0 overflow-hidden rounded-t-3xl p-0"
      >
        <SheetHeader className="border-b border-border/80 px-5 py-4 text-left">
          <SheetTitle>Manage habits</SheetTitle>
          <SheetDescription>
            Add, rename, pause, or delete habits. Check-ins stay on the main screen.
          </SheetDescription>
        </SheetHeader>

        <div className="flex max-h-[calc(88dvh-5.5rem)] flex-col gap-4 overflow-y-auto px-5 py-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          <form onSubmit={(e) => void handleAdd(e)} className="space-y-2">
            <Label htmlFor="new-habit">New habit</Label>
            <div className="flex gap-2">
              <Input
                id="new-habit"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Meditate 10 min"
                className="h-11 rounded-xl"
                maxLength={80}
                disabled={saving}
              />
              <Button
                type="submit"
                size="lg"
                className="h-11 shrink-0 rounded-xl px-4"
                disabled={saving}
                aria-label="Add habit"
              >
                <Plus className="size-5" />
              </Button>
            </div>
            {formError ? (
              <p className="text-xs text-destructive">{formError}</p>
            ) : null}
          </form>

          <ul className="space-y-2">
            {habits.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted-foreground">
                No habits yet. Add your first one above.
              </li>
            ) : (
              habits.map((habit) => {
                const editing = editingId === habit.id;
                return (
                  <li
                    key={habit.id}
                    className={cn(
                      "rounded-2xl border border-border/80 bg-card px-3.5 py-3 shadow-sm",
                      !habit.active && "opacity-70",
                    )}
                  >
                    {editing ? (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-10 rounded-xl"
                          maxLength={80}
                          autoFocus
                          disabled={saving}
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            className="rounded-xl"
                            disabled={saving}
                            onClick={() => void saveEdit(habit.id)}
                          >
                            Save
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="rounded-xl"
                            disabled={saving}
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {habit.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {habit.active ? "Active" : "Paused"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Switch
                            checked={habit.active}
                            onCheckedChange={(checked) => {
                              void onUpdate(habit.id, { active: checked });
                            }}
                            aria-label={
                              habit.active ? "Pause habit" : "Activate habit"
                            }
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="size-9 rounded-xl"
                            aria-label="Rename habit"
                            onClick={() => {
                              setEditingId(habit.id);
                              setEditName(habit.name);
                              setFormError(null);
                            }}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="size-9 rounded-xl text-destructive hover:text-destructive"
                            aria-label="Delete habit"
                            onClick={() => {
                              void onDelete(habit.id);
                            }}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  );
}
