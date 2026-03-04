# ITZuun Frontend (Next.js MVP)

Next.js + TypeScript + Tailwind frontend for the ITZuun marketplace backend.

## Install

```bash
cd frontend
npm install
```

## Run

```bash
npm run dev
```

Default URL: `http://localhost:3000`

## Environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Required variable:

- `NEXT_PUBLIC_API_BASE_URL` (example: `http://127.0.0.1:8000/api/v1`)

## Scripts

- `npm run dev` - development server
- `npm run build` - production build
- `npm run start` - run production build
- `npm run test` - run Vitest tests

## Covered MVP Flows

- Auth: request OTP, verify OTP, logout, role switch
- Silent refresh on `401` with one retry
- Projects: list, detail, create
- Freelancer: submit proposal, submit result + deliverable awareness
- Client: select freelancer, escrow deposit, confirm completion, dispute, review
- Admin: users/projects/escrow/disputes list, verify user, resolve dispute, update commission
- Global toast/banner and loading/empty/error states

## Minimal Test Coverage

- `tests/api-client.test.ts` - refresh + retry behavior
- `tests/role-guard.test.tsx` - protected route guard behavior
- `tests/home-page.test.tsx` - happy path project list rendering

## Known Limitations

- UI is intentionally MVP/minimal and action-driven.
- Some backend payloads are treated with relaxed typing where schema may vary.
- Admin and project pages assume backend auth/session cookies are valid in browser.
