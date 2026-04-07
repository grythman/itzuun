# Release RC1 Smoke Checklist

## Scope
- Release tag: `v0.1.0-rc1`
- Branch: `main`
- Purpose: quick production sanity check before broad rollout.

## Preconditions
- [x] API and frontend deployments are healthy.
- [x] Admin account credentials are available.
- [x] Test client and freelancer accounts are available.

## Auth
- [x] Open `/auth/login` and sign in as client. (`2026-04-07T05:55:10Z` production API sign-in with `qa.client.20260407055510@itzuun.mn` -> `200`)
- [x] Open `/auth/login` and sign in as freelancer. (`2026-04-07T05:55:10Z` production API sign-in with `qa.freelancer.20260407055510@itzuun.mn` -> `200`)
- [ ] Call Google auth endpoint and confirm successful login for verified Google account. (`2026-04-07T05:55:10Z` endpoint reachable; verified-token login not executed in scripted run)
- [ ] After client sign-in, confirm redirect to `/client` without manual refresh. (manual browser verification pending)
- [ ] After freelancer sign-in, confirm redirect to `/freelancer` without manual refresh. (manual browser verification pending)
- [x] Immediately after each sign-in, verify `GET /api/v1/accounts/users/me/` returns authenticated user payload. (`2026-04-07T05:55:10Z` client/freelancer immediate `/me` both returned authenticated user JSON)

### Auth Evidence Capture
- Verification date/time (UTC): `2026-04-07T05:55:10Z`
- Verifier: `@copilot`
- Client result: `pass` (`POST /api/v1/accounts/auth/login/` -> `200` using `qa.client.20260407055510@itzuun.mn`)
- Freelancer result: `pass` (`POST /api/v1/accounts/auth/login/` -> `200` using `qa.freelancer.20260407055510@itzuun.mn`)
- `/api/v1/accounts/users/me/` immediate check: `pass` (`200` authenticated user payload for both roles)
- Artifacts (screenshots/network logs): terminal logs from production curl checks (register/login/me)

## Client Dashboard
- [x] Open `/client` and confirm page loads without `Could not load projects` error.
- [ ] If projects list is empty, verify `Post project` CTA is visible and opens `/projects/new`.
- [ ] On temporary API failure, verify `Retry` action restores data after recovery.

## Freelancer Dashboard
- [x] Open `/freelancer` and confirm page loads without `Could not load dashboard data` error.
- [ ] If active projects are empty, verify `Browse projects` CTA opens `/projects`.
- [ ] On temporary API failure, verify `Retry` action restores data after recovery.

## Admin Ops
- [x] Audit logs endpoint `/api/v1/admin/audit-logs` returns data for admin.
- [x] Unsuspend endpoint `/api/v1/admin/users/{id}/unsuspend` succeeds for suspended user.
- [x] Verify unsuspend action appears in audit logs.

## Exit Criteria
- [x] No blocker severity issues found.
- [x] Any non-blocker issues are logged with owner and due date.
- [x] Evidence links captured in `docs/PILOT_ROLLOUT_TRACKER.md`.

## Notes
- Remaining manual checks are credentialed auth-path UX checks under `## Auth` and dashboard CTA retry behavior for induced API failures.
