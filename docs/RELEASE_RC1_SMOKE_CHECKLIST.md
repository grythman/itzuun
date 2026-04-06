# Release RC1 Smoke Checklist

## Scope
- Release tag: `v0.1.0-rc1`
- Branch: `main`
- Purpose: quick production sanity check before broad rollout.

## Preconditions
- API and frontend deployments are healthy.
- Admin account credentials are available.
- Test client and freelancer accounts are available.

## Auth
- [ ] Open `/auth/login` and sign in as client.
- [ ] Open `/auth/login` and sign in as freelancer.
- [ ] Call Google auth endpoint and confirm successful login for verified Google account.

## Client Dashboard
- [ ] Open `/client` and confirm page loads without `Could not load projects` error.
- [ ] If projects list is empty, verify `Post project` CTA is visible and opens `/projects/new`.
- [ ] On temporary API failure, verify `Retry` action restores data after recovery.

## Freelancer Dashboard
- [ ] Open `/freelancer` and confirm page loads without `Could not load dashboard data` error.
- [ ] If active projects are empty, verify `Browse projects` CTA opens `/projects`.
- [ ] On temporary API failure, verify `Retry` action restores data after recovery.

## Admin Ops
- [ ] Audit logs endpoint `/api/v1/admin/audit-logs` returns data for admin.
- [ ] Unsuspend endpoint `/api/v1/admin/users/{id}/unsuspend` succeeds for suspended user.
- [ ] Verify unsuspend action appears in audit logs.

## Exit Criteria
- [ ] No blocker severity issues found.
- [ ] Any non-blocker issues are logged with owner and due date.
- [ ] Evidence links captured in `docs/PILOT_ROLLOUT_TRACKER.md`.
