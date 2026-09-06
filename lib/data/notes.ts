import type {
  ChecklistItem,
  Note,
  NoteColor,
  NoteFolder,
  NoteSort,
  NoteType,
} from "@/lib/data/types";

export const NOTE_COLORS: NoteColor[] = [
  "default",
  "yellow",
  "mint",
  "rose",
  "sky",
  "lavender",
];

const COLOR_SORT_ORDER: Record<NoteColor, number> = {
  default: 0,
  yellow: 1,
  mint: 2,
  rose: 3,
  sky: 4,
  lavender: 5,
};

/** Works on localhost and non-secure LAN IPs (randomUUID needs a secure context). */
function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Tailwind classes for note card / editor surfaces. */
export function noteColorClass(color: NoteColor): string {
  switch (color) {
    case "yellow":
      return "bg-note-yellow text-foreground";
    case "mint":
      return "bg-note-mint text-foreground";
    case "rose":
      return "bg-note-rose text-foreground";
    case "sky":
      return "bg-note-sky text-foreground";
    case "lavender":
      return "bg-note-lavender text-foreground";
    default:
      return "bg-note-default text-foreground";
  }
}

export function noteSwatchClass(color: NoteColor): string {
  switch (color) {
    case "yellow":
      return "bg-note-yellow";
    case "mint":
      return "bg-note-mint";
    case "rose":
      return "bg-note-rose";
    case "sky":
      return "bg-note-sky";
    case "lavender":
      return "bg-note-lavender";
    default:
      return "bg-note-default";
  }
}

function firstWords(text: string, count = 6): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const slice = words.slice(0, count).join(" ");
  return words.length > count ? `${slice}…` : slice;
}

/** Display title: explicit title, else first words of body / first checklist item. */
export function deriveNoteTitle(note: Pick<Note, "title" | "type" | "body" | "items">): string {
  const explicit = note.title?.trim();
  if (explicit) return explicit;

  if (note.type === "checklist") {
    const first = note.items.find((item) => item.text.trim());
    if (first) return firstWords(first.text);
    return "Untitled checklist";
  }

  const fromBody = firstWords(note.body);
  return fromBody || "Untitled note";
}

export function noteSnippet(note: Note): string {
  if (note.type === "checklist") {
    const total = note.items.length;
    const done = note.items.filter((item) => item.done).length;
    if (total === 0) return "Empty checklist";
    return `${done}/${total} done`;
  }
  const line = note.body.trim().split(/\n/)[0] ?? "";
  if (!line) return "Empty note";
  return line.length > 80 ? `${line.slice(0, 80)}…` : line;
}

export function filterNotesByFolder(
  notes: Note[],
  folderId: string | null,
): Note[] {
  if (folderId === null) return notes;
  return notes.filter((note) => note.folderId === folderId);
}

export function sortNotes(notes: Note[], sort: NoteSort): Note[] {
  const copy = [...notes];
  copy.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;

    switch (sort) {
      case "created":
        return b.createdAt.getTime() - a.createdAt.getTime();
      case "title":
        return deriveNoteTitle(a).localeCompare(deriveNoteTitle(b), undefined, {
          sensitivity: "base",
        });
      case "color": {
        const colorDiff =
          COLOR_SORT_ORDER[a.color] - COLOR_SORT_ORDER[b.color];
        if (colorDiff !== 0) return colorDiff;
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      }
      case "updated":
      default:
        return b.updatedAt.getTime() - a.updatedAt.getTime();
    }
  });
  return copy;
}

export function createChecklistItem(text = ""): ChecklistItem {
  return {
    id: createId(),
    text,
    done: false,
  };
}

export function createEmptyNote(type: NoteType, folderId: string | null = null): Note {
  const now = new Date();
  return {
    id: createId(),
    title: null,
    type,
    body: "",
    items: type === "checklist" ? [createChecklistItem()] : [],
    color: "default",
    folderId,
    pinned: false,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function createEmptyFolder(name: string): NoteFolder {
  const now = new Date();
  return {
    id: createId(),
    name: name.trim(),
    createdAt: now,
    updatedAt: now,
  };
}

export function getSeedFolders(): NoteFolder[] {
  const now = new Date();
  const earlier = new Date(now.getTime() - 86_400_000);
  return [
    {
      id: "folder-ideas",
      name: "Ideas",
      createdAt: earlier,
      updatedAt: earlier,
    },
    {
      id: "folder-errands",
      name: "Errands",
      createdAt: earlier,
      updatedAt: earlier,
    },
  ];
}

export function getSeedNotes(): Note[] {
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 3_600_000);
  const yesterday = new Date(now.getTime() - 86_400_000);

  return [
    {
      id: "note-welcome",
      title: "Welcome to Notes",
      type: "text",
      body: "Tap + to create a text note or checklist. Color, pin, and file notes into folders — all right here.",
      items: [],
      color: "mint",
      folderId: "folder-ideas",
      pinned: true,
      deletedAt: null,
      createdAt: yesterday,
      updatedAt: hourAgo,
    },
    {
      id: "note-groceries",
      title: "Groceries",
      type: "checklist",
      body: "",
      items: [
        { id: "item-1", text: "Milk", done: true },
        { id: "item-2", text: "Bread", done: false },
        { id: "item-3", text: "Eggs", done: false },
        { id: "item-4", text: "Tomatoes", done: false },
      ],
      color: "yellow",
      folderId: "folder-errands",
      pinned: false,
      deletedAt: null,
      createdAt: yesterday,
      updatedAt: now,
    },
    {
      id: "note-weekend",
      title: null,
      type: "text",
      body: "Call mom this weekend and ask about the family dinner plans.",
      items: [],
      color: "sky",
      folderId: null,
      pinned: false,
      deletedAt: null,
      createdAt: hourAgo,
      updatedAt: hourAgo,
    },
  ];
}
