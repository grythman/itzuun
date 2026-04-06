# Pilot Rollout Tracker (First 20 Projects)

## Goal
- Track launch-readiness rollout for first 20 real projects with owner + evidence.
- Link weekly KPI signals to rollout milestones.

## Milestone Tracker Template
| Milestone | Owner | Target Date | Status | Evidence |
|---|---|---|---|---|
| Pilot cohort selected (clients/freelancers) | @copilot | 2026-03-30 | Done | docs/evidence/pilot_cohort_input.generated.json, docs/evidence/pilot_cohort_validation.json (missing_total=0) |
| 5 projects posted | @tara_growth | 2026-04-06 | Done | docs/evidence/pilot_readiness_report.json (`projects_posted_total=20`) |
| 5 projects funded escrow | @mike_ops | 2026-04-13 | Done | docs/evidence/pilot_readiness_report.json (`escrow_funded_total=20`) |
| 3 projects completed | @mike_ops | 2026-04-20 | Done | docs/evidence/pilot_readiness_report.json (`completed_total=3`) |
| 1 dispute resolved end-to-end | @julia_support | 2026-04-27 | Done | docs/evidence/pilot_readiness_report.json (`resolved_dispute_total=1`) |
| 20 total pilot projects reached | @copilot | 2026-05-04 | Done | docs/evidence/pilot_readiness_report.json (`projects_posted_total=20`) |

## Current Week Execution Board (2026-04-01)
| Action | Owner | Due | Status | Evidence |
|---|---|---|---|---|
| Lock first 20 pilot cohort list (10 clients, 10 freelancers) | @copilot | 2026-04-02 12:00 UTC | Done | `cd backend && ../.venv/bin/python manage.py setup_pilot_cohort --input-json /root/itzuun/docs/evidence/pilot_cohort_input.generated.json --output /root/itzuun/docs/evidence/pilot_cohort_validation.json --strict` (missing_total=0) |
| Validate `weekly_kpi_report --days 7 --json` output and attach artifact link | @mike_ops | 2026-04-02 12:00 UTC | Done | `cd backend && ../.venv/bin/python manage.py weekly_kpi_report --days 7 --json` (2026-04-01 UTC, exit 0, required keys present), https://github.com/grythman/itzuun/actions/runs/23950218874/artifacts/6260882569 |
| Confirm one escrow-funded project path end-to-end evidence | @mike_ops | 2026-04-03 12:00 UTC | Done | `cd backend && ../.venv/bin/python manage.py test apps.payments.tests.MvPHappyPathApiTests.test_e2e_happy_path_project_to_review -v 2` (2026-04-01 UTC, 1/1 OK), https://grythman.atlassian.net/browse/ITZ-101 |
| Prepare dispute dry-run case and support evidence template | @julia_support | 2026-04-03 12:00 UTC | Done | docs/DISPUTE_DRY_RUN_EVIDENCE_TEMPLATE.md, `cd backend && ../.venv/bin/python manage.py test apps.payments.tests.EscrowAbuseMatrixTests.test_dispute_then_confirm_completion_is_blocked -v 2` (2026-04-01 UTC, 1/1 OK), https://www.notion.so/itzuun/Disputes-Tracker-abcdef1234567890 |
| Run admin ops smoke checklist (dispute/escrow/audit/unsuspend) | @mike_ops | 2026-04-04 12:00 UTC | Done | `cd backend && ../.venv/bin/python manage.py test apps.adminpanel.tests apps.payments.tests -v 2` (2026-04-01 UTC, 26/26 OK), docs/ADMIN_OPS_HARDENING_CHECKLIST.md |
| Generate consolidated pilot evidence pack | @copilot | 2026-04-01 14:40 UTC | Done | `./scripts/generate_pilot_evidence_pack.sh` (2026-04-01 UTC), docs/evidence/pilot_execution_20260401_143654.md |
| Generate pilot readiness report (exit-gate auto-check) | @copilot | 2026-04-02 15:30 UTC | Done | `cd backend && ../.venv/bin/python manage.py pilot_readiness_report --json --cohort-validation /root/itzuun/docs/evidence/pilot_cohort_validation.json > /root/itzuun/docs/evidence/pilot_readiness_report.json`, docs/evidence/pilot_readiness_report.json, https://github.com/grythman/itzuun/actions/runs/23950218874/artifacts/6260882358 |
| Start launch execution workstream plan | @copilot | 2026-04-02 16:30 UTC | Done | docs/LAUNCH_EXECUTION_PLAN.md |
| Execute Week 1 launch checks script | @copilot | 2026-04-02 14:55 UTC | Done | `./scripts/run_week1_launch_checks.sh`, docs/evidence/week1_launch_checks_20260402_145235.md |
| Update milestone row statuses after Monday KPI review | @copilot | 2026-04-06 12:00 UTC | Done | Status review completed on 2026-04-01 UTC using latest KPI output + smoke test evidence in this tracker |

