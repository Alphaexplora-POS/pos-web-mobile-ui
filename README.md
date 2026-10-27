# pos-web-mobile-ui

Vite + React 18 + TypeScript + TailwindCSS frontend for the POS. MVVM structure (models / viewModels / views), mock-data toggle, Framer Motion, react-hook-form + zod.

> Login is **never mocked** — it always hits the real backend. Run the backend first (see below).

## Project docs

Design/flow docs are kept locally in `notes/` (not committed to git, so they stay
internal). Each file is a pared-down overview — read them for context before changing behavior:

| File | Contents |
|---|---|
| `notes/web.md` | Web app flow: signup → login → the 6 modules (Branches/Employees, Products, Inventory, Transactions, Analytics, Configuration), owner vs branch manager access (RLS-scoped). |
| `notes/mobile.md` | Mobile POS flow: PIN login, POS, History, Dashboard, Inventory, Shift closure, refunds. The mobile repo is `pos-kotlin-ui` (local sibling of this repo). |
| `notes/BACKEND_SUMMARY.md` | Backend/API summary for the modular monolith. |
| `notes/credentials.md` | Local test accounts/credentials. |
| `notes/rules.md` | Project conventions/rules. |
| `notes/Frontend_UI_Changes_TL_Review.md` | UI change review notes. |

## Repository layout

MVVM-style structure: feature pages live under `src/features/<name>/` split into
`models` (types + API calls), `viewModels` (hooks), and `views` (components). Shared UI lives
in `src/shared/components` and `src/shared/hooks`.

```
src/
├─ shared/            # shared components, hooks, models, utils
└─ features/
   ├─ auth/           # login / register
   ├─ branches/       # employees + branch management
   ├─ products/       # products, categories, promos
   ├─ inventory/      # global inventory + audit
   ├─ transactions/   # transaction history + refunds
   ├─ analytics/      # dashboards + top products
   └─ configuration/  # payment methods + reason codes
```

The mobile app's color scheme is ported here: brand teal `#01A2AD`, navy `#1B2A47`, and the
full pill palette are defined as Tailwind tokens in `tailwind.config.js` (`brand`, `navy`,
`canvas`, `ink`, `line`, `success`, `warning`, `error`, `info`).

## Branch workflow

- `develop` – main development line.
- `merge/develop` – integration branch; feature/bug branches merge here first, then into `develop`.
- `bug-fix-ui` / `frontend-monolith` – work-in-progress branches.
- `uat` / `main` – release lines.

## Run the frontend

```bash
npm install
npm run dev     # -> http://localhost:5173
```

The Vite dev server proxies `/api` → `http://localhost:4000` (the backend gateway). Override with
`VITE_API_BASE_URL` in a `.env` file if needed.

## Run the backend (required for login)

Backend is a separate repo (`pos-backend-v1`, now a **modular monolith** on the `feature/monolith` branch). From its root:

```bash
npm install                  # first time only
npm run prisma:generate      # once, or after schema changes
npm run seed                 # restores tenant + test accounts
npm run dev                  # single Express app on :4000 serving /api/*
```

### Test accounts

| Email | Password | Role |
|---|---|---|
| `test1@gmail.com` | `test123` | owner |
| `manager@lumen.ph` | `ManagerPass!2026` | branch manager |

### Mock data

`USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'` (`src/mock/config.ts`), so **mock is ON by
default** (no `.env` file in this repo). Pages using mock: branches, employees, products,
inventory, analytics, transactions/shift, configuration. Set `VITE_USE_MOCK=false` in `.env` to
use real backend data everywhere.

### Useful scripts (check `package.json`)

```bash
npm run dev     # Vite dev server
npm run build   # type-check + production build (tsc -b && vite build)
npm run preview # preview the production build
npm run lint    # tsc --noEmit (type check only)
```