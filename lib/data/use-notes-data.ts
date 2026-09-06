"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import {
  addNoteFolder,
  deleteNoteFolder,
  getNoteFolders,
  updateNoteFolder,
} from "@/lib/data/note-folders";
import {
  addNote as addNoteDoc,
  clearNotesFolder,
  getNotes,
  softDeleteNote,
  updateNote as updateNoteDoc,
} from "@/lib/data/notes-repo";
import { createChecklistItem } from "@/lib/data/notes";
import type { Note, NoteFolder, NoteType } from "@/lib/data/types";

const DEBOUNCE_MS = 400;

type NotePatch = Partial<Omit<Note, "id" | "createdAt" | "deletedAt">>;

export function useNotesData() {
  const { user } = useAuth();
  const uid = user?.uid;

  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const pendingPatches = useRef<Map<string, NotePatch>>(new Map());
  const uidRef = useRef(uid);
  uidRef.current = uid;

  const flushNoteWrite = useCallback(async (id: string) => {
    const currentUid = uidRef.current;
    const patch = pendingPatches.current.get(id);
    if (!currentUid || !patch) return;

    pendingPatches.current.delete(id);
    const timer = debounceTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      debounceTimers.current.delete(id);
    }

    try {
      await updateNoteDoc(currentUid, id, patch);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save note.",
      );
    }
  }, []);

  const flushAllPending = useCallback(async () => {
    const ids = [...pendingPatches.current.keys()];
    await Promise.all(ids.map((id) => flushNoteWrite(id)));
  }, [flushNoteWrite]);

  useEffect(() => {
    return () => {
      for (const timer of debounceTimers.current.values()) {
        clearTimeout(timer);
      }
      debounceTimers.current.clear();
      // Best-effort flush on unmount (fire-and-forget)
      const currentUid = uidRef.current;
      if (!currentUid) return;
      for (const [id, patch] of pendingPatches.current.entries()) {
        void updateNoteDoc(currentUid, id, patch);
      }
      pendingPatches.current.clear();
    };
  }, []);

  const reload = useCallback(() => {
    setLoading(true);
    setReloadToken((t) => t + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      if (!uid) {
        await Promise.resolve();
        if (cancelled) return;
        setNotes([]);
        setFolders([]);
        setLoading(false);
        setError(null);
        return;
      }

      try {
        const [nextNotes, nextFolders] = await Promise.all([
          getNotes(uid),
          getNoteFolders(uid),
        ]);
        if (cancelled) return;
        setNotes(nextNotes);
        setFolders(nextFolders);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load notes.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchData();
    return () => {
      cancelled = true;
    };
  }, [uid, reloadToken]);

  const addNote = useCallback(
    async (
      type: NoteType,
      folderId: string | null = null,
    ): Promise<Note | null> => {
      if (!uid) return null;
      try {
        const note = await addNoteDoc(uid, {
          type,
          folderId,
          body: "",
          items: type === "checklist" ? [createChecklistItem()] : [],
          color: "default",
          pinned: false,
          title: null,
        });
        setNotes((prev) => [note, ...prev]);
        setError(null);
        return note;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create note.",
        );
        return null;
      }
    },
    [uid],
  );

  const updateNote = useCallback(
    (id: string, patch: NotePatch) => {
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

      const existing = pendingPatches.current.get(id) ?? {};
      pendingPatches.current.set(id, { ...existing, ...patch });

      const prevTimer = debounceTimers.current.get(id);
      if (prevTimer) clearTimeout(prevTimer);
      debounceTimers.current.set(
        id,
        setTimeout(() => {
          void flushNoteWrite(id);
        }, DEBOUNCE_MS),
      );
    },
    [flushNoteWrite],
  );

  const deleteNote = useCallback(
    async (id: string): Promise<boolean> => {
      if (!uid) return false;
      await flushNoteWrite(id);
      try {
        await softDeleteNote(uid, id);
        setNotes((prev) => prev.filter((note) => note.id !== id));
        setError(null);
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete note.",
        );
        return false;
      }
    },
    [uid, flushNoteWrite],
  );

  const addFolder = useCallback(
    async (name: string): Promise<NoteFolder | null> => {
      if (!uid) return null;
      const trimmed = name.trim();
      if (!trimmed) return null;
      try {
        const folder = await addNoteFolder(uid, { name: trimmed });
        setFolders((prev) =>
          [...prev, folder].sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
          ),
        );
        setError(null);
        return folder;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create folder.",
        );
        return null;
      }
    },
    [uid],
  );

  const updateFolder = useCallback(
    async (id: string, name: string): Promise<boolean> => {
      if (!uid) return false;
      const trimmed = name.trim();
      if (!trimmed) return false;
      try {
        await updateNoteFolder(uid, id, { name: trimmed });
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
        setError(null);
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to rename folder.",
        );
        return false;
      }
    },
    [uid],
  );

  const deleteFolder = useCallback(
    async (id: string): Promise<boolean> => {
      if (!uid) return false;
      const affected = notes
        .filter((note) => note.folderId === id)
        .map((note) => note.id);
      try {
        await deleteNoteFolder(uid, id);
        if (affected.length > 0) {
          await clearNotesFolder(uid, id, affected);
        }
        setFolders((prev) => prev.filter((folder) => folder.id !== id));
        setNotes((prev) =>
          prev.map((note) =>
            note.folderId === id
              ? { ...note, folderId: null, updatedAt: new Date() }
              : note,
          ),
        );
        setError(null);
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete folder.",
        );
        return false;
      }
    },
    [uid, notes],
  );

  return {
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
  };
}
