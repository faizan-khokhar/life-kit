"use client";

import { useState } from "react";
import { FolderPlus, Pencil, Settings2, Trash2 } from "lucide-react";
import type { NoteFolder } from "@/lib/data/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "cn";

type FolderChipsProps = {
  folders: NoteFolder[];
  selectedFolderId: string | null;
  onSelect: (folderId: string | null) => void;
  onAddFolder: (name: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
};

export function FolderChips({
  folders,
  selectedFolderId,
  onSelect,
  onAddFolder,
  onRenameFolder,
  onDeleteFolder,
}: FolderChipsProps) {
  const [manageOpen, setManageOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  function submitNewFolder() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    onAddFolder(trimmed);
    setNewName("");
  }

  function startEdit(folder: NoteFolder) {
    setEditingId(folder.id);
    setEditName(folder.name);
  }

  function commitEdit() {
    if (!editingId) return;
    onRenameFolder(editingId, editName);
    setEditingId(null);
    setEditName("");
  }

  return (
    <>
      <div className="flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Chip
          active={selectedFolderId === null}
          onClick={() => onSelect(null)}
        >
          All
        </Chip>
        {folders.map((folder) => (
          <Chip
            key={folder.id}
            active={selectedFolderId === folder.id}
            onClick={() => onSelect(folder.id)}
          >
            {folder.name}
          </Chip>
        ))}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 shrink-0 gap-1.5 rounded-full px-3 text-muted-foreground"
          onClick={() => setManageOpen(true)}
        >
          <Settings2 className="size-3.5" aria-hidden />
          Folders
        </Button>
      </div>

      <Sheet open={manageOpen} onOpenChange={setManageOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85dvh] rounded-t-3xl pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
        >
          <SheetHeader className="text-left">
            <SheetTitle>Folders</SheetTitle>
            <SheetDescription>
              Group notes — delete moves notes back to All.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-4 px-4 pb-2">
            <div className="flex gap-2">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="new-folder">New folder</Label>
                <Input
                  id="new-folder"
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  placeholder="e.g. Work"
                  className="rounded-xl"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      submitNewFolder();
                    }
                  }}
                />
              </div>
              <Button
                type="button"
                className="mt-6 shrink-0 rounded-xl"
                onClick={submitNewFolder}
                disabled={!newName.trim()}
              >
                <FolderPlus className="size-4" aria-hidden />
                Add
              </Button>
            </div>

            {folders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No folders yet. Add one above.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {folders.map((folder) => (
                  <li
                    key={folder.id}
                    className="flex items-center gap-2 rounded-xl border border-border/70 bg-card px-3 py-2"
                  >
                    {editingId === folder.id ? (
                      <Input
                        value={editName}
                        onChange={(event) => setEditName(event.target.value)}
                        className="h-9 flex-1 rounded-lg"
                        autoFocus
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            commitEdit();
                          }
                          if (event.key === "Escape") {
                            setEditingId(null);
                          }
                        }}
                        onBlur={commitEdit}
                      />
                    ) : (
                      <span className="flex-1 truncate text-sm font-medium">
                        {folder.name}
                      </span>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Rename ${folder.name}`}
                      onClick={() =>
                        editingId === folder.id
                          ? commitEdit()
                          : startEdit(folder)
                      }
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Delete ${folder.name}`}
                      onClick={() => {
                        onDeleteFolder(folder.id);
                        if (selectedFolderId === folder.id) onSelect(null);
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 shrink-0 rounded-full px-3.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      )}
    >
      {children}
    </button>
  );
}
