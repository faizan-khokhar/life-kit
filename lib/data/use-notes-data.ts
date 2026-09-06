"use client";

import { useCallback, useState } from "react";
import {
  createEmptyFolder,
  createEmptyNote,
  getSeedFolders,
  getSeedNotes,
} from "@/lib/data/notes";
import type {
  Note,
  NoteFolder,
  NoteType,
} from "@/lib/data/types";

export function useNotesData() {
  const [notes, setNotes] = useState<Note[]>(() => getSeedNotes());
  const [folders, setFolders] = useState<NoteFolder[]>(() => getSeedFolders());

  const addNote = useCallback(
    (type: NoteType, folderId: string | null = null): Note => {
      const note = createEmptyNote(type, folderId);
      setNotes((prev) => [note, ...prev]);
      return note;
    },
    [],
  );

  const updateNote = useCallback(
    (id: string, patch: Partial<Omit<Note, "id" | "createdAt">>) => {
      setNotes((prev) =>
        prev.map((note) => {
          if (note.id !== id) return note;
          const nextTitle =
            patch.title !== undefined
              ? patch.title?.trim()
                ? patch.title.trim()
                : null
              : note.title;
          return {
            ...note,
            ...patch,
            title: nextTitle,
            updatedAt: new Date(),
          };
        }),
      );
    },
    [],
  );

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  }, []);

  const addFolder = useCallback((name: string): NoteFolder | null => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const folder = createEmptyFolder(trimmed);
    setFolders((prev) =>
      [...prev, folder].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      ),
    );
    return folder;
  }, []);

  const updateFolder = useCallback((id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setFolders((prev) =>
      prev
        .map((folder) =>
          folder.id === id
            ? { ...folder, name: trimmed, updatedAt: new Date() }
            : folder,
        )
        .sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
        ),
    );
  }, []);

  const deleteFolder = useCallback((id: string) => {
    setFolders((prev) => prev.filter((folder) => folder.id !== id));
    setNotes((prev) =>
      prev.map((note) =>
        note.folderId === id
          ? { ...note, folderId: null, updatedAt: new Date() }
          : note,
      ),
    );
  }, []);

  return {
    notes,
    folders,
    addNote,
    updateNote,
    deleteNote,
    addFolder,
    updateFolder,
    deleteFolder,
  };
}
