# POS Backend — Microservices Documentation

> Standalone backend reference for the POS system. This is the **backend** half of the project;
> the frontend (Vite + React) lives in a separate folder/repo. See the repo root `POS_PROJECT_SUMMARY.md` for the whole-system overview.

---

## 1. Repo & Location

| | |
|---|---|
| Path | `C:\Users\aaron\Downloads\pos_backend\pos-backend-v1` |
| Remote | `https://github.com/Alphaexplora-POS/pos-backend-v1.git` |
| Branch | `develop` (work happens on develop) |
| Language | Node.js / Express (CommonJS) |
| ORM | Prisma (Supabase Postgres) |
| Auth | Supabase Auth (email/password) + HttpOnly cookie + `x-tenant-id` / `x-role` headers between services |

---

## 2. Architecture

The backend is a **microservice monorepo**: one **API gateway** (the only public entry point) plus **8 domain services**. Only the gateway binds a port reachable by the frontend (4000); every other service binds `localhost` ports 3001–3008.

### Port / service table

| Port | Service | Env var (gateway) | Gateway prefix |
|---|---|---|---|
| 3001 | identity-service | `IDENTITY_SERVICE_URL` | `/api/identity` |
| 3002 | reference-service | `REFERENCE_SERVICE_URL` | `/api/reference` |
| 3003 | catalog-service | `CATALOG_SERVICE_URL` | `/api/catalog` |
| 3004 | inventory-service | `INVENTORY_SERVICE_URL` | `/api/inventory` |
| 3005 | transaction-service | `TRANSACTION_SERVICE_URL` | `/api/transaction` |
| 3006 | refund-service | `REFUND_SERVICE_URL` | `/api/refund` |
| 3007 | promotion-service | `PROMOTION_SERVICE_URL` | `/api/promotion` |
| 3008 | analytics-service | `ANALYTICS_SERVICE_URL` | `/api/analytics` |
| 4000 | **api-gateway-service** (proxy + CORS) | — | — |

**Gateway (`api-gateway-service`):** Express `cors` (default origin `http://localhost:5173`, credentials allowed), then `createProxyMiddleware` per route. Route map in `src/routes/index.js` — e.g. `GET/CALL /api/identity/*` → `http://localhost:3001/identity/*` (it rewrites the prefix). `/health` reports each service's env URL (only present if the env vars are defined in the gateway `.env`).

### Standard service skeleton

```
<service>-service/
├── .env                       # git-IGNORED — credentials live only on machines
├── package.json               # "dev" = nodemon src/server.js
├── src/
│   ├── server.js              # dotenv + app.listen(PORT)
│   ├── app.js                 # express setup, route mounts, error handler, 404
│   ├── <domain>/              # routes + controller + service + repository + validator
│   ├── shared/middleware/     # validate, require-tenant, require-role
│   ├── shared/utils/appError.js
│   ├── config/database.js     # PrismaClient singleton (cached on globalThis in dev)
│   ├── config/supabase.js     # supabase-js client (SUPABASE_URL + SUPABASE_SECRET_KEY)
│   └── prisma/
│       ├── schema.prisma
│       └── migrations/
```

Every `app.js` normalizes errors to `{ success: false, message, details? }` using `err.statusCode` (from `shared/utils/appError.js`).

---

## 3. Running / Stopping

```bash
# from pos-backend-v1/
npm run install:all   # npm install for all 9 services
npm run dev           # concurrently launches all 9 (nodemon, auto-reload on save)
npm run start:all     # production-style: node src/server.js per service (no reload)
```

Requires Node v22+. All 9 `node_modules` must exist — after a fresh pull, run `npm run install:all`.

**Stop on Windows** (services are separate processes; killing the top window may leave orphans):

```powershell
foreach ($p in 3001..3008 + 4000) {
  Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
}
```

---

## 4. Environment configuration

Each service reads its **own** `.env` (loaded in `server.js` via `dotenv.config({ path: "../.env" })`).

Required keys (validated on the live machine):

- **identity-service (and gateway):** `NODE_ENV`, `PORT`, `SERVICE_NAME`, `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`
- **all other services:** `PORT`, `DATABASE_URL`, `DIRECT_URL` (+ service-specific secrets as used)

`.env` files are NOT in git. A fresh clone requires them to be copied/provisioned separately.

> **Known `.env` gotcha:** identity's `.env` once had `SUPABASE_URL==https://...` (double `=`), which made Supabase reject it (`Invalid supabaseUrl`). It must be exactly `SUPABASE_URL=https://...`.

---

## 5. Auth model

- **External (browser → services):** Supabase Auth in **identity-service**. Login/signup mint a JWT; identity-service sets an **HttpOnly cookie** `access_token` (7 days, `SameSite=Lax`, `secure` only in production).
- **Service-to-service:** the backend uses simple header-based scoping, **not JWT verification**:
  - `x-tenant-id` → `require-tenant` middleware (`reference`, `catalog`, `inventory` require it; 400 if missing).
  - `x-role` → `require-role(...roles)` middleware (`catalog`; values `owner | manager | staff`, default `staff`; 403 otherwise).
  - Passed via `req.header("x-tenant-id") || req.body.tenantId`.

The gateway does not yet enforce auth centrally — services individually guard their routes.

---

## 6. Service-by-service reference

### 6.1 identity-service (port 3001) — most complete

Routes mounted in `app.js`: `/identity/auth`, `/identity/tenants`, `/identity/branches`, `/identity/profiles`, `/identity/employees`, `/identity/sessions`.

