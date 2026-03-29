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
  - Notify on-call lead and create incident in the tracker with ``Incident: <short summary>``
  - Add logs link, affected services, and reproduce steps.

Contacts
- On-call Slack: `#oncall-itzuun`
- Pager: primary on-call (see rota)

Keep this file short; link to `backend/docs/DEPLOYMENT_CHECKLIST_PROD.md` for full runbook.