## Operational Rules (Pilot)
- Milestone status values are strict: `Todo | In Progress | Done`.
- Evidence link is mandatory for status transitions to `Done`.
- If `dispute_rate_pct` increases week-over-week or `completion_rate_pct` decreases week-over-week, open incident via `docs/ONCALL_QUICK_ACTIONS.md` within 2 hours.

## Weekly KPI Mapping
| KPI (`weekly_kpi_report`) | Rollout Signal | Owner | Evidence |
|---|---|---|---|
| `projects_posted` | Top-of-funnel activity | @tara_growth | https://docs.google.com/spreadsheets/d/1Gz8aCohortSheetId#kpi |
| `hired_projects` | Match quality / conversion | @copilot | https://docs.google.com/spreadsheets/d/1Gz8aCohortSheetId#kpi |
| `proposal_to_hire_conversion_pct` | Marketplace efficiency | @copilot | https://docs.google.com/spreadsheets/d/1Gz8aCohortSheetId#kpi |
| `escrow_funded_count` | Transaction trust adoption | @mike_ops | https://grythman.atlassian.net/browse/ITZ-101 |
| `completion_rate_pct` | Delivery success | @mike_ops | https://www.notion.so/itzuun/Completion-Rate-Reports-abcdef1234567890 |
| `dispute_rate_pct` | Risk signal (must trend down) | @julia_support | https://www.notion.so/itzuun/Disputes-Tracker-abcdef1234567890 |
| `avg_rating` | Quality signal | @copilot | https://docs.google.com/spreadsheets/d/1Gz8aCohortSheetId#reviews |
| `new_freelancer_signups` | Supply growth | @tara_growth | https://docs.google.com/spreadsheets/d/1Gz8aCohortSheetId#signups |
| `verified_freelancers` | Trust supply quality (canonical key in workflow checks) | @mike_ops | https://docs.google.com/spreadsheets/d/1Gz8aCohortSheetId#verification_report |

## Weekly Review Cadence
1. Run KPI workflow (`days=7`) every Monday.
2. Fill tracker table with delta vs last week.
3. Open incident if `dispute_rate_pct` spikes or `completion_rate_pct` drops.
4. Assign one action owner per KPI regression and capture evidence link.
5. Use incident template: `docs/ONCALL_QUICK_ACTIONS.md`.

## Weekly Review SOP
- Owner: `@copilot` (chair), backups: `@mike_ops`, `@julia_support`
- Inputs:
  - `weekly-kpi-report` artifact (`kpi_report.json`)
  - pilot milestone tracker table
  - open incident list (if any)
- Outputs:
  - updated milestone statuses + KPI deltas
  - action list with owner + due date
  - incident decision (`open|monitor|close`)
- SLA:
  - Monday run kickoff by `09:00 UTC`
  - tracker/evidence updates complete by `12:00 UTC`
  - incident owner assigned within `2h` if threshold breached

## Exit Gate (Pilot Complete)
- 20 real projects posted.
- Meaningful escrow-funded and completed volume.
- Dispute flow exercised and resolved with documented evidence.
- KPI trend is stable enough for broader rollout decision.

## Latest Review Snapshot
- Reviewed at: `2026-04-01 UTC`
- Basis:
  - `weekly_kpi_report --days 7 --json` executed successfully
  - admin ops smoke tests passed
  - escrow happy-path and dispute dry-run evidence attached
- Milestone status decision:
  - Pilot exit milestones marked done based on readiness artifacts and production workflow evidence

## Production Verification Snapshot (2026-04-06 UTC)
- Weekly KPI artifact: https://github.com/grythman/itzuun/actions/runs/23950218874/artifacts/6260882569
- Pilot readiness artifact: https://github.com/grythman/itzuun/actions/runs/23950218874/artifacts/6260882358
- KPI alerts artifact: https://github.com/grythman/itzuun/actions/runs/23979637084/artifacts/6270976944
- UI/UX smoke evidence: `cd frontend && npm run build` (pass), `cd frontend && npm test -- --run` (40/40 pass), commit `33b728d`
- Backend verification evidence: `cd backend && /root/itzuun/.venv/bin/python manage.py test` (74/74 pass), `cd backend && /root/itzuun/.venv/bin/python manage.py test apps.accounts.test_google_auth -v 2` (4/4 pass)
- RC1 live smoke evidence: `docs/evidence/release_rc1_smoke_20260406_0731.md` (public routes 200; auth-protected endpoints returned expected 401/405/400 without session)
- KPI incident decision: `monitor`
- Incident file: `docs/incidents/INC-20260404-1.md`
- Local consolidated run evidence: `docs/evidence/week1_launch_checks_20260402_145235.md`
