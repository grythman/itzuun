# KPI Workflow Verify & Triage Playbook

## Scope
- Workflow: `.github/workflows/kpi-weekly.yml`
- Job: `kpi-report`
- Outputs: `kpi_report.json`, `pilot_readiness_report.json`, `kpi_alerts_report.json`, `kpi_run_summary.json`, `tracker_update_snippet.md`, artifacts `weekly-kpi-report` + `pilot-readiness-report` + `kpi-alerts-report` + `kpi-run-summary`, optional Slack message
- CI guardrail: `.github/workflows/itzuun-ci-vercel-render.yml` runs `workflow-lint` to catch YAML/workflow syntax issues before Vercel/Render auto-deploy proceeds from Git integration.
- KPI alert evaluator supports threshold profiles by `cohort_label` (`production` vs `synthetic`).

> **Deployment note:** this workflow is operational reporting only. Application deployment is handled by Vercel + Render Git auto-deploy; do not add VPS/SSH application deployment steps here. See `docs/DEPLOYMENT_WORKFLOW_AUDIT.md` for the current workflow decision.

## End-to-End Verify Checklist
1. GitHub `Settings -> Secrets and variables -> Actions`:
- Required while this legacy KPI collector still reaches production over SSH: `SERVER_HOST`, `SERVER_USER`, `SERVER_KEY`
- Optional: `SLACK_WEBHOOK_URL`
2. Open `Actions -> Weekly KPI Report -> Run workflow`
3. Input `days=1` (smoke) or `days=7` (normal), click `Run workflow`
4. Validate run steps:
- `Prepare SSH key` = success
- `Generate KPI report on production server` = success
- `Generate pilot readiness report on production server` = success
- `Validate JSON report and required KPI keys` = success
- `Validate pilot readiness JSON schema` = success
- `Upload KPI artifact` = success
- `Upload pilot readiness artifact` = success
 - `Evaluate KPI alert thresholds` = success
 - `Upload KPI alerts artifact` = success
 - `Build KPI run summary snippet` = success
 - `Upload KPI run summary artifact` = success
5. Open artifacts `weekly-kpi-report`, `pilot-readiness-report`, `kpi-alerts-report`, `kpi-run-summary`, confirm files exist
6. Check logs for `Print KPI summary`, `Print pilot readiness summary`, `Print KPI alerts summary`
7. If `SLACK_WEBHOOK_URL` exists, confirm Slack notification delivered (`pilot_ready` line included)

## KPI Schema Contract
- `cohort_label` top-level field is required (`production` in weekly workflow runs).
- Canonical verified freelancer key is `verified_freelancers`.
- Backward-compatibility alias `verified_freelancer_count` may still appear in payload during transition.
- Workflow enforces these required KPI keys in `payload.kpis`:
  - `projects_posted`
  - `hired_projects`
  - `proposal_to_hire_conversion_pct`
  - `escrow_funded_count`
  - `completion_rate_pct`
  - `dispute_rate_pct`
  - `avg_rating`
  - `new_freelancer_signups`
  - `verified_freelancers`

## Monday Run Checklist (Ops)
1. Trigger workflow manually with `days=7` (or confirm scheduled run succeeded).
2. Confirm run is green and download artifact `weekly-kpi-report`.
3. Update `docs/PILOT_ROLLOUT_TRACKER.md`:
- milestone status changes
- KPI delta vs previous week
- evidence links for changed rows
4. Review `pilot-readiness-report` artifact and note `ready` + `missing_gates`.
5. Review `kpi-alerts-report` artifact and follow `incident_decision`.
6. Copy `tracker_update_snippet.md` into `docs/PILOT_ROLLOUT_TRACKER.md` production snapshot section.
7. Incident decision:
- if thresholds breached, open KPI incident using `docs/ONCALL_QUICK_ACTIONS.md`
- else mark status as `monitor` and assign next check owner
8. Post review summary with owner, decisions, and due dates.

## Top 5 Failure Causes + Exact Fixes
1. SSH auth/host failure (`Permission denied`, `Host key verification failed`)
- Fix: rotate and re-save `SERVER_KEY`, verify `SERVER_HOST` + `SERVER_USER`, re-run workflow.

2. Remote command failure (`docker compose ...` or `manage.py` exit non-zero)
- Fix: SSH to server, run:
  - `cd /root/itzuun`
  - `docker compose -f docker-compose.prod.yml run --rm api python manage.py weekly_kpi_report --days 1 --json`
  - resolve app/runtime error from command output, then re-run workflow.

3. Invalid JSON (`Validate JSON report` fails)
- Fix: ensure command prints JSON only (no extra stdout noise), then re-run.

4. Artifact missing (`Upload KPI artifact` skipped/fails)
- Fix: ensure `kpi_report.json` is generated in runner workspace (previous steps green), then re-run.

5. Slack step fails (HTTP >= 300 / webhook error)
- Fix: update `SLACK_WEBHOOK_URL` secret, test webhook endpoint, re-run; keep workflow green by leaving secret unset if Slack is optional.

## Quick Triage Commands (on server)
```bash
cd /root/itzuun
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail 120 api
docker compose -f docker-compose.prod.yml run --rm api python manage.py weekly_kpi_report --days 1 --json
```
