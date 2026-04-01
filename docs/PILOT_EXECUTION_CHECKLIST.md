# Pilot Execution Checklist (First 20 Projects)

## Purpose
- Keep Day 61-90 pilot rollout execution consistent across ops and product owners.
- Provide one short checklist that can be run weekly without planner/orchestrator dependency.

## Weekly Cycle (Monday UTC)
1. Trigger KPI workflow (`days=7`) and confirm success.
2. Download `weekly-kpi-report` artifact and record key deltas.
3. Update milestone statuses in `docs/PILOT_ROLLOUT_TRACKER.md`.
4. Open/monitor/close incident decision based on KPI thresholds.
5. Assign exactly one owner and one due date for each regression.

## Required KPI Keys
- `projects_posted`
- `hired_projects`
- `proposal_to_hire_conversion_pct`
- `escrow_funded_count`
- `completion_rate_pct`
- `dispute_rate_pct`
- `avg_rating`
- `new_freelancer_signups`
- `verified_freelancers`

## Exit Gate Verification
1. Confirm 20 real projects posted (evidence link required).
2. Confirm escrow-funded and completed project volume is non-zero and stable.
3. Confirm at least one dispute was resolved end-to-end with written evidence.
4. Confirm KPI trend is stable enough for broader rollout recommendation.

## Quick Commands
```bash
cd /root/itzuun/backend
python manage.py weekly_kpi_report --days 7 --json
```

```bash
cd /root/itzuun
python3 -u orchestrator.py
```
