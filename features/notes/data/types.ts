/** Document shapes for Notes Firestore repositories. No Firebase imports here. */

export type NoteColor =
  | "default"
  | "yellow"
  | "mint"
  | "rose"
  | "sky"
  | "lavender";

export type NoteType = "text" | "checklist";

export type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

export type NoteFolder = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Note = {
  id: string;
  title: string | null;
  type: NoteType;
  body: string;
  items: ChecklistItem[];
  color: NoteColor;
  folderId: string | null;
  pinned: boolean;
  /** Soft delete: null = active; set when moved to trash. */
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type NoteSort = "updated" | "created" | "title" | "color";

export type NoteInput = {
  title?: string | null;
  type: NoteType;
  body?: string;
  items?: ChecklistItem[];
  color?: NoteColor;
  folderId?: string | null;
  pinned?: boolean;
};

export type NoteFolderInput = {
  name: string;
};
