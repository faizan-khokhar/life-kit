# LifeKit — High-Level Design (HLD)

This document is the **planning spine** for LifeKit. Read it to understand product intent, architecture boundaries, and where new work should plug in. It is not a line-by-line implementation manual — open the code (especially [`lib/modules.ts`](lib/modules.ts)) for details.

---

## 1. Purpose and vision

**LifeKit** is a mobile-first personal utility app.

> **One app. Many useful things.**

The product will eventually hold small, useful tools in one place: finance helpers, personal organization, and everyday utilities. The first shipped version establishes **visual identity**, **navigation**, and a **scalable module architecture** — not full feature implementations.

Tone: personal, calm, simple, slightly playful, premium but not flashy. Not a corporate dashboard, banking site, or admin panel.

---

## 2. Goals and non-goals

### Goals (current phase)

- Ship a polished, phone-first UI shell that feels like a real app on Vercel
- Provide clear navigation between modules (sidebar + bottom nav)
- Give Budget a dedicated visual page as the first “real” module surface
- Keep every other module reachable via a reusable Coming Soon experience
- Make adding the next module cheap and consistent
- Introduce Firebase (Auth + Firestore) as the backend, accessed via a dedicated data layer, not ad hoc calls in components
- Support multiple users with per-account data isolation

### Non-goals (hard constraints for now)

- No separate backend service — Next.js Route Handlers (`app/api/**/route.ts`) in this app are the only API layer
- No second storage service (no Supabase / PostgreSQL / Prisma) — Firebase is the one backend

Theme preference in `localStorage` (`lifekit-theme`) is an **UI-only** exception, not app data.

---

## 3. Users and primary surfaces

| Audience | Primary device | Primary UI |
|----------|----------------|------------|
| Owner / personal use | Phone browser | Bottom navigation + full-bleed content |
| Same user on laptop | Desktop browser | Left sidebar + content |

Mobile is the **primary** design target. Desktop adapts the same app; it is not a separate product.

---

## 4. System context

LifeKit is a Next.js app that owns both the UI and its Firebase-backed server routes. Frontend pages and Route Handlers live in the same codebase; Firebase Auth and Cloud Firestore are the external backend services.

```mermaid
flowchart LR
  User[User on phone or desktop]
  Browser[Browser]
  NextApp[Next.js App Router UI]
  DataLayer["features/*/data repository layer"]
  RouteHandlers["app/api Route Handlers"]
  FirebaseAuth[Firebase Auth]
  Firestore[Cloud Firestore]
  Mock["Static mock data (transitional)"]
  ThemeStore[Theme preference localStorage]

  User --> Browser
  Browser --> NextApp
  NextApp --> DataLayer
  NextApp --> Mock
  NextApp --> ThemeStore
  DataLayer --> FirebaseAuth
  DataLayer --> Firestore
  DataLayer --> RouteHandlers
  RouteHandlers --> Firestore
```

**Not in the system (yet):** a separate backend service, third-party analytics, queues / cron workers.

**Stack (for orientation):** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Lucide icons, Firebase (Auth, Cloud Firestore), Firebase Admin SDK for Route Handlers. Deploy target: Vercel.

---

## 5. Architecture overview

The app is organized around four ideas:

1. **App Shell** — chrome that wraps every page (sidebar, header, mobile nav)
2. **Module Registry** — single catalog of tools and quick actions
3. **Pages** — route-level screens (dashboard, budget shell, coming soon, settings, …)
4. **Mock / format layer** — demo numbers and display helpers, separate from chrome

```mermaid
flowchart TD
  RootLayout[RootLayout metadata theme fonts]
  Theme[ThemeProvider and ThemeScript]
  AppShell[AppShell]
  Sidebar[Sidebar desktop]
  MobileNav[MobileNavigation]
  Header[Header]
  Page[Route page]
  Registry["lib/modules.ts"]
  MockData["lib/mock-data.ts"]
  Format["lib/format.ts"]

  RootLayout --> Theme
  Theme --> AppShell
  AppShell --> Sidebar
  AppShell --> MobileNav
  AppShell --> Header
  AppShell --> Page
  Sidebar --> Registry
  MobileNav --> Registry
  Page --> Registry
  Page --> MockData
  Page --> Format
```

**Planning rule:** new product features should almost always land as **page content** (and later a small data layer). They should rarely invent a second navigation system or a second design language.

---

## 6. Module map and lifecycle

### Lifecycle states

Use these when planning work. They describe maturity, not just “done / not done.”

