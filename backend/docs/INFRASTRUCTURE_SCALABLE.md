# ITZuun Scalable Infrastructure Diagram (Production)

This document defines the target production architecture for 10k registered users and ~1k concurrent sessions with active bidding, escrow, and chat.

## High-Level Topology

```mermaid
flowchart LR
    U[Users Web/Mobile] --> CDN[CDN + WAF]
    CDN --> NGINX[Nginx Ingress / Reverse Proxy]
    NGINX --> APP1[Gunicorn/Django App 1]
    NGINX --> APP2[Gunicorn/Django App 2]
    NGINX --> APP3[Gunicorn/Django App N]

    APP1 --> REDIS[(Redis)]
    APP2 --> REDIS
    APP3 --> REDIS

    APP1 --> PGPRI[(PostgreSQL Primary)]
    APP2 --> PGPRI
    APP3 --> PGPRI

    APP1 -. read .-> PGREP[(PostgreSQL Read Replica)]
    APP2 -. read .-> PGREP
    APP3 -. read .-> PGREP

    APP1 --> S3[(S3/R2 Object Storage)]
    APP2 --> S3
    APP3 --> S3

    APP1 --> CELERY[Celery Workers]
    APP2 --> CELERY
    CELERY --> REDIS
    CELERY --> PGPRI

    WS[ASGI + Channels] --> REDIS
    NGINX --> WS
    WS --> PGPRI

    APP1 --> OBS[Prometheus + Grafana + Sentry]
    APP2 --> OBS
    APP3 --> OBS
    WS --> OBS
    CELERY --> OBS
```

## Request Flow (Read-heavy endpoints)

1. Client request lands on CDN/WAF.
2. Nginx routes traffic to one of Django app instances.
3. App checks Redis cache first (list/detail/summary keys).
4. Cache miss reads from Postgres (prefer read replica for read-only endpoints).
5. Response is cached with TTL + versioned cache key.

## Request Flow (Financial mutation endpoints)

1. Request hits API with `Idempotency-Key`.
2. API validates idempotency record and actor scope.
3. Transaction is executed in Postgres primary with row locks.
4. Immutable financial audit record is written.
5. Related cache keys are invalidated.

## Chat Flow (Realtime)

1. Client opens WebSocket via Nginx to ASGI/Channels.
2. Message is published through Redis pub/sub.
3. Message is persisted to Postgres as storage of record.
4. Subscribers receive pushed message without polling DB.

## Storage & Media

- App stores only object keys/metadata in DB.
- Clients upload via pre-signed URL directly to S3-compatible storage.
- CDN serves static/media for low origin bandwidth and high cache hit.

## Baseline Scale Targets

- 10k+ registered users (DB row scale)
- 1k concurrent sessions (horizontal app scale + Redis cache)
- 100+ active escrow operations (transaction isolation + idempotency)
- Realtime chat traffic handled by Redis transport, not DB polling
