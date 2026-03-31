# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Full stack (recommended for local dev)
- Start backend + frontend + Postgres container:
  - `./scripts/run_stack.sh`
- Stop backend + frontend:
  - `./scripts/stop_stack.sh`
- Stop backend + frontend + Postgres:
  - `./scripts/stop_stack.sh --with-db`

### Backend (Django)
- Install deps:
  - `cd backend && pip install -r requirements.txt`
- Run migrations:
  - `cd backend && python manage.py migrate`
- Run dev server:
  - `cd backend && python manage.py runserver 0.0.0.0:8000`
- Run all tests:
  - `cd backend && python manage.py test`
- Run a single test module/class/test:
  - `cd backend && python manage.py test apps.payments.tests`
  - `cd backend && python manage.py test apps.payments.tests.MvPHappyPathApiTests`
  - `cd backend && python manage.py test apps.payments.tests.MvPHappyPathApiTests.test_happy_path`
- Seed demo data:
  - `cd backend && python manage.py seed_mvp_demo`

### Frontend (Next.js)
- Install deps:
  - `cd frontend && npm install`
- Run dev server:
  - `cd frontend && npm run dev -- --hostname 0.0.0.0 --port 3000`
- Lint:
  - `cd frontend && npm run lint`
- Run tests:
  - `cd frontend && npm test`
- Run a single frontend test file:
  - `cd frontend && npm test -- tests/<file>.test.tsx`
- Build production bundle:
  - `cd frontend && npm run build`
- Run production server:
  - `cd frontend && npm run start`

## Architecture Overview

ITZuun is a Django REST + Next.js App Router MVP for a freelance marketplace with escrow-driven project lifecycle and role-gated operations.

### System shape
- **Backend**: Django + DRF monolith under `backend/`, API-first with routes mounted at `/api/v1/`.
- **Frontend**: Next.js app under `frontend/`, using `next-intl`, React Query, RHF/Zod.
- **Transport/auth model**: JWT in HttpOnly cookies; frontend axios client always uses `withCredentials: true`.
- **Proxy model in dev**: Next.js rewrites `/api/v1/*` and `/media/*` to Django origin (`BACKEND_ORIGIN`, default `http://127.0.0.1:8000`).

### Backend domain decomposition
- `apps.accounts`: custom `User` (email login, roles, verification states), OTP/auth endpoints, cookie JWT auth class.
- `apps.projects`: project + proposal + deliverable core workflow.
- `apps.payments`: escrow, ledger entries, disputes, idempotency keys, immutable financial audit log.
- `apps.messaging`: project-scoped chat messages + file uploads.
- `apps.reviews`: post-completion reviews and rating summaries.
- `apps.adminpanel`: moderation/ops APIs (verification, disputes, escrow, commission, audit/ledger visibility).
- `common`: cross-cutting primitives (cache key/version helpers, state guards, pagination, exceptions, middleware).

### Core business workflow
1. Client creates project (`open`).
2. Verified freelancer submits proposal (unique per project/freelancer).
3. Client selects freelancer.
4. Client deposits escrow; admin approves escrow (`held`).
5. Selected freelancer delivers files + submits result.
6. Client confirms completion -> escrow release and project completion.
7. Client can review freelancer only after release/completion.

### State and integrity model
- Project and escrow transitions are constrained by guard maps in `common/state_guards.py`; service layer enforces transitions and raises domain errors.
- Financial side effects are recorded through ledger/audit models; `FinancialAuditLog` is intentionally immutable.
- Payment/approval/dispute endpoints use idempotency execution paths to avoid duplicate side effects on retries.

### Caching and invalidation
- Read-heavy endpoints cache list/detail payloads (projects, admin resources, profiles/reviews).
- Cache keys are versioned; writes call `bump_*_version` helpers from `common/cache_utils.py` to invalidate by version bump instead of broad deletes.

### Frontend structure
- Route tree is locale-scoped (`frontend/app/[locale]/...`) and wrapped by `NextIntlClientProvider`.
- API wrappers live in `frontend/lib/api/endpoints.ts`; React Query hooks in `frontend/lib/hooks.ts`.
- Key product screens (projects, project detail, admin views) orchestrate lifecycle actions by calling those API wrappers.

## Important implementation notes
- URL style is mixed: some backend endpoints accept optional trailing slash (`re_path(.../?$)`), others are slashless `path(...)`. Match existing endpoint conventions when adding new frontend calls.
- Backend settings auto-switch to SQLite for tests (`'test' in sys.argv`) and support Postgres/Redis in non-test environments.
- There are currently no repository Cursor rules (`.cursorrules` / `.cursor/rules`) or Copilot instructions (`.github/copilot-instructions.md`) checked in.