| State | Meaning |
|-------|---------|
| `coming-soon` | Route exists; reusable Coming Soon UI only |
| `ui-shell` | Real page structure + static/demo data; no real logic |
| `client-logic` | Interactive behavior in the browser; still no durable storage (or ephemeral only) |
| `persisted` | Durable storage via the data layer (Firestore, or local when intentionally chosen) |
| `synced` | Optional cloud sync (future; definition needs revisit now that persistence is cloud-backed — see §13) |

### Module catalog (shipped codebase)

| Module | Category | Route | Lifecycle |
|--------|----------|-------|-----------|
| Home (dashboard) | Shell | `/` | `ui-shell` (mock overview) |
| Budget | Finance | `/budget` | `persisted` (calendar month + quick spend) |
| Expenses | Finance | `/expenses` | `coming-soon` |
| Bills | Finance | `/bills` | `coming-soon` |
| Savings | Finance | `/savings` | `coming-soon` |
| Tasks | Personal | `/tasks` | `coming-soon` |
| Goals | Personal | `/goals` | `coming-soon` |
| Planner | Personal | `/planner` | `coming-soon` |
| Notes | Personal | `/notes` | `persisted` |
| Calculator | Tools | `/calculator` | `coming-soon` |
| Converter | Tools | `/converter` | `coming-soon` |
| More | Shell | `/more` | Done (catalog UI) |
| Activity | Shell | `/activity` | `ui-shell` (mock feed) |
| Settings | Shell | `/settings` | Partial (theme + about real; other rows placeholder) |

Live registry (icons, descriptions, hrefs, `available` | `coming-soon`): [`lib/modules.ts`](lib/modules.ts).

> **Note:** The `synced` lifecycle state originally meant “optional cloud sync after local-first.” With Firestore as the persistence layer, that meaning is under review (see §13) — do not silently redefine it in PRs.

---

## 7. Navigation model

**Single source of truth:** [`lib/modules.ts`](lib/modules.ts).

Sidebar, More grid, featured dashboard modules, Coming Soon pages, and quick actions should all derive from that registry (or thin helpers on top of it). Do **not** hard-code a parallel module list in the shell.

| Surface | Breakpoint | Contents |
|---------|------------|----------|
| Left sidebar | `lg` and up | LifeKit, Home, primary modules, Tools, Settings, theme toggle |
| Bottom nav | below `lg` | Home · Budget · **+** · Activity · More |
| Header | all | Brand on home; page title elsewhere; desktop **New** quick-add |
| Quick actions | + / New | Add Expense, Add Income, Add Task, Add Note → module routes |

Mobile content must keep bottom padding so the fixed nav never covers the page. Safe areas use `viewportFit: cover` and `env(safe-area-inset-bottom)`.

---

## 8. Design system principles

Rules for planners and implementers (tokens live in [`app/globals.css`](app/globals.css)):

- **One accent** — muted teal for the whole app; module identity comes from icons, not rainbow colors
- **Calm personal UI** — whitespace, rounded cards, subtle borders/shadows, strong type hierarchy
- **Money semantics** — positive/negative colors only for amounts, always with `+` / `-`
- **Touch-friendly** — large targets on primary nav; readable type on small screens
- **Light-first** — class-based dark mode supported; light is the primary default experience
- **No dashboard clutter** — avoid enterprise chart walls and noisy promo chrome

---

## 9. Data strategy

Firebase is the backend for product data. Frontend and Route Handlers share one Next.js app; all Firestore access goes through a dedicated repository layer.

| Concern | Approach |
|---------|----------|
| **Identity** | Firebase Auth — multi-user accounts with per-user data isolation |
| **Persistence** | Cloud Firestore — documents scoped to the authenticated user |
| **Repository layer** | [`features/<name>/data/*`](features) wraps every Firestore read/write; pages and feature components never import the Firebase SDK directly |
| **Client SDK** | Reads and user-scoped operations only, enforced by Firestore Security Rules |
| **Admin / sensitive writes** | Next.js Route Handlers (`app/api/**/route.ts`) using the Firebase Admin SDK (server-only credentials; never shipped to the browser) |
| **Transitional mocks** | Static mocks in [`lib/mock-data.ts`](lib/mock-data.ts) remain for modules not yet on Firestore; formatters stay in [`lib/format.ts`](lib/format.ts) |

**Currency display today:** amounts are shown as `Rs 250,000` using Western thousands grouping (`en-US` + `Rs` prefix) so UI matches product examples. Broader locale strategy is an open question (see §13).

---

## 10. Extension points

### Add a new module

1. Register it in [`lib/modules.ts`](lib/modules.ts) (category, href, icon, status)
2. Add `app/<route>/page.tsx` — either real UI or `<ComingSoon module={…} />`
3. For a real module, co-locate UI + data under `features/<id>/` (components, data, README); keep the page thin
4. Wire nav only via the registry (sidebar lists / More grid update from data)
5. Update this HLD’s module table and lifecycle

