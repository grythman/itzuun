# Release Notes RC1 (`v0.1.0-rc1`)

Date: 2026-04-06 UTC
Tag: `v0.1.0-rc1`

## Highlights
- Admin unsuspend flow is live with audit trail creation.
- Admin API/frontend route mismatch fixed (`/api/v1/admin/...` without trailing slash).
- Admin Users runtime crash fixed (React hook-order issue).
- Admin Users page now supports paginated API responses (`results`).
- Client/Freelancer dashboard UX improved with actionable error/empty states.
- Google auth verification sync hardened (`is_verified` repair for drift).
- KPI pipeline hardened (cohort label support, alert profile logic, stricter required key checks).

## Validation Summary
- Frontend build: pass (`npm run build`)
- Frontend tests: pass (`40/40`)
- Backend tests: pass (`74/74`)
- Google auth targeted tests: pass (`4/4`)
- RC1 live smoke: recorded in `docs/evidence/release_rc1_smoke_20260406_0731.md`
- Admin unsuspend audit verification: recorded in `docs/PILOT_ROLLOUT_TRACKER.md`

## Known Gaps
- Credentialed auth-path smoke checks (client/freelancer/Google login) remain manual and should be completed by ops using production credentials.
- KPI incident `INC-20260404-1` remains in `monitoring` until two consecutive healthy weekly runs are observed.

## Evidence Links
- Tracker: `docs/PILOT_ROLLOUT_TRACKER.md`
- Incident: `docs/incidents/INC-20260404-1.md`
- RC1 smoke evidence: `docs/evidence/release_rc1_smoke_20260406_0731.md`
