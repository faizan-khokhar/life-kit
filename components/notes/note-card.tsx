"use client";

import { CheckSquare, Pin } from "lucide-react";
import { noteColorClass, deriveNoteTitle, noteSnippet } from "@/lib/data/notes";
import type { Note } from "@/lib/data/types";
import { cn } from "cn";

type NoteCardProps = {
  note: Note;
  onOpen: (noteId: string) => void;
};

export function NoteCard({ note, onOpen }: NoteCardProps) {
  const title = deriveNoteTitle(note);
  const snippet = noteSnippet(note);

  return (
    <button
      type="button"
      onClick={() => onOpen(note.id)}
      className={cn(
        "flex w-full flex-col gap-2 rounded-2xl border border-border/60 p-4 text-left shadow-sm transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        noteColorClass(note.color),
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-base font-semibold leading-snug tracking-tight">
          {title}
        </p>
        <span className="flex shrink-0 items-center gap-1 text-muted-foreground">
          {note.type === "checklist" ? (
            <CheckSquare className="size-4" aria-hidden />
          ) : null}
          {note.pinned ? (
            <Pin className="size-4 fill-current text-foreground/70" aria-label="Pinned" />
          ) : null}
        </span>
      </div>
      <p className="line-clamp-2 text-sm leading-relaxed text-foreground/70">
        {snippet}
      </p>
    </button>
  );
}
