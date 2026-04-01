# Dispute Dry-Run Evidence Template

## Case Header
- Date (UTC):
- Owner:
- Project ID:
- Dispute ID:
- Case type: `delivery_quality | scope_mismatch | payment_disagreement | abuse_or_policy`

## Preconditions
- Escrow funded: `yes/no`
- Project state before dispute:
- Participants validated (client/freelancer): `yes/no`

## Execution Steps
1. List unresolved disputes:
- Request: `GET /api/v1/admin/disputes?unresolved=true`
- Result:

2. Resolve dispute:
- Request: `POST /api/v1/admin/disputes/{id}/resolve`
- Payload (`action`, `release_amount`, `refund_amount`, `note`):
- Result:

3. Validate post-state:
- `project.status`:
- escrow status:
- ledger entries checked: `yes/no`

## Evidence Links
- API logs / screenshots:
- Tracker row:
- Incident (if opened):

## Verification Snapshot (Local Test)
- Command:
`cd backend && ../.venv/bin/python manage.py test apps.payments.tests.EscrowAbuseMatrixTests.test_dispute_then_confirm_completion_is_blocked -v 2`
- Result:
`1 test, OK (2026-04-01 UTC)`
