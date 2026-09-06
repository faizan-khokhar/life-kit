"use client";

import { FileText } from "lucide-react";
import { NoteCard } from "@/features/notes/components/note-card";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { Note } from "@/features/notes/data/types";

type NoteListProps = {
  notes: Note[];
  onOpen: (noteId: string) => void;
  onCreate: () => void;
};

export function NoteList({ notes, onOpen, onCreate }: NoteListProps) {
  if (notes.length === 0) {
    return (
      <Empty className="border border-dashed border-border/80 py-14">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileText />
          </EmptyMedia>
          <EmptyTitle>No notes here</EmptyTitle>
          <EmptyDescription>
            Create a text note or checklist â€” it only takes a tap.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button className="rounded-xl" onClick={onCreate}>
            New note
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {notes.map((note) => (
        <li key={note.id}>
          <NoteCard note={note} onOpen={onOpen} />
        </li>
      ))}
    </ul>
  );
}
