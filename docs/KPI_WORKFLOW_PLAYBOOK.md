# KPI Workflow Verify & Triage Playbook

## Scope
- Workflow: `.github/workflows/kpi-weekly.yml`
- Job: `kpi-report`
- Outputs: `kpi_report.json`, artifact `weekly-kpi-report`, optional Slack message

## End-to-End Verify Checklist
1. GitHub `Settings -> Secrets and variables -> Actions`:
- Required: `SERVER_HOST`, `SERVER_USER`, `SERVER_KEY`
- Optional: `SLACK_WEBHOOK_URL`
2. Open `Actions -> Weekly KPI Report -> Run workflow`
3. Input `days=1` (smoke) or `days=7` (normal), click `Run workflow`
4. Validate run steps:
- `Prepare SSH key` = success
- `Generate KPI report on production server` = success
- `Validate JSON report` = success
- `Upload KPI artifact` = success
5. Open artifact `weekly-kpi-report`, confirm JSON exists
6. Check logs for `Print KPI summary` lines (`window_days`, `since`, KPI keys)
7. If `SLACK_WEBHOOK_URL` exists, confirm Slack notification delivered

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
