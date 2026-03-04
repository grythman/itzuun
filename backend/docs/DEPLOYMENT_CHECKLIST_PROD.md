# Production Deployment Checklist (Docker + Nginx + Gunicorn)

## 0. Target Topology

- `nginx` (TLS termination + reverse proxy)
- `django-api` (Gunicorn workers)
- `postgres` (managed or dedicated)
- `redis` (cache/session/throttle/pubsub)
- Optional: `celery-worker`, `celery-beat`

## 1. Docker Image Checklist

- [ ] Multi-stage build used (small runtime image).
- [ ] Non-root user in final image.
- [ ] `PYTHONDONTWRITEBYTECODE=1`, `PYTHONUNBUFFERED=1`.
- [ ] Healthcheck endpoint enabled (`/healthz`).
- [ ] Static files collected during build/release step.

## 2. Django Runtime Checklist

- [ ] `DJANGO_DEBUG=0`
- [ ] Strong `DJANGO_SECRET_KEY`
- [ ] `DJANGO_ALLOWED_HOSTS` and `DJANGO_CSRF_TRUSTED_ORIGINS` configured.
- [ ] Redis configured via `REDIS_URL`.
- [ ] DB pooling enabled (`DB_CONN_MAX_AGE=60` or higher after validation).
- [ ] HTTPS and secure cookies enabled behind proxy.
- [ ] Migrations run on deploy before app traffic switch.

## 3. Gunicorn Tuning Baseline

Start point (4 vCPU node):

- Workers: `2 * CPU + 1` => `9`
- Worker class: `gthread`
- Threads per worker: `2-4`
- Timeout: `60`
- Keepalive: `5`
- Max requests: `2000`
- Max requests jitter: `200`

Example command:

`gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 9 --worker-class gthread --threads 3 --timeout 60 --keep-alive 5 --max-requests 2000 --max-requests-jitter 200 --access-logfile - --error-logfile -`

## 4. Nginx Checklist

- [ ] HTTP/2 + TLS1.2+ enabled.
- [ ] Upstream keepalive enabled.
- [ ] Gzip/Brotli enabled for text assets.
- [ ] Static/media cached with proper headers.
- [ ] Request body size limit set for upload endpoints.
- [ ] WebSocket upgrade headers configured for chat endpoints.
- [ ] Proxy/read/send timeouts aligned with Gunicorn timeout.

Minimal upstream section:

```nginx
upstream django_upstream {
    server django-api:8000;
    keepalive 64;
}

server {
    listen 443 ssl http2;

    client_max_body_size 12m;

    location / {
        proxy_pass http://django_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        proxy_read_timeout 65s;
        proxy_send_timeout 65s;
    }

    location /ws/ {
        proxy_pass http://django_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 600s;
    }
}
```

## 5. Database Checklist

- [ ] Connection limits sized for total Gunicorn workers.
- [ ] Critical indexes migrated and verified.
- [ ] Slow query logging enabled (DB side).
- [ ] Automated backups + PITR tested.
- [ ] Read replica configured for heavy list/read endpoints.

## 6. Redis Checklist

- [ ] Dedicated Redis for production (not shared dev instance).
- [ ] Password/auth configured.
- [ ] `maxmemory` and eviction policy configured.
- [ ] Latency and eviction metrics monitored.

## 7. Observability & SLO Checklist

- [ ] Sentry integrated for API exceptions.
- [ ] Prometheus metrics exported (request latency, error rate, DB/Redis stats).
- [ ] Grafana dashboards for p95/p99 latency, QPS, error%, DB CPU, lock waits.
- [ ] Alert rules for 5xx spikes, high DB latency, Redis failures.

## 8. Release Procedure Checklist

- [ ] Build image and run security scan.
- [ ] Run tests + `manage.py check` + migrations dry-run.
- [ ] Deploy to staging and run smoke tests.
- [ ] Run blue/green or rolling deployment in production.
- [ ] Verify health checks and key business flows.
- [ ] Monitor error rate + latency for first 30-60 minutes.

## 8.5 CI/CD Gate Alignment

- [ ] GitHub Actions workflow (`.github/workflows/backend-tests.yml`) green болсон байна.
- [ ] `quality-checks` job: `check --fail-level WARNING` + `makemigrations --check --dry-run` pass.
- [ ] `payments-and-cache-smoke` job: `apps.payments.tests` pass.
- [ ] `main` branch дээр `check --deploy --fail-level WARNING` pass.

## 8.6 Release Ownership Matrix

| Gate / Task | Owner | Reviewer | Evidence |
| --- | --- | --- | --- |
| CI workflow green | Backend Engineer | Tech Lead | GitHub Actions run URL |
| Migration drift check | Backend Engineer | DBA / Tech Lead | `makemigrations --check --dry-run` output |
| Staging smoke tests | QA / Backend Engineer | Product / Tech Lead | Test report or checklist |
| Production deploy execution | DevOps / Backend Engineer | Tech Lead | Deploy log + release tag |
| Post-deploy health verification | On-call Engineer | Tech Lead | Dashboard screenshot + API smoke results |

Recommended process:

- [ ] PR description дээр дээрх 5 мөрийн `Owner/Reviewer/Evidence`-ийг бөглөсөн байна.
- [ ] Production deploy approval-оос өмнө Reviewer нь evidence-үүдийг шалгаж sign-off хийсэн байна.

## 9. Rollback Criteria

Rollback if any of these happen:

- Error rate > 2% for 5 minutes.
- p95 latency > 2x baseline for 10 minutes.
- Financial mutation endpoints returning unexpected 4xx/5xx spikes.
- Redis outage causing auth/session instability.