| Method | Path | Notes |
|---|---|---|
| POST | `/identity/auth/signup` | creates Supabase user + sets cookie |
| POST | `/identity/auth/login` | `supabase.auth.signInWithPassword`, then enriches with Prisma (profile + tenant) |
| GET | `/identity/auth/me` | cookie → `supabase.auth.getUser` → profile/tenant checks |
| POST | `/identity/auth/logout` | clears cookie |
| POST/GET | `/identity/tenants` | create / list; GET `/identity/tenants/:id` |
| POST/GET | `/identity/branches` | create / list; GET `/:id`; PATCH `/:id` deactivate; GET `/:branchId/manager`; GET `/:branchId/employees` |
| POST | `/identity/profiles` | create profile; GET `/:id`; PATCH `/:id` deactivate |
| POST | `/identity/employees` | create + `verify-pin`; PATCH `/:id` deactivate |
| POST | `/identity/sessions` | open POS session; GET `/:id/summary`; PATCH `/:id/close` |

Prisma models: `Tenant`, `Branch`, `Profile`, `Employee`, `PosSession` (schema in `src/prisma/schema.prisma`).

Login/me logic (`src/auth/auth.service.js`): rejects 401 for bad credentials / non-owner-manager roles, 403 for deactivated profile or inactive tenant.

### 6.2 reference-service (port 3002) — implemented

Routes: `/reference/payment-methods`, `/reference/reason-codes` (both behind `requireTenant`).

| Domain | Endpoints |
|---|---|
| payment-methods | GET `/`, POST `/`, GET `/:id`, PATCH `/:id` |
| reason-codes | GET `/`, POST `/`, GET `/:id`, PATCH `/:id` |

Models: `PaymentMethod`, `ReasonCode`.

### 6.3 catalog-service (port 3003) — implemented

Routes: `/catalog/categories`, `/catalog/products` (+ nested `/products/:productId/variants`, `/products/:productId/attributes`). All behind `requireTenant`; product create/update behind `requireRole("owner")`; variant status behind `requireRole("owner","manager")`.

| Path | Endpoints |
|---|---|
| `/catalog/categories` | GET `/`, POST `/` |
| `/catalog/products` | POST `/`, GET `/:id`, PATCH `/:id` |
| `/catalog/products/:productId/variants` | POST `/`, PATCH `/:variantId`, PATCH `/:variantId/status` |
| `/catalog/products/:productId/attributes` | POST `/` |

Models: `Category`, `Product`, `ProductVariant`, `ProductAttribute`.

### 6.4 inventory-service (port 3004) — implemented

Routes: `/inventory` (behind `requireTenant`): GET `/` (stock), POST `/adjust`, GET `/audit-logs`. Models: `BranchInventory`, `InventoryAuditLog`.

### 6.5 transaction / refund / promotion / analytics (3005–3008) — **stubs so far**

These four services are only scaffolded: each `app.js` exposes just a health string (`/transaction`, `/refund`, `/promotion`, `/analytics`) and a 404 handler — **no business routes yet**, even though their Prisma schemas exist:

- **transaction-service:** `Transaction`, `TransactionItem`, `TransactionPayment`, `TransactionDiscount`
- **refund-service:** `Refund`, `RefundItem`
- **promotion-service:** `Promotion`, `PromotionApplicableItem`
- **analytics-service:** `DailySalesSummary`, `ProductSalesRanking`

They boot and respond to `/health`-style checks but have no CRUD endpoints implemented.

---

## 7. Database & Prisma

- Connection: Supabase Postgres via `DATABASE_URL` (+ `DIRECT_URL` for Prisma direct connections).
- Client: `config/database.js` exports one `PrismaClient`; cached on `globalThis` in dev to avoid connection exhaustion under nodemon restarts.
- Migrations: `src/prisma/migrations/<timestamp>_<name>/migration.sql` per service. Example important one: `20260909070000_profile_branch_nullable` (`ALTER TABLE "profiles" ALTER COLUMN "branch_id" DROP NOT NULL`).

**After any fresh pull / schema change, regenerate the client:**

```bash
# in each service dir (only where needed on first install):
npx prisma generate --schema src/prisma/schema.prisma
```

- Missing generation ⇒ startup crash `@prisma/client did not initialize yet` (seen in reference + inventory).
- **Stale** client (schema changed but client not regenerated) ⇒ runtime 500s, e.g. identity returning `Error converting field "branchId" of expected non-nullable "String", found null`. Symptom: login 500 internal error.

---

## 8. Known breakage checklist (fresh clone)

1. `npm run install:all` / `npm install` — deps were missing after a pull (`cors` in gateway, `@supabase/supabase-js` in identity, etc.).
2. `npx prisma generate` — needed for any service that has a `src/prisma/schema.prisma` (at minimum reference, inventory, identity).
3. `.env` files — not in git; must exist per service (check `SUPABASE_URL==` typo).
4. Verify after boot: `Get-NetTCPConnection -LocalPort 3001,4000 -State Listen`; `GET http://localhost:4000/health`; identity self-test `GET http://localhost:3001/identity`.

---

## 9. Recent work on this machine (for context)

- Fixed fresh-pull boot failures: dependency installs, `prisma generate` across services, and the identity `.env` double-equals bug.
- Verified login end-to-end: `POST /api/identity/auth/login` returns 200 with `accessToken` + `profile`; HttpOnly cookie set; `GET /api/identity/auth/me` restores the session.
- Logged-in test accounts (Supabase): owner `test1@gmail.com` / `test123`; manager `manager@lumen.ph` / `ManagerPass!2026`.

---

## 10. Next steps the repo is waiting on

- Implement business routes for **transaction**, **refund**, **promotion**, **analytics** services (schemas exist).
- Decide on centralized auth enforcement in the gateway (currently services assume `x-tenant-id` / `x-role` headers and the cookie is only honored by identity).