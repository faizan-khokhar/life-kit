"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDownUp, Plus } from "lucide-react";
import { FolderChips } from "@/components/notes/folder-chips";
import { NoteEditorSheet } from "@/components/notes/note-editor-sheet";
import { NoteList } from "@/components/notes/note-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { filterNotesByFolder, sortNotes } from "@/lib/data/notes";
import { useNotesData } from "@/lib/data/use-notes-data";
import type { NoteSort } from "@/lib/data/types";

const SORT_LABELS: Record<NoteSort, string> = {
  updated: "Updated",
  created: "Created",
  title: "Title",
  color: "Color",
};

export function NotesView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    notes,
    folders,
    addNote,
    updateNote,
    deleteNote,
    addFolder,
    updateFolder,
    deleteFolder,
  } = useNotesData();

  const [folderId, setFolderId] = useState<string | null>(null);
  const [sort, setSort] = useState<NoteSort>("updated");
  const [editingId, setEditingId] = useState<string | null>(null);
  const openedFromQuery = useRef(false);

  const visibleNotes = useMemo(() => {
    const filtered = filterNotesByFolder(notes, folderId);
    return sortNotes(filtered, sort);
  }, [notes, folderId, sort]);

  const editingNote =
    editingId === null
      ? null
      : (notes.find((note) => note.id === editingId) ?? null);

  function startNewNote() {
    const note = addNote("text", folderId);
    setEditingId(note.id);
  }

  useEffect(() => {
    if (searchParams.get("action") !== "new") return;
    if (openedFromQuery.current) return;
    openedFromQuery.current = true;
    const note = addNote("text", folderId);
    setEditingId(note.id);
    router.replace("/notes");
  }, [searchParams, addNote, folderId, router]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">Notes</h2>
          <p className="text-sm text-muted-foreground">
            Quick thoughts and checklists — tap a card to edit.
          </p>
        </div>
        <Badge variant="outline" className="shrink-0 font-normal">
          Demo data
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <FolderChips
            folders={folders}
            selectedFolderId={folderId}
            onSelect={setFolderId}
            onAddFolder={(name) => {
              addFolder(name);
            }}
            onRenameFolder={updateFolder}
            onDeleteFolder={deleteFolder}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 shrink-0 gap-1.5 rounded-full"
              aria-label={`Sort by ${SORT_LABELS[sort]}`}
            >
              <ArrowDownUp className="size-3.5" aria-hidden />
              {SORT_LABELS[sort]}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={sort}
              onValueChange={(value) => setSort(value as NoteSort)}
            >
              {(Object.keys(SORT_LABELS) as NoteSort[]).map((key) => (
                <DropdownMenuRadioItem key={key} value={key}>
                  {SORT_LABELS[key]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <NoteList
        notes={visibleNotes}
        onOpen={(id) => setEditingId(id)}
        onCreate={startNewNote}
      />

      <div className="fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 lg:right-8 lg:bottom-8">
        <Button
          type="button"
          size="lg"
          className="size-14 rounded-full shadow-lg"
          onClick={startNewNote}
          aria-label="New note"
        >
          <Plus className="size-6" />
        </Button>
      </div>

      <NoteEditorSheet
        open={editingId !== null && editingNote !== null}
        onOpenChange={(open) => {
          if (!open) setEditingId(null);
        }}
        note={editingNote}
        folders={folders}
        onUpdate={updateNote}
        onDelete={(id) => {
          deleteNote(id);
          setEditingId(null);
        }}
      />
    </div>
  );
}
