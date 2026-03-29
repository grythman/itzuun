# Dispute Support Playbook (MVP)

## Scope
- Trigger: `project.status=disputed` or client/freelancer dispute request.
- Actors: Support, Admin Resolver, Tech On-call.
- SLA: first response <= 24h, resolution target <= 72h.

## Intake Checklist
1. Confirm identities: client + freelancer emails, project id, dispute id.
2. Collect evidence: chat logs, deliverables, milestone/result notes, escrow state.
3. Validate ledger consistency: deposit/fee/release/refund entries.
4. Classify case:
- `delivery_quality`
- `scope_mismatch`
- `payment_disagreement`
- `abuse_or_policy`

## Resolution Matrix
- If deliverable accepted with minor issues: partial release + partial refund.
- If clear non-delivery or policy breach: full refund.
- If work completed and accepted evidence is strong: release to freelancer.
- Always include resolver note with factual rationale.

## Ops Runbook
1. List open disputes: `GET /api/v1/admin/disputes?unresolved=true`
2. Resolve dispute: `POST /api/v1/admin/disputes/{id}/resolve`
3. Verify post-state:
- `project.status` in `completed|closed_refunded`
- escrow status updated
- ledger entries created
4. Notify both parties with outcome summary + next action.

## Escalation
- Escalate to Tech On-call if:
- ledger mismatch
- invalid state transition
- repeated resolver API errors
- Escalate to product/legal owner for abuse/fraud pattern.

## Postmortem Data
- case type, resolution action, time-to-resolution, refund/release amount, repeat-user flag.
- Weekly review feeds KPI (`dispute_rate_pct`, completion impact).
