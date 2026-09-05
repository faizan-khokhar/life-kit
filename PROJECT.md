# LifeKit — Project Documentation

## 1. Project overview

LifeKit is a **frontend-only**, mobile-first personal utility app.

Tagline: **One app. Many useful things.**

This repository currently ships a polished UI shell and navigation system. Most modules are placeholders. Budget has a dedicated visual page with static demo data. There is no backend, authentication, database, or API layer.

## 2. Product philosophy

- Personal, calm, and useful — not a corporate dashboard or banking site
- Mobile-first: designed for phone use, with a desktop sidebar adaptation
- One coherent accent color for the whole app; modules are distinguished by icons, not rainbow colors
- Ship navigation and visual language first; implement real tools gradually
- Prefer static mock data over premature persistence

## 3. Current feature / module list

| Module | Category | Route | Status |
|--------|----------|-------|--------|
| Home (dashboard) | — | `/` | DONE |
| Budget | Finance | `/budget` | DONE (visual placeholder) |
| Expenses | Finance | `/expenses` | COMING SOON |
| Bills | Finance | `/bills` | COMING SOON |
| Savings | Finance | `/savings` | COMING SOON |
| Tasks | Personal | `/tasks` | COMING SOON |
| Goals | Personal | `/goals` | COMING SOON |
| Planner | Personal | `/planner` | COMING SOON |
| Notes | Personal | `/notes` | COMING SOON |
| Calculator | Tools | `/calculator` | COMING SOON |
| Converter | Tools | `/converter` | COMING SOON |
| More (module grid) | — | `/more` | DONE |
| Activity | — | `/activity` | DONE (mock feed) |
| Settings | — | `/settings` | DONE (appearance + about) |

## 4. Current implementation status

### DONE

- App shell (sidebar + bottom navigation)
- Responsive navigation architecture
- Home dashboard with mock financial overview, quick actions, featured modules, recent activity
- Module registry and `/more` categorized grid
- Reusable `ComingSoon` component for unimplemented modules
- Budget route with static summary, CSS bar chart, categories, and recent expenses
- Settings (theme toggle + about)
- Activity page (full mock feed)
- Light / dark / system theme with class-based `.dark` and no-flash script
- Web app manifest + viewport / metadata for mobile-friendly deployment
- Typed routes (`typedRoutes: true`)
- `PROJECT.md` (this file)

### IN PROGRESS

- Nothing currently in progress beyond iterative polish

### COMING SOON

- Real budget calculations and expense entry
- Expense / bills / savings tracking
- Tasks, goals, planner, notes functionality
- Calculator and unit converter
- Persistent local data (when intentionally added later)
- PWA install experience with raster icons (192 / 512)
- Backup / export

### FUTURE

- Optional cloud synchronization
- Notifications and reminders
- Additional personal utilities
- Full offline support / service worker

## 5. Technology stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16.3 (App Router, Turbopack) |
| UI | React 19.2 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui (radix-nova style) |
| Icons | lucide-react |
| Lint | ESLint flat config (`eslint-config-next`) |

**Intentionally not used:** Supabase, Firebase, Prisma, PostgreSQL, auth providers, API routes for app data, IndexedDB / localStorage for budget data.

Theme preference is stored in `localStorage` under `lifekit-theme` (UI preference only).

## 6. Folder structure

```
app/
  layout.tsx              # Root layout, metadata, viewport, theme script
  page.tsx                # Home dashboard
  globals.css             # Design tokens + Tailwind
  manifest.ts             # PWA-lite web manifest
  icon.svg                # App icon
  not-found.tsx
  budget/page.tsx
  more/page.tsx
  activity/page.tsx
  settings/page.tsx
  tasks|goals|planner|notes|expenses|bills|savings|calculator|converter/page.tsx

components/
  layout/                 # AppShell, Sidebar, MobileNavigation, Header, PageContainer
  dashboard/              # Greeting, overview, quick actions, modules, activity
  modules/                # ModuleCard, ModuleGrid, ComingSoon
  budget/                 # Summary, chart, categories, expenses
  quick-action/           # QuickActionMenu (+ sheet / dropdown)
  theme/                  # ThemeProvider, ThemeScript, ThemeToggle
  ui/                     # shadcn primitives

lib/
  modules.ts              # Module + quick-action registry (single source of truth)
  mock-data.ts            # Static demo data
  format.ts               # formatPKR, greeting helpers
  utils.ts                # cn() re-export

public/icon.svg
PROJECT.md
```

## 7. Routing structure

| Route | Purpose |
|-------|---------|
| `/` | Dashboard |
| `/budget` | Budget visual placeholder |
| `/expenses`, `/bills`, `/savings` | Coming Soon |
| `/tasks`, `/goals`, `/planner`, `/notes` | Coming Soon |
| `/calculator`, `/converter` | Coming Soon |
| `/more` | Full module catalog |
| `/activity` | Mock activity feed |
| `/settings` | Appearance + about |
| `/manifest.webmanifest` | Generated from `app/manifest.ts` |

