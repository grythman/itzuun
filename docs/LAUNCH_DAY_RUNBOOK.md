# Launch Day Runbook

## Objective
- Execute release-day rollout safely for ITZuun production.
- Keep rollback path ready at every checkpoint.

## Owners
- Release lead: `@copilot`
- Ops lead: `@mike_ops`
- Support lead: `@julia_support`
- Product comms: `@tara_growth`

## Launch Window
- Start: `09:00 UTC`
- Freeze complete: `09:15 UTC`
- Deploy + verification complete target: `11:00 UTC`
- Incident readiness window: `11:00-15:00 UTC`

## Preconditions (T-60 to T-15)
1. Confirm target commit/tag is final (no pending hotfix PR).
2. Confirm required evidence docs exist:
- `docs/PILOT_ROLLOUT_TRACKER.md`
- `docs/RELEASE_RC1_SMOKE_CHECKLIST.md`
- `docs/RELEASE_NOTES_RC1.md`
3. Confirm secrets/envs are present on server.
4. Confirm DB backup recency (`<24h`) and restore procedure owner.

## Rollout Steps (T-15 to T+30)
1. Pull latest code:
```bash
cd /root/itzuun
git fetch --all --tags
git checkout main
git pull origin main
git rev-parse --short HEAD
```
2. Rebuild and start services:
```bash
docker compose -f docker-compose.prod.yml up -d --build api web
docker compose -f docker-compose.prod.yml restart nginx
```
3. Verify service status:
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail 100 nginx
```

## Production Smoke Verification (T+30 to T+60)
1. Public route checks:
```bash
BASE=https://itzuun.works
for p in / /auth/login /client /freelancer /projects /projects/new; do
  curl -L -s -o /dev/null -w "$p -> %{http_code}\\n" "$BASE$p"
done
```
2. Admin endpoint checks (auth required expected):
```bash
curl -s -o /dev/null -w "users(no slash): %{http_code}\\n" https://itzuun.works/api/v1/admin/users
curl -s -o /dev/null -w "users(with slash): %{http_code}\\n" https://itzuun.works/api/v1/admin/users/
```
3. Credentialed admin checks:
- Unsuspend one suspended user from frontend admin.
- Confirm `unsuspend` row in `audit-logs` (`entity_type=user`).

## Monitoring (T+60 to T+240)
1. Watch application logs:
```bash
docker compose -f docker-compose.prod.yml logs api --tail 200
docker compose -f docker-compose.prod.yml logs web --tail 200
```
2. Run KPI quick check:
```bash
cd /root/itzuun/backend
/root/itzuun/.venv/bin/python manage.py weekly_kpi_report --days 1 --json
```
3. If `dispute_rate_pct` spikes or `completion_rate_pct` drops, open/maintain incident via `docs/ONCALL_QUICK_ACTIONS.md`.

## Rollback Procedure (Any Critical Failure)
1. Stop rollout and announce incident.
2. Revert to previous known-good commit/tag:
```bash
cd /root/itzuun
git checkout <previous-good-tag-or-sha>
docker compose -f docker-compose.prod.yml up -d --build api web
docker compose -f docker-compose.prod.yml restart nginx
```
3. Re-run minimal smoke checks and update incident status.

## Evidence & Closeout
1. Add run artifacts/links to `docs/PILOT_ROLLOUT_TRACKER.md`.
2. Update incident decision (`open|monitor|close`).
3. Publish final launch note with:
- deployed commit/tag
- smoke summary
- KPI quick status
- known follow-ups + owners