### Evolve Budget beyond `ui-shell`

1. Keep the existing page structure under `features/budget/components/*` as the visual frame
2. Introduce client state / forms (`client-logic`)
3. Persist via the `features/budget/data/*` repository layer against Firestore (`persisted`)
4. Escalate sensitive writes to Route Handlers + Admin SDK when needed

### Add Firebase-backed persistence to a module

1. Define the Firestore collection / document schema (user-scoped) and matching Security Rules
2. Add repository functions in `features/<module>/data/` (no SDK imports in feature UI or pages)
3. Wire the page through hooks that call those repository functions
4. Add loading, error, and empty states
5. If a write needs admin privileges, add a Route Handler under `app/api/**/route.ts` using the Admin SDK
6. Update this HLD’s §6 lifecycle table and §14 decision log

### Do not

- Fork a second navigation catalog
- Give each module a unique brand color
- Add scope beyond what is decided in this document
- Call the Firebase SDK directly from a component or page — go through `features/<name>/data/*`
- Import one feature from another (e.g. Notes must not import Budget) — share only via `components/ui` and `lib/*`
- Ship Admin SDK credentials to the client

---

## 11. Quality bar

Any planned change should still satisfy:

- Mobile-first layout; no horizontal scroll at ~320–430px
- Bottom nav never covers content; safe-area aware
- Typed routes remain valid (`typedRoutes` enabled)
- Semantic HTML, visible focus, icon-only controls labeled
- Coming Soon modules reuse the shared component
- Demo/static data clearly treated as demo where users might confuse it for live balances

---

## 12. Roadmap and planning guide

### Suggested epic order

1. **Budget `client-logic`** — real interactions on the existing shell; still may use in-memory or mock seed data
2. **Expenses flow** — replace Coming Soon; wire quick action “Add Expense” (`client-logic`)
3. **Firestore persistence** — `features/<name>/data/*` repository layer for Budget (and later finance / tasks / notes)
4. **Tasks / Notes** — lightweight tools behind the same per-feature data layer
5. **PWA install polish** — raster icons, optional service worker
6. **Optional export / collaboration** — only after auth + per-user isolation are solid (see §13)

### When planning Feature X, specify

| Field | Prompt |
|-------|--------|
| User story | Who does what, and why? |
| Routes / modules touched | Which registry entries and pages? |
| Lifecycle jump | From which state to which? |
| Shell / nav impact | Should be **none** unless adding a module |
| Persistence needed? | No / later / yes (describe API shape) |
| Acceptance criteria | Mobile + desktop; empty/error/demo states |

### Light definition of done (feature)

- Reachable from registry-driven nav
- Works on phone-width layout with nav clearance
- Matches design principles (one accent, calm UI)
- Status updated in this HLD
- No second backend; Firebase and this app’s Route Handlers only

---

## 13. Open questions

Decisions not finalized — do not invent silent answers in PRs:

- Long-term **currency / locale** model (PKR display vs full `en-PK` grouping vs multi-currency)
- Whether **offline / installability** is required for v1 of real Budget
- How **income** should be entered long-term (dedicated flow vs typed money entries as today)
- How **Activity** should aggregate once multiple modules write real events
- What the **`synced` lifecycle state** means now that persistence is already cloud-backed (**TODO: undecided**)
- **Offline behaviour** and reliance on Firestore’s local cache vs a deliberate offline strategy (**TODO: undecided**)
- Whether other users’ data is ever **shared / collaborative**, or always strictly private (**TODO: undecided**)

**Resolved here:**

- **Firestore collection shape** — `users/{uid}/{module}/{docId}` subcollections (see §14)
- **Firebase Auth providers** — email/password as the baseline; Google and others deferred
- **Budget month model** — calendar month; stable category limits; spend filtered by `occurredAt`; past months on Budget; Home = current month
- **Budget UX** — tap category → quick-spend sheet (remaining / presets / custom / Mark paid for fixed); Manage categories under `/budget/manage`; bottom + → Add Expense opens category picker on Budget

**Decided (see §14):** multi-user Firebase Auth accounts with per-user data isolation — the product is open to other people, not device-local indefinitely.

---

## 14. Decision log (ADR-lite)

