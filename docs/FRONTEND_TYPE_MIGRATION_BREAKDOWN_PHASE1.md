# Frontend Type Migration Breakdown (Phase 1)

Goal: reduce `any` usage in critical flows and lock API contracts.

## Principles
1. API DTO types live in `frontend/lib/api/types.ts`.
2. `endpoints.ts` returns typed promises only.
3. Hooks expose typed `useQuery`/`useMutation` results.
4. UI layers do not parse raw `any` response bodies.

## Batch 1 (Critical Flows First)
### File: `frontend/lib/api/endpoints.ts`
- Replace request/response `any` for:
- auth (`me`, `google`, otp)
- projects (`get`, `list`, `create`, `selectFreelancer`)
- payments (`createPayment`, `paymentStatus`)
- admin moderation (`users`, `verifyUser`, `unsuspendUser`)
- Add shared `ApiErrorEnvelope` extraction helper.

### File: `frontend/lib/hooks.ts`
- Type hook params and mutation payloads.
- Replace `err: any` in mutations with typed API error handling.
- Ensure `useProjectProposals` and related hooks use typed DTOs.

### Files: critical pages
- `frontend/app/[locale]/projects/[id]/page.tsx`
- `frontend/app/[locale]/projects/[id]/payment/page.tsx`
- `frontend/app/[locale]/admin/page.tsx`
- Remove implicit `any` casts in action handlers.

## Batch 2 (Supporting Flows)
### File group: profile + freelancer pages
- `frontend/app/[locale]/freelancer/*.tsx`
- `frontend/app/[locale]/client/*.tsx`
- `frontend/app/[locale]/profiles/*.tsx`
- Normalize list/pagination typing.

### File group: messaging + reviews
- `frontend/components/project-chat.tsx`
- review and rating consumers in project detail pages.

## Batch 3 (Guardrails)
1. Enable stricter lint rules for `@typescript-eslint/no-explicit-any` in API and hooks layer.
2. Add contract-level tests for typed adapters.
3. Block CI on type regressions in `frontend/lib/api` and `frontend/lib/hooks`.

## Measurable Targets
- Critical flows: reduce `any` by >=80% in `endpoints.ts` + `hooks.ts`.
- CI: `npx tsc --noEmit` clean on PRs.
- Contract breakage incidents from frontend parsing: zero in release window.

## File-by-File Ownership
- API type system: `frontend/lib/api/*` (frontend platform owner)
- Hooks hardening: `frontend/lib/hooks.ts` (frontend platform owner)
- Critical UI adaptation: project/admin pages (feature owners)
- CI rules: `.github/workflows/ci.yml` + ESLint config (platform + QA)
