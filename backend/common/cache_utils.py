"""Cache key and invalidation helpers for read scalability."""
import hashlib
import json

from django.core.cache import cache


PROJECT_VERSION_PREFIX = "project:version"
USER_PUBLIC_VERSION_PREFIX = "user_public:version"
ADMIN_RESOURCE_VERSION_PREFIX = "admin:resource:version"


def _stable_query_fingerprint(query_params) -> str:
    normalized: dict[str, list[str]] = {}
    for key, values in query_params.lists():
        normalized[key] = sorted(values)
    payload = json.dumps(normalized, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def project_list_cache_key(query_params) -> str:
    return f"projects:list:{_stable_query_fingerprint(query_params)}"


def project_detail_cache_key(project_id: int) -> str:
    version = cache.get(f"{PROJECT_VERSION_PREFIX}:{project_id}") or 1
    return f"projects:detail:{project_id}:v{version}"


def bump_project_version(project_id: int) -> None:
    version_key = f"{PROJECT_VERSION_PREFIX}:{project_id}"
    try:
        cache.incr(version_key)
    except ValueError:
        cache.set(version_key, 2, timeout=None)


def rating_summary_cache_key(user_id: int) -> str:
    version = cache.get(f"{USER_PUBLIC_VERSION_PREFIX}:{user_id}") or 1
    return f"reviews:summary:{user_id}:v{version}"


def user_reviews_cache_key(user_id: int, query_params) -> str:
    version = cache.get(f"{USER_PUBLIC_VERSION_PREFIX}:{user_id}") or 1
    return f"reviews:list:{user_id}:v{version}:{_stable_query_fingerprint(query_params)}"


def profile_cache_key(user_id: int) -> str:
    version = cache.get(f"{USER_PUBLIC_VERSION_PREFIX}:{user_id}") or 1
    return f"profiles:detail:{user_id}:v{version}"


def bump_user_public_version(user_id: int) -> None:
    version_key = f"{USER_PUBLIC_VERSION_PREFIX}:{user_id}"
    try:
        cache.incr(version_key)
    except ValueError:
        cache.set(version_key, 2, timeout=None)


def admin_list_cache_key(resource: str, query_params) -> str:
    version = cache.get(f"{ADMIN_RESOURCE_VERSION_PREFIX}:{resource}") or 1
    return f"admin:list:{resource}:v{version}:{_stable_query_fingerprint(query_params)}"


def admin_detail_cache_key(resource: str) -> str:
    version = cache.get(f"{ADMIN_RESOURCE_VERSION_PREFIX}:{resource}") or 1
    return f"admin:detail:{resource}:v{version}"


def bump_admin_resource_version(resource: str) -> None:
    version_key = f"{ADMIN_RESOURCE_VERSION_PREFIX}:{resource}"
    try:
        cache.incr(version_key)
    except ValueError:
        cache.set(version_key, 2, timeout=None)
