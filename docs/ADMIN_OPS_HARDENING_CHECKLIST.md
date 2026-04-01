# Admin Ops Hardening Checklist (Launch Readiness)

## Scope
- Validate critical admin operations before broader rollout.
- Focus areas: `dispute resolution`, `escrow actions`, `audit trail`, `permissions`.

## Preconditions
1. Backend is up and reachable.
2. At least one seeded project exists in each state:
- `in_progress`
- `submitted`
- `disputed`
3. Admin test account is available.

## Smoke Tests (Critical Path)
1. Dispute queue visibility
- `GET /api/v1/admin/disputes?unresolved=true`
- Expect: unresolved disputes listed with valid project/user references.

2. Dispute resolve flow
- `POST /api/v1/admin/disputes/{id}/resolve`
- Expect: dispute marked resolved; project status transitions to valid terminal state.

3. Escrow release/refund safety
- Run admin action for `release` and `refund` on controlled test cases.
- Expect: no invalid transitions; no duplicate ledger side effects.

4. Unsuspend admin action
- `POST /api/v1/admin/users/{id}/unsuspend`
- Expect: suspended user returns to active state; event logged.

5. Audit log visibility
- `GET /api/v1/admin/audit-logs`
- Expect: action entries include actor, target, action type, timestamp.

## Permission Checks (Must Fail for Non-Admin)
1. Non-admin access to `/api/v1/admin/audit-logs` returns `403`.
2. Non-admin access to `/api/v1/admin/users/{id}/unsuspend` returns `403`.
3. Non-admin access to dispute resolve endpoint returns `403`.

## Evidence Bundle (Required)
- API request/response snapshots (or test report link)
- Affected project/dispute/user IDs
- Log snippet with request_id
- Owner + timestamp (UTC)

## Completion Criteria
1. All smoke tests pass.
2. All non-admin permission checks fail as expected.
3. Evidence bundle attached in pilot tracker.
4. Any failure opens incident using `docs/ONCALL_QUICK_ACTIONS.md`.

## Latest Verification Snapshot
- Timestamp (UTC): `2026-04-01`
- Command: `cd backend && ../.venv/bin/python manage.py test apps.adminpanel.tests apps.payments.tests -v 2`
- Result: `26 tests, OK`
