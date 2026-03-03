# Redis Caching Strategy Blueprint

This blueprint defines cache policy for high-read, high-concurrency operations.

## Objectives

- Reduce Postgres read load for hot endpoints.
- Keep financial mutation paths strongly consistent.
- Use cache-aside with explicit invalidation.

## Redis Roles

- Primary cache backend for API reads.
- Session store (`SESSION_ENGINE=cache`).
- DRF throttle counters.
- Pub/Sub layer for realtime chat (Channels).

## Cache Policy

- Project list
  - Key: `projects:list:{filters_hash}:p{page}`
  - TTL: `30-60s`
  - Invalidate on: project create/update/status change/proposal select.
- Project detail
  - Key: `projects:detail:{project_id}:v{version}`
  - TTL: `60s`
  - Invalidate on: any project/proposal/escrow/dispute mutation affecting project.
- Proposal list
  - Key: `proposals:list:{project_id}:p{page}`
  - TTL: `30s`
  - Invalidate on: proposal create/update/withdraw/select.
- Profile public
  - Key: `profiles:public:{user_id}`
  - TTL: `300s`
  - Invalidate on: profile update.
- Rating summary
  - Key: `reviews:summary:{user_id}`
  - TTL: `300s`
  - Invalidate on: new review or review update.

## Key Design Rules

- Include paging and filter hash in list keys.
- Use version token (`v{n}`) for detail keys to avoid mass delete scans.
- Prefix all keys with environment/app tag (example: `itzuun:prod:`).
- Keep payload JSON-serializable and small.

## Invalidation Strategy

- Targeted key delete
  - Known keys (detail/summary) are deleted directly when entity changes.
- Version bump
  - Maintain a Redis version key per entity (`project:{id}:version`).
  - On mutation, increment version; new reads use new versioned key.
- Time-bound eventual consistency
  - List endpoints can rely on short TTL if full key map invalidation is costly.

## Django Integration Pattern

```python
from django.core.cache import cache


def get_project_detail_cached(project_id: int, builder):
    version_key = f"project:{project_id}:version"
    version = cache.get(version_key) or 1
    cache_key = f"projects:detail:{project_id}:v{version}"

    data = cache.get(cache_key)
    if data is not None:
        return data

    data = builder()
    cache.set(cache_key, data, timeout=60)
    return data


def invalidate_project_detail(project_id: int):
    version_key = f"project:{project_id}:version"
    try:
        cache.incr(version_key)
    except ValueError:
        cache.set(version_key, 2, timeout=None)
```

## Safety Rules

- Never cache mutable financial source-of-truth values as authoritative state.
- Escrow/dispute mutation endpoints must always read/write DB in transaction.
- Cache is optimization only; DB remains source of truth.

## Capacity and Ops Baseline

- Redis max memory policy: `allkeys-lru` (for non-critical cache tier).
- Enable persistence only if Redis also used for message/session durability needs.
- Monitor hit ratio, evictions/sec, used memory, keyspace misses, and command latency p95/p99.

## Rollout Plan

1. Enable Redis backend and throttle/session storage.
2. Add cache for project list and detail endpoints.
3. Add rating and profile caches.
4. Add key invalidation hooks on write services.
5. Track hit ratio and DB read QPS reduction.

