# pos-web-mobile-ui

Vite + React 18 + TypeScript + TailwindCSS frontend for the POS. MVVM structure (models / viewModels / views), mock-data toggle, Framer Motion, react-hook-form + zod.

> Login is **never mocked** — it always hits the real backend. Run the backend first (see below).

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