All routes are static (`○` in `next build` output).

## 8. Design system

- **Neutral base:** warm stone tones (`oklch` tokens in `app/globals.css`)
- **Accent:** single muted teal (`--primary`) for both light and dark
- **Semantic money colors:** `--positive` / `--negative`, always paired with `+` / `-` signs
- **Radius:** `--radius: 1rem` for soft mobile cards
- **Cards:** hairline borders + very subtle shadow
- **Typography:** Geist Sans / Geist Mono via `next/font`
- **Dark mode:** class-based `.dark` (not `prefers-color-scheme` alone), with a light-first default and a Settings / sidebar toggle

## 9. Navigation architecture

`lib/modules.ts` is the single source of truth for modules and quick actions.

**Desktop (`lg` and up):** fixed left sidebar — Home, primary modules, Tools group, Settings, theme toggle.

**Mobile (below `lg`):** bottom bar — Home · Budget · **+** · Activity · More.

- Center **+** opens a bottom sheet of quick actions (Add Expense / Income / Task / Note)
- Desktop header **New** button opens the same actions as a dropdown
- Content uses bottom padding so the fixed nav never covers the page
- Safe-area insets are respected (`viewportFit: cover` + `env(safe-area-inset-bottom)`)

## 10. Responsive / mobile strategy

- Primary breakpoints mentally validated around 320–430px width
- Layout switch at Tailwind `lg` (1024px) — tablets keep the bottom nav to avoid a cramped sidebar
- No horizontal scrolling intended; cards stack naturally
- Touch targets ≥ ~44–56px on primary nav
- Deploy target: Vercel URL opened on a phone browser

## 11. Reusable components

| Component | Role |
|-----------|------|
| `AppShell` | Composes sidebar, header, main, mobile nav |
| `ComingSoon` | One reusable unimplemented-module page |
| `ModuleCard` / `ModuleGrid` | Catalog cards for `/more` and dashboard |
| `QuickActionMenu` | Sheet (mobile) or dropdown (desktop) |
| `ThemeProvider` / `ThemeScript` / `ThemeToggle` | Class-based theming |
| Budget section components | Summary, CSS chart, categories, expenses |
| Dashboard section components | Greeting, overview, actions, modules, activity |

## 12. Mock data strategy

All demo numbers live in [`lib/mock-data.ts`](lib/mock-data.ts).

Formatters live in [`lib/format.ts`](lib/format.ts):

- `formatPKR` uses `en-US` grouping with an `Rs ` prefix (`Rs 250,000`) so amounts match product examples (not Pakistani-style `2,50,000` grouping from `en-PK`)

Presentation components import mock data; they do not invent numbers inline.

## 13. What is intentionally NOT implemented yet

- Backend, APIs, auth, databases
- Real calculations or form submissions
- Persistence of budget / tasks / notes (localStorage / IndexedDB / cloud)
- Chart libraries (budget chart is pure CSS)
- Full PWA installability (service worker, maskable PNG icons)
- Push notifications

## 14. Future roadmap

1. Implement Budget with client-side state and optional local persistence
2. Build Expenses flow and wire quick actions to real forms
3. Tasks / Notes as lightweight local-first tools
4. Add proper PWA icons + optional service worker
5. Consider optional sync only after local-first is solid

## 15. Important technical decisions

1. **Frontend-only** — no backend packages or API routes for product data
2. **Module registry** — navigation surfaces read one registry so sidebar and mobile stay aligned
3. **One accent color** — teal only; avoid per-module color coding
4. **Custom theme (no next-themes in app code)** — small provider + blocking script; `next-themes` may exist as a transitive dependency of Sonner but is not used by LifeKit theme code
5. **`typedRoutes: true`** — broken `href`s fail at compile time
6. **Coming Soon is one component** — nine thin route files, not nine copy-pasted pages
7. **Budget is a visual shell** — realistic UI, static data, no business logic
8. **shadcn full primitive set** — primitives added early so later modules do not need repeated CLI setup

## 16. Instructions for future development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run lint
npx tsc --noEmit
```

**Adding a new module**

1. Add an entry to `modules` in `lib/modules.ts`
2. Create `app/<route>/page.tsx` — either a real page or `<ComingSoon module={getModule("id")} />`
3. Update this document’s status tables

**Turning Budget into a real feature**

1. Keep the existing page structure in `components/budget/*`
2. Introduce client state (and only then persistence, if desired)
3. Replace mock imports gradually; do not add a database until product needs it

**Design constraints to preserve**

- Mobile-first spacing and bottom-nav clearance
- Single accent color
- Calm, personal visual tone
- Keep mock data out of JSX when practical

---

*Last updated to match the codebase after the LifeKit frontend foundation implementation.*
