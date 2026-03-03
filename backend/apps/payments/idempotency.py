"""Idempotency helpers for financial endpoints."""
import hashlib
import json

from django.db import IntegrityError

from common.exceptions import DomainError

from .models import IdempotencyKey


def _hash_response(payload) -> str:
    raw = json.dumps(payload, sort_keys=True, default=str).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def execute_idempotent(request, endpoint: str, actor, executor):
    key = request.headers.get("Idempotency-Key")
    if not key:
        raise DomainError("Idempotency-Key header is required.")

    existing = IdempotencyKey.objects.filter(actor=actor, endpoint=endpoint, key=key).first()
    if existing:
        return existing.response_body, existing.status_code

    response_body, status_code = executor()
    response_hash = _hash_response(response_body)
    try:
        IdempotencyKey.objects.create(
            actor=actor,
            endpoint=endpoint,
            key=key,
            response_hash=response_hash,
            response_body=response_body,
            status_code=status_code,
        )
    except IntegrityError:
        replay = IdempotencyKey.objects.get(actor=actor, endpoint=endpoint, key=key)
        return replay.response_body, replay.status_code

    return response_body, status_code
