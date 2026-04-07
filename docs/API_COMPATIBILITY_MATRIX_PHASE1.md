# API Compatibility Matrix (Phase 1)

Purpose: map current route aliases to canonical targets and removal window.

## Auth and User
| Current Route | Canonical Route | Action |
|---|---|---|
| `/api/v1/auth/*` | `/api/v1/accounts/auth/*` | keep as alias (temporary) |
| `/api/v1/users/me/*` | `/api/v1/accounts/users/me/*` | keep as alias (temporary) |
| `/api/v1/accounts/users/me/*` | `/api/v1/accounts/users/me/*` | canonical |

## Projects and Proposals
| Current Route | Canonical Route | Action |
|---|---|---|
| `/api/v1/projects/{id}/proposals/` | `/api/v1/projects/{id}/proposals/` | canonical |
| `/api/v1/proposals/{id}/` | `/api/v1/proposals/{id}/` | canonical |
| `/api/v1/proposals/{id}/withdraw/` | `/api/v1/proposals/{id}/withdraw/` | canonical |

## Payments and Escrow
| Current Route | Canonical Route | Action |
|---|---|---|
| `/api/v1/payments/project/{id}/create/` | `/api/v1/payments/project/{id}/create/` | compatibility keep |
| `/api/v1/payments/project/{id}/status/` | `/api/v1/payments/project/{id}/status/` | compatibility keep |
| `/api/v1/projects/{id}/escrow/deposit/` | `/api/v1/projects/{id}/escrow/deposit/` | canonical domain route |
| `/api/v1/escrow/{id}/admin/approve/` | `/api/v1/escrow/{id}/admin/approve/` | canonical |

## Admin
| Current Route | Canonical Route | Action |
|---|---|---|
| `/api/v1/admin/users` | `/api/v1/admin/users` | canonical |
| `/api/v1/admin/projects` | `/api/v1/admin/projects` | canonical |
| `/api/v1/admin/disputes` | `/api/v1/admin/disputes` | canonical |
| `/api/v1/admin/escrow` | `/api/v1/admin/escrow` | canonical |
| `/api/v1/admin/payments` | `/api/v1/admin/payments` | canonical |

## Removal Gate
Alias removal is allowed only when all are true:
1. Frontend no longer calls the alias route.
2. Contract test suite validates canonical parity.
3. One full release cycle passes with zero alias traffic alerts.
