"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDownUp, Plus } from "lucide-react";
import { FolderChips } from "@/features/notes/components/folder-chips";
import { NoteEditorSheet } from "@/features/notes/components/note-editor-sheet";
import { NoteList } from "@/features/notes/components/note-list";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Skeleton } from "@/components/ui/skeleton";
import { filterNotesByFolder, sortNotes } from "@/features/notes/data/notes";
import { useNotesData } from "@/features/notes/data/use-notes-data";
import type { NoteSort } from "@/features/notes/data/types";

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
    uid,
    notes,
    folders,
    loading,
    error,
    reload,
    addNote,
    updateNote,
    deleteNote,
    addFolder,
    updateFolder,
    deleteFolder,
    flushAllPending,
  } = useNotesData();

  const [folderId, setFolderId] = useState<string | null>(null);
  const [sort, setSort] = useState<NoteSort>("updated");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const openedFromQuery = useRef(false);

  const visibleNotes = useMemo(() => {
    const filtered = filterNotesByFolder(notes, folderId);
    return sortNotes(filtered, sort);
  }, [notes, folderId, sort]);

  const editingNote =
    editingId === null
      ? null
      : (notes.find((note) => note.id === editingId) ?? null);

  async function startNewNote() {
    if (!uid || creating) return;
    setCreating(true);
    try {
      const note = await addNote("text", folderId);
      if (note) setEditingId(note.id);
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    if (searchParams.get("action") !== "new") return;
    if (openedFromQuery.current) return;
    if (!uid || loading) return;
    openedFromQuery.current = true;
    void (async () => {
      const note = await addNote("text", folderId);
      if (note) setEditingId(note.id);
      router.replace("/notes");
    })();
  }, [searchParams, addNote, folderId, router, uid, loading]);

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-full" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error && notes.length === 0 && folders.length === 0) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => void reload()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">Notes</h2>
        <p className="text-sm text-muted-foreground">
          Quick thoughts and checklists â€” tap a card to edit.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => void reload()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <FolderChips
            folders={folders}
            selectedFolderId={folderId}
            onSelect={setFolderId}
            onAddFolder={(name) => {
              void addFolder(name);
            }}
            onRenameFolder={(id, name) => {
              void updateFolder(id, name);
            }}
            onDeleteFolder={(id) => {
              void deleteFolder(id);
            }}
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
        onCreate={() => {
          void startNewNote();
        }}
      />

      <div className="fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 lg:right-8 lg:bottom-8">
        <Button
          type="button"
          size="lg"
          className="size-14 rounded-full shadow-lg"
          onClick={() => {
            void startNewNote();
          }}
          disabled={creating || !uid}
          aria-label="New note"
        >
          <Plus className="size-6" />
        </Button>
      </div>

      <NoteEditorSheet
        open={editingId !== null && editingNote !== null}
        onOpenChange={(open) => {
          if (!open) {
            void flushAllPending();
            setEditingId(null);
          }
        }}
        note={editingNote}
        folders={folders}
        onUpdate={updateNote}
        onDelete={(id) => {
          void (async () => {
            const ok = await deleteNote(id);
            if (ok) setEditingId(null);
          })();
        }}
      />
    </div>
  );
}
