# On-call Quick Actions

Quick commands and escalation steps for first responders.

Immediate checks
- Check services status:
  - `docker compose -f docker-compose.prod.yml ps`
  - `docker compose -f docker-compose.prod.yml logs nginx --tail 200`
  - `docker compose -f docker-compose.prod.yml logs api --tail 200`
  - `docker compose -f docker-compose.prod.yml logs web --tail 200`

- Health endpoints:
  - `curl -fsS https://itzuun.works/ || true`
  - `curl -fsS http://127.0.0.1:8000/healthz || true`

Process-level checks
- Resource usage: `docker stats --no-stream` and `free -h` / `df -h`
- Check DB: `docker exec -it itzuun-db-1 pg_isready -U ${POSTGRES_USER}` and `psql` for active connections
- Redis: `redis-cli -h redis ping` and `info` for latency

Quick remediation (safe-first)
1. Reload nginx to refresh DNS/upstream: `docker compose -f docker-compose.prod.yml exec nginx nginx -s reload`
2. Restart a single service to recover (non-destructive):
   - `docker compose -f docker-compose.prod.yml restart api`
   - `docker compose -f docker-compose.prod.yml restart web`
3. If memory pressure, scale down worker count or restart container.
4. To roll back to previous image tag (if using tags):
   - `docker pull itzuun-api:<previous-tag>`
   - Update `docker-compose.prod.yml` to pin tag and `docker compose -f docker-compose.prod.yml up -d --no-deps api`

Escalation
- If recovery fails within 15-30 minutes:
  - Notify on-call lead and create incident in the tracker with `Incident: <short summary>`
  - Add logs link, affected services, and reproduce steps.

Contacts
- On-call Slack: `#oncall-itzuun`
- Pager: primary on-call (see rota)

Keep this file short; link to `backend/docs/DEPLOYMENT_CHECKLIST_PROD.md` for full runbook.

---

## KPI Regression Incident Template

### 1) Incident Header
- Incident ID: `INC-YYYYMMDD-<n>`
- Date/Time (UTC):
- Detected by: `weekly_kpi_report` / dashboard / manual
- Owner:
- Severity: `sev2|sev3`

### 2) Trigger
- KPI affected: `completion_rate_pct|dispute_rate_pct|proposal_to_hire_conversion_pct|...`
- Current value:
- Baseline (last 4 weeks avg):
- Delta (%):
- Threshold breached:

### 3) Impact
- Affected cohort/project IDs:
- User impact summary:
- Revenue/escrow impact:

### 4) Immediate Actions (0-4h)
1. Validate data correctness from KPI artifact + DB spot-check.
2. Identify top 3 causal segments (role, category, project stage).
3. Apply mitigation owner + ETA (ops/product/support split).
4. Post status update in incident tracker.

### 5) Root Cause + Corrective Actions (24-72h)
- Root cause hypothesis:
- Confirmed cause:
- Corrective action(s):
- Owner per action:
- Due date:

### 6) Exit Criteria
- KPI returns within threshold for 2 consecutive weekly runs.
- Evidence links attached (artifact, query, decision note).
- Postmortem status: `closed`.

### 7) Evidence Bundle Format (Audit)
- `bundle_id`: `KPI-YYYYMMDD-weekNN`
- `incident_id`: `INC-YYYYMMDD-<n>` or `none`
- `artifact_link`: GitHub Actions artifact URL
- `tracker_link`: pilot tracker row/cell URL
- `query_or_log_link`: DB query gist or log permalink
- `decision_note`: 3-5 lines (what changed, why, owner, due date)
- `approver`: reviewer handle + approval timestamp (UTC)