| Decision | Why | Consequence |
|----------|-----|-------------|
| Frontend-only for foundation | Establish UI and nav before storage complexity | Superseded by Firebase for backend (below); foundation phase had no APIs/DB/auth |
| Module registry as SSoT | Keep sidebar, More, and Coming Soon aligned | New modules must register first |
| One teal accent | Cohesive personal product, not a rainbow toolkit | Icons carry module identity |
| Custom theme (not app-level next-themes) | Small surface; avoid flash with inline script | Theme key `lifekit-theme` only |
| Budget as `ui-shell` first | Visual language before calculations | Mock data; no real math yet |
| Coming Soon is one component | Avoid nine copy-pasted placeholders | Thin route files per module |
| `typedRoutes: true` | Catch broken hrefs at compile time | Registry hrefs must be real routes |
| shadcn primitives added early | Faster future module UI | Prefer existing `components/ui/*` |
| Firebase for backend | Needed real persistence + auth beyond local-first stage | Introduces external service dependency, requires API keys/env config, Firestore schema design |
| `features/<name>/data/*` wraps all Firestore access | Keep feature UI clean, allow future backend swap | New modules must go through their feature repository, not raw SDK calls |
| Feature folders under `features/` | Clear ownership for open-source contributors; no Budget↔Notes coupling | Co-locate components + data + README; ESLint blocks cross-feature imports |
| Multi-user Auth accounts | Product is open to other people; each user’s data is isolated | Requires Auth UI, Security Rules, and user-scoped repository APIs |
| `users/{uid}/…` subcollections | Simpler Security Rules and clear per-user isolation vs top-level + `userId` field | All module data lives under the user doc path; collections include `budget`, `expenses`, `notes`, `noteFolders` |
| Email/password Auth baseline | HLD left providers open; need a working sign-in path now | Google / other providers can be added later without changing the data model |
| Client-side route guard (`app/(app)` + `RequireAuth`) | Firebase Auth state is browser-local; avoid session-cookie complexity for v1 | Brief loading flash before redirect; Firestore Rules remain the real security boundary |
| Budget derived from `expenses` ledger | Two collections only: `budget` = category limits, `expenses` = income + expense movements | Summary, chart, and category spend are computed in `features/budget/data/budget.ts` helpers |
| Calendar month scoping | Spend resets each month without copying categories | Filter entries by `occurredAt`; prev/next month on Budget; Home uses current month |
| Quick-spend primary path | 2–3 taps to log spend on phone | Tap category (or + → pick category) → amount chip / remaining / Mark paid |
| `isFixed` on budget categories | Rent-style full monthly payments | Manage toggle; Mark paid writes expense = limit |
| Manage under Budget | Setup separate from day-to-day logging | `/budget/manage` for add/edit/delete/fixed; no admin mode |
| Home Financial overview live | Remove demo budget card | `useBudgetData` + this-month `deriveBudgetSummary` |
| Notes Firestore + soft delete | Durable notes with future trash | Collections `notes` + `noteFolders` under `users/{uid}`; notes use `deletedAt` (never hard-deleted); Trash UI deferred; folder delete is hard and clears `folderId` on active notes |

---

## 15. Appendix

### Run locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run lint
npx tsc --noEmit
```

### Firebase environment setup

Create a `.env.local` in the repo root (gitignored). Fill in values from the Firebase console; placeholders below are intentional.

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Server-only (Route Handlers / Admin SDK) — never prefix with NEXT_PUBLIC_
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Set the same variables in the Vercel project for deployed environments. Both `firebase` (client) and `firebase-admin` (server) are installed. Fill in `FIREBASE_ADMIN_CLIENT_EMAIL` and `FIREBASE_ADMIN_PRIVATE_KEY` from a Firebase service-account JSON before calling Admin SDK Route Handlers (e.g. `GET /api/budget`).

Deploy Security Rules with `firebase deploy --only firestore:rules` (see `firestore.rules` / `firebase.json`), or paste the rules in the Firebase console.

### Folder map (orientation)

```
app/                 routes, layout, globals.css, manifest, icon
app/api/             Route Handlers (Admin SDK / sensitive writes)
features/
  budget/            Budget UI + data + README (public exports via index.ts)
  notes/             Notes UI + data + README (public exports via index.ts)
components/
  layout/            AppShell, Sidebar, MobileNavigation, Header, PageContainer
  dashboard/         home sections (may compose features)
  modules/           ModuleCard, ModuleGrid, ComingSoon
  quick-action/      + / New menu
  theme/             theme provider, script, toggle
  ui/                shadcn primitives (shared)
lib/
  modules.ts         live module + quick-action registry
  mock-data.ts       static demo data (transitional; still used by Home / Activity)
  format.ts          display helpers
  firebase/          client + admin SDK init, auth context
```

### Related docs

- [`AGENTS.md`](AGENTS.md) — Next.js version-matched agent notes for this repo
- [`features/budget/README.md`](features/budget/README.md) — Budget feature boundary
- [`features/notes/README.md`](features/notes/README.md) — Notes feature boundary
- Token source of truth: [`app/globals.css`](app/globals.css)

---

*Document type: High-Level Design. Update module lifecycles and open questions as the product evolves; keep implementation detail in code.*
