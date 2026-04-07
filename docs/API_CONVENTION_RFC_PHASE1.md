# API Convention RFC (Phase 1 Freeze)

Status: Proposed  
Owner: Backend + Frontend leads  
Target freeze window: 2026-04-08 to 2026-04-22

## Scope
- Normalize API route conventions across Django apps.
- Reduce frontend endpoint branching and alias complexity.
- Introduce a single error envelope contract.
- Keep backward compatibility during migration window.

## Decisions (Freeze)
1. Base prefix is fixed to `/api/v1/`.
2. Resource routes use `path()`-style segments where possible.
3. Canonical routes use trailing slash.
4. Legacy aliases stay temporarily and return a deprecation header.
5. Auth surface is canonicalized under:
- `/api/v1/accounts/auth/*`
- `/api/v1/accounts/users/*`
6. Admin surface is canonicalized under:
- `/api/v1/admin/*`
7. Project domain surface is canonicalized under:
- `/api/v1/projects/*`
- `/api/v1/proposals/*`
- `/api/v1/escrow/*`

## Error Envelope Contract
All non-2xx JSON errors should converge to:

```json
{
  "code": "domain_or_validation_error",
  "message": "Human readable summary",
  "details": {},
  "correlation_id": "uuid-or-request-id"
}
```

Notes:
- `code` is machine-consumable and stable.
- `message` is UI-safe default text.
- `details` carries field errors or domain context.
- `correlation_id` maps to request log line.

## Backward Compatibility Policy
- Legacy routes remain available for 2 releases.
- Response headers for legacy endpoints:
- `X-API-Deprecated: true`
- `X-API-Replacement: <canonical-route>`
- Deprecation removal checklist must be tied to:
- frontend migration completion
- contract tests green

## Migration Checklist
1. Create canonical route map and legacy alias map.
2. Add tests for canonical + alias parity on status and payload shape.
3. Update frontend endpoint constants to canonical paths.
4. Remove direct hardcoded paths outside `frontend/lib/api/endpoints.ts`.
5. Add schema-level tests for error envelope.
6. Remove aliases only after parity and release sign-off.

## Acceptance Criteria
- No new endpoint is merged outside the freeze convention.
- API compatibility matrix is complete and reviewed.
- CI blocks on route-contract test failures.
- Frontend uses canonical paths for critical flows:
- auth
- project/proposal
- escrow/payment
- admin moderation
