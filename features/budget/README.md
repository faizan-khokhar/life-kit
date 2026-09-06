# Budget

Track income, spending, and what’s left this month.

## Entry points

- UI: `BudgetView`, `ManageCategories` (also re-exported from `@/features/budget`)
- Data: `features/budget/data/*` — Firestore repos, month helpers, `useBudgetData`

## Firestore (under `users/{uid}/`)

| Collection | Purpose |
|------------|---------|
| `budget` | Category limits (`isFixed`, monthly `limit`) |
| `expenses` | Income + expense ledger entries |

## Boundaries

Do **not** import `@/features/notes` (or anything under it). Share UI only through `components/ui` and cross-cutting `lib/*` (Firebase, format).

Shell surfaces (e.g. dashboard financial overview) may import this feature’s public API.
