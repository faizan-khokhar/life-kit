"use client";

import { useEffect, useRef } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { createChecklistItem } from "@/features/notes/data/notes";
import type { ChecklistItem } from "@/features/notes/data/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "cn";

type ChecklistEditorProps = {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
  autoFocusFirst?: boolean;
};

export function ChecklistEditor({
  items,
  onChange,
  autoFocusFirst = false,
}: ChecklistEditorProps) {
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!autoFocusFirst) return;
    const timer = window.setTimeout(() => {
      firstInputRef.current?.focus();
    }, 50);
    return () => window.clearTimeout(timer);
  }, [autoFocusFirst]);

  function toggleDone(id: string) {
    onChange(
      items.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item,
      ),
    );
  }

  function updateText(id: string, text: string) {
    onChange(
      items.map((item) => (item.id === id ? { ...item, text } : item)),
    );
  }

  function removeItem(id: string) {
    onChange(items.filter((item) => item.id !== id));
  }

  function addItem() {
    onChange([...items, createChecklistItem()]);
  }

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-1.5">
        {items.map((item, index) => (
          <li key={item.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleDone(item.id)}
              aria-pressed={item.done}
              aria-label={item.done ? "Mark as not done" : "Mark as done"}
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl border transition-colors",
                item.done
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/80 bg-background/60 text-transparent hover:border-primary/50",
              )}
            >
              <Check className="size-5" aria-hidden />
            </button>
            <Input
              ref={index === 0 ? firstInputRef : undefined}
              value={item.text}
              onChange={(event) => updateText(item.id, event.target.value)}
              placeholder="List item"
              className={cn(
                "h-11 flex-1 rounded-xl border-0 bg-background/40 shadow-none focus-visible:ring-1",
                item.done && "text-muted-foreground line-through",
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-10 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => removeItem(item.id)}
              aria-label="Remove item"
            >
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant="secondary"
        className="mt-1 h-11 justify-start gap-2 rounded-xl"
        onClick={addItem}
      >
        <Plus className="size-4" aria-hidden />
        Add item
      </Button>
    </div>
  );
}
