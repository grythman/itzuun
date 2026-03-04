# ITZuun Frontend MVP

Next.js (App Router) frontend for ITZuun Django API.

## Stack

- Next.js + TypeScript + Tailwind CSS
- React Query + local state (Zustand for toast)
- React Hook Form + Zod
- Vitest + Testing Library

## Install

1. `cd frontend`
2. `cp .env.example .env.local`
3. `npm install`

## Run

- Dev: `npm run dev`
- Build: `npm run build`
- Start: `npm run start`
- Test: `npm run test`

## Environment

- `NEXT_PUBLIC_API_BASE_URL`: Django API base URL, default `.env.example` points to `http://127.0.0.1:8000/api/v1`

## Implemented MVP Flows

- OTP auth request/verify
- `401` silent refresh + original request retry once
- Global toast notifications (`info/success/warn/error`)
- Projects list/detail/create
- Proposal submit/select, submit-result + deliverable action, completion confirm
- Admin guard and admin panel actions (users/projects/escrow/disputes/commission)

## Known Limitations

- Some payload fields may differ per backend serializer, so minor field mapping adjustments may be needed.
- Styling is intentionally minimal for MVP.
- Messaging/reviews/payment screens are action-level integration inside project detail, not separate pages.
