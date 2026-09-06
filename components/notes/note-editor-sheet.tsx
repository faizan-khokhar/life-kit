"use client";

import { useEffect, useRef } from "react";
import {
  ArrowLeft,
  CheckSquare,
  FileText,
  MoreHorizontal,
  Pin,
  Trash2,
} from "lucide-react";
import { ChecklistEditor } from "@/components/notes/checklist-editor";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  NOTE_COLORS,
  createChecklistItem,
  deriveNoteTitle,
  noteColorClass,
  noteSwatchClass,
} from "@/lib/data/notes";
import type { ChecklistItem, Note, NoteFolder, NoteType } from "@/lib/data/types";
import { cn } from "cn";

type NoteEditorSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: Note | null;
  folders: NoteFolder[];
  onUpdate: (
    id: string,
    patch: Partial<Omit<Note, "id" | "createdAt" | "deletedAt">>,
  ) => void;
  onDelete: (id: string) => void;
};

export function NoteEditorSheet({
  open,
  onOpenChange,
  note,
  folders,
  onUpdate,
  onDelete,
}: NoteEditorSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className={cn(
          "inset-0 !h-dvh !max-h-dvh w-full gap-0 overflow-hidden rounded-none border-0 p-0",
          note ? noteColorClass(note.color) : "bg-background",
        )}
      >
        {note ? (
          <NoteEditorForm
            key={note.id}
            note={note}
            folders={folders}
            onClose={() => onOpenChange(false)}
            onUpdate={onUpdate}
            onDelete={(id) => {
              onDelete(id);
              onOpenChange(false);
            }}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function NoteEditorForm({
  note,
  folders,
  onClose,
  onUpdate,
  onDelete,
}: {
  note: Note;
  folders: NoteFolder[];
  onClose: () => void;
  onUpdate: (
    id: string,
    patch: Partial<Omit<Note, "id" | "createdAt" | "deletedAt">>,
  ) => void;
  onDelete: (id: string) => void;
}) {
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const titlePlaceholder = deriveNoteTitle({ ...note, title: null });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (note.type === "text") {
        bodyRef.current?.focus();
      }
    }, 50);
    return () => window.clearTimeout(timer);
  }, [note.id, note.type]);

  function patch(partial: Partial<Omit<Note, "id" | "createdAt">>) {
    onUpdate(note.id, partial);
  }

  function setType(next: NoteType) {
    if (next === note.type) return;
    if (next === "checklist") {
      const fromBody = note.body
        .split(/\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((text) => createChecklistItem(text));
      patch({
        type: "checklist",
        body: "",
        items: fromBody.length > 0 ? fromBody : [createChecklistItem()],
      });
      return;
    }
    const fromItems = note.items
      .map((item) => item.text.trim())
      .filter(Boolean)
      .join("\n");
    patch({
      type: "text",
      body: fromItems || note.body,
      items: [],
    });
  }

  return (
    <div className="flex h-full flex-col">
      <SheetTitle className="sr-only">Edit note</SheetTitle>
      <SheetDescription className="sr-only">
        Write your note. Title is optional.
      </SheetDescription>

      <header className="flex shrink-0 items-center gap-1 border-b border-border/40 px-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 shrink-0"
          onClick={onClose}
          aria-label="Back to notes"
        >
          <ArrowLeft className="size-5" />
        </Button>

        <div
          className="flex flex-1 justify-center"
          role="group"
          aria-label="Note type"
        >
          <div className="inline-flex rounded-full bg-background/50 p-1">
            <TypeChip
              active={note.type === "text"}
              onClick={() => setType("text")}
              icon={<FileText className="size-3.5" aria-hidden />}
              label="Text"
            />
            <TypeChip
              active={note.type === "checklist"}
              onClick={() => setType("checklist")}
              icon={<CheckSquare className="size-3.5" aria-hidden />}
              label="List"
            />
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("size-11 shrink-0", note.pinned && "text-foreground")}
          aria-pressed={note.pinned}
          aria-label={note.pinned ? "Unpin note" : "Pin note"}
          onClick={() => patch({ pinned: !note.pinned })}
        >
          <Pin
            className={cn("size-5", note.pinned && "fill-current")}
            aria-hidden
          />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 shrink-0"
              aria-label="More options"
            >
              <MoreHorizontal className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Color</DropdownMenuLabel>
            <div className="flex flex-wrap gap-2 px-2 py-1.5">
              {NOTE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Color ${color}`}
                  aria-pressed={note.color === color}
                  onClick={() => patch({ color })}
                  className={cn(
                    "size-8 rounded-full border-2",
                    noteSwatchClass(color),
                    note.color === color
                      ? "border-foreground"
                      : "border-transparent",
                  )}
                />
              ))}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Folder</DropdownMenuLabel>
            <div className="px-2 py-1.5">
              <Select
                value={note.folderId ?? "none"}
                onValueChange={(value) => {
                  const next = value ?? "none";
                  patch({ folderId: next === "none" ? null : next });
                }}
              >
                <SelectTrigger className="h-9 rounded-lg">
                  <SelectValue placeholder="All notes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All notes</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                if (window.confirm("Move this note to trash?")) {
                  onDelete(note.id);
                }
              }}
            >
              <Trash2 className="size-4" />
              Move to trash
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <Input
          value={note.title ?? ""}
          onChange={(event) => patch({ title: event.target.value || null })}
          placeholder={titlePlaceholder === "Untitled note" || titlePlaceholder === "Untitled checklist" ? "Title" : titlePlaceholder}
          className="mb-1 h-10 border-0 bg-transparent px-0 text-xl font-semibold shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0"
          aria-label="Note title"
        />

        {note.type === "checklist" ? (
          <ChecklistEditor
            items={note.items}
            onChange={(items: ChecklistItem[]) => patch({ items })}
            autoFocusFirst
          />
        ) : (
          <Textarea
            ref={bodyRef}
            value={note.body}
            onChange={(event) => patch({ body: event.target.value })}
            placeholder="Start writing…"
            className="min-h-[50vh] flex-1 resize-none rounded-none border-0 bg-transparent px-0 py-2 text-base leading-relaxed shadow-none focus-visible:ring-0"
            aria-label="Note body"
          />
        )}
      </div>
    </div>
  );
}

function TypeChip({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
