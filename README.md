# ITZuun MVP

Mongolia-focused IT freelance marketplace MVP with escrow and role-based operations.

## Stack

- Backend: Django, DRF, PostgreSQL, Simple JWT, Django Admin
- Frontend: Next.js App Router, TypeScript, TailwindCSS, React Query, React Hook Form, Zod
- API base: `/api/v1/`
- Auth transport: JWT in HttpOnly cookies (`credentials: include`)

## Implemented Modules

- Authentication + OTP flow (`request-otp`, `verify-otp`, `refresh`, `logout`, `me`, role update)
- Role-based profile management
- Project + proposal lifecycle (including ownership/role checks)
- Escrow flow with admin approval, release, dispute, and configurable commission
- Project chat (polling-ready list/send + file upload field)
- Review submit and user rating summary
- Admin operations (verify users, escrow/disputes, commission policy)

## Business Rules Enforced

- One selected freelancer per project
- One proposal per freelancer per project
- Escrow required before `in_progress` completion flow
- Review only allowed after escrow release (`project.status=completed`)
- Platform fee default 12% and admin-configurable via policy

## Environment Variables

### Backend (`backend/.env`)

Use `backend/.env.example` as the base.

- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG` (`1` local)
- `DJANGO_ALLOWED_HOSTS`
- `DJANGO_CSRF_TRUSTED_ORIGINS`
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
- `CORS_ALLOWED_ORIGINS`
- Optional cache/perf vars: `REDIS_URL`, throttle/logging vars

### Frontend (`frontend/.env.local`)

Use `frontend/.env.example` as the base.

- `NEXT_PUBLIC_API_BASE_URL` (example: `http://127.0.0.1:8000/api/v1`)

## Run Locally

### Option A: Full stack scripts (Docker Postgres + app servers)

```bash
./scripts/run_stack.sh
```

Stop:

```bash
./scripts/stop_stack.sh
# or include db
./scripts/stop_stack.sh --with-db
```

### Option B: Manual

Backend:

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev -- --hostname 0.0.0.0 --port 3000
```

## Seed Demo Data

```bash
cd backend
python manage.py seed_mvp_demo
```

Seeded users (password: `Pass1234!`):

- `admin@itzuun.mn` (admin)
- `client@itzuun.mn` (client)
- `freelancer.pending@itzuun.mn` (freelancer, unverified)
- `freelancer@itzuun.mn` (freelancer, verified)

## Test Commands

Backend focused tests:

```bash
cd backend
DJANGO_DEBUG=1 python manage.py test apps.payments.tests.MvPHappyPathApiTests apps.payments.tests.EscrowAbuseMatrixTests
```

Frontend tests:

```bash
cd frontend
npm test
```

Frontend production build check:

```bash
cd frontend
npm run build
```

## Required MVP Demo Paths

### Happy path

1. Client creates project
2. Freelancer submits proposal
3. Client selects freelancer
4. Client deposits escrow
5. Admin approves escrow
6. Freelancer submits deliverable + result
7. Client releases escrow
8. Client submits review

### Admin path

1. Verify freelancer
2. Resolve dispute
3. Update commission

## Known Limitations

- Chat is polling-based (no websocket real-time transport in MVP).
- File upload validation is strict (size/type); UI surfaces server-side errors directly.
- No payment gateway integration in MVP; escrow is platform-ledger state and audit log.
- Frontend dashboards are intentionally minimal and action-focused (no advanced filtering/reporting).
