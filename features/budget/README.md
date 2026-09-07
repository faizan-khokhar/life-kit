# Budget

Track income, spending, and what’s left this month.

## Entry points

- UI: `BudgetView`, `ManageCategories` (also re-exported from `@/features/budget`)
- Data: `features/budget/data/*` — Dexie repos, month helpers, `useBudgetData`

## Storage

**Local (primary):** Dexie via `lib/local-db` (`lifekit-${uid}`).

**Cloud (replica):** Firestore under `users/{uid}/` — synced by the shared outbox worker (not Dexie Cloud).

| Collection | Purpose |
|------------|---------|
| `budget` | Category limits (`isFixed`, monthly `limit`) |
| `expenses` | Income + expense ledger entries |

## Boundaries

Do **not** import `@/features/notes` (or anything under it). Share UI only through `components/ui` and cross-cutting `lib/*` (Firebase auth, local-db, format).

Shell surfaces (e.g. dashboard financial overview) may import this feature’s public API.
