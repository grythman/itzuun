# Launch Execution Plan (World-Class Track)

## Objective
- Move ITZuun from launch-ready prototype to production-grade, scalable operation.
- Enforce measurable quality gates across product, engineering, and operations.

## Workstreams

| Stream | Owner | Window | Success Metric | Exit Criteria |
|---|---|---|---|---|
| Production Stability Lock | @mike_ops | Week 1 | 2 consecutive green KPI+readiness runs | No critical incidents for 7 days |
| Trust & Risk Hardening | @julia_support | Week 1-2 | Admin critical endpoint test pass rate 100% | Audit/permission regression risk closed |
| Pilot to Real Usage Conversion | @copilot | Week 2-3 | Synthetic evidence replaced with real evidence links | Pilot milestones backed by production data |
| Quality Gates Upgrade | @copilot | Week 2-3 | Required checks enforced on main branch | No merge without lint/type/test/readiness checks |
| Release Engineering Maturity | @mike_ops | Week 3-4 | Post-deploy verification + rollback guard active | Deterministic deploy with validated rollback |
| Observability & Ops Excellence | @mike_ops | Week 4 | KPI drift/dispute alerts trigger incidents automatically | Incident decision time under 5 minutes |
| Product Readiness for Scale | @tara_growth | Parallel | Conversion funnel visibility + UX bottleneck fixes | Growth-ready onboarding and search/file UX |

## Week 1 Execution Queue (Start Now)

1. Run and validate weekly KPI + readiness workflows on production (`days=1` smoke).
2. Confirm artifacts exist: `weekly-kpi-report`, `pilot-readiness-report`.
3. Verify fallback path is not used (command available on server).
4. Run admin critical smoke tests and attach evidence.
5. Update pilot tracker milestones with latest evidence links.

## Current Status (2026-04-02 UTC)

1. Local Week 1 queue executed successfully.
2. Evidence: `docs/evidence/week1_launch_checks_20260402_145235.md`.
3. Local readiness report is `ready=true`.
4. Remaining critical path is production verification (workflow run + live artifacts).

## Next Actions (Production-Only)

1. Trigger GitHub `Weekly KPI Report` with `days=1`.
2. Confirm artifacts:
- `weekly-kpi-report`
- `pilot-readiness-report`
3. Verify `pilot_ready` in Slack message and workflow summary.
4. Attach production run URL into `docs/PILOT_ROLLOUT_TRACKER.md`.

## Engineering Guardrails

1. CI required checks:
- `workflow-lint`
- backend quality checks
- frontend quality checks
- KPI/report smoke checks

2. Command contracts (must stay stable):
- `weekly_kpi_report --json`
- `setup_pilot_cohort --strict`
- `pilot_readiness_report --json --strict`

3. Evidence contract:
- Every milestone status change must include a verifiable link or artifact path.

## Definition of Done (Launch Execution)

1. Pilot exit gate reports `ready=true` in production artifacts.
2. KPI trend is stable (no unresolved severity incident).
3. Admin dispute + escrow + audit paths are tested and evidenced.
4. Deploy pipeline has verified rollback and post-deploy checks.
5. Tracker and playbooks are current, reproducible, and automation-backed.
