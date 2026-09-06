# Notes

Text notes and checklists with folders, colors, and soft delete.

## Entry points

- UI: `NotesView` (re-exported from `@/features/notes`)
- Data: `features/notes/data/*` — Firestore repos, helpers, `useNotesData`

## Firestore (under `users/{uid}/`)

| Collection | Purpose |
|------------|---------|
| `notes` | Note documents (`deletedAt` for soft delete) |
| `noteFolders` | Folder metadata |

## Boundaries

Do **not** import `@/features/budget` (or anything under it). Share UI only through `components/ui` and cross-cutting `lib/*` (Firebase, format).
