# Notes

Text notes and checklists with folders, colors, and soft delete.

## Entry points

- UI: `NotesView` (re-exported from `@/features/notes`)
- Data: `features/notes/data/*` — Dexie repos, helpers, `useNotesData`

## Storage

**Local (primary):** Dexie via `lib/local-db` (`lifekit-${uid}`).

**Cloud (replica):** Firestore under `users/{uid}/` — synced by the shared outbox worker (not Dexie Cloud).

| Collection | Purpose |
|------------|---------|
| `notes` | Note documents (`deletedAt` for soft delete) |
| `noteFolders` | Folder metadata |

## Boundaries

Do **not** import `@/features/budget` (or anything under it). Share UI only through `components/ui` and cross-cutting `lib/*` (Firebase auth, local-db, format).
