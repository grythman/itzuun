# ITZuun

Монгол дотоодын IT freelance marketplace MVP backend (Django + DRF).

## Current Status

### MVP Scope Implemented

- OTP auth flow (request/verify) with JWT-based sessions.
- Role-aware platform flow for `client`, `freelancer`, `admin`.
- Project/proposal core lifecycle.
- Escrow + dispute operations with admin controls.
- Main web UI + Admin dashboard UI (Django templates/static JS).

### Security & Auth

- Auth is HttpOnly cookie-based JWT.
- Cookie refresh and logout endpoints are in place.
- Admin dashboard access is enforced on backend by role check.
- Public read access is available for project browsing endpoints.

### Web UI Auth Responses

- Browser request to `/dashboard/admin` without valid admin auth redirects to `/`.
- JSON/AJAX request to `/dashboard/admin` returns `401` when unauthenticated.
- JSON/AJAX request to `/dashboard/admin` returns `403` when authenticated but non-admin.

### UX State

- Session expiry supports silent refresh retry on `401`.
- Refresh failure fallback is handled for both main/admin flows.
- Shared top banner system supports `info`, `success`, `warn` states.
- Dismiss button and auto-hide progress indicator are implemented.
- Accessibility baseline includes `role="status"`, `aria-live="polite"`, focus-visible close button, and reduced-motion fallback.

### Documentation

- Product and delivery docs: [backend/docs/PRD_MVP_ITZUUN.md](backend/docs/PRD_MVP_ITZUUN.md)
- API contract: [backend/docs/API_CONTRACT_MVP.md](backend/docs/API_CONTRACT_MVP.md)
- DB schema: [backend/docs/DB_SCHEMA_MVP.md](backend/docs/DB_SCHEMA_MVP.md)
- User flow: [backend/docs/USER_FLOW_MVP.md](backend/docs/USER_FLOW_MVP.md)
- Roadmap: [backend/docs/ROADMAP_30_60_90.md](backend/docs/ROADMAP_30_60_90.md)
- Monetization: [backend/docs/MONETIZATION_MODEL.md](backend/docs/MONETIZATION_MODEL.md)
- Changelog: [backend/docs/CHANGELOG_MVP.md](backend/docs/CHANGELOG_MVP.md)
- Scalable infra diagram: [backend/docs/INFRASTRUCTURE_SCALABLE.md](backend/docs/INFRASTRUCTURE_SCALABLE.md)
- Redis caching blueprint: [backend/docs/REDIS_CACHING_BLUEPRINT.md](backend/docs/REDIS_CACHING_BLUEPRINT.md)
- Production deployment checklist: [backend/docs/DEPLOYMENT_CHECKLIST_PROD.md](backend/docs/DEPLOYMENT_CHECKLIST_PROD.md)

## API Summary

Base URL: `/api/v1`

### Auth

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/auth/request-otp` | OTP token үүсгэх |
| POST | `/auth/verify-otp` | OTP баталгаажуулах, auth cookie set |
| POST | `/auth/refresh` | Access cookie refresh |
| POST | `/auth/logout` | Auth cookie clear |
| GET | `/auth/me` | Одоогийн хэрэглэгч |
| PATCH | `/auth/me` | Role шинэчлэх (`client`/`freelancer`) |

### Projects & Proposals

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/projects` | Project жагсаалт (public read) |
| POST | `/projects` | Client project үүсгэх |
| GET | `/projects/{id}` | Project дэлгэрэнгүй |
| PATCH | `/projects/{id}` | Owner project засах (`open` үед) |
| POST | `/projects/{id}/close` | Project хаах |
| POST | `/projects/{id}/select-freelancer` | Proposal сонгох |
| GET | `/projects/{id}/proposals` | Proposal жагсаалт |
| POST | `/projects/{id}/proposals` | Freelancer proposal илгээх |

### Escrow, Messaging, Reviews

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/projects/{id}/escrow/deposit` | Escrow санхүүжүүлэх (proposal price-тэй автоматаар таарна) |
| POST | `/escrow/{id}/admin/approve` | Admin escrow approve |
| POST | `/projects/{id}/deliverables` | Freelancer deliverable бүртгэх (`file_id`, `checksum`) |
| POST | `/projects/{id}/submit-result` | Freelancer result submit |
| POST | `/projects/{id}/confirm-completion` | Client completion confirm |
| POST | `/projects/{id}/dispute` | Dispute үүсгэх |
| GET/POST | `/projects/{id}/messages` | Chat list / message send |
| POST | `/projects/{id}/files` | File upload |
| POST | `/projects/{id}/reviews` | Review үлдээх |

### Admin

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/admin/users` | User жагсаалт |
| POST | `/admin/users/{id}/verify` | User verify хийх |
| GET | `/admin/projects` | Project хяналт |
| GET | `/admin/escrow` | Escrow жагсаалт |
| GET | `/admin/disputes` | Dispute жагсаалт |
| POST | `/admin/disputes/{id}/resolve` | Dispute шийдвэрлэх |
| PATCH | `/admin/settings/commission` | Commission шинэчлэх |
| GET | `/admin/settings/commission/detail` | Commission утга харах |

### Financial Safety Rules

- Money mutation endpoint-үүд `Idempotency-Key` header шаардана:
      - `/projects/{id}/escrow/deposit`
      - `/escrow/{id}/admin/approve`
      - `/projects/{id}/confirm-completion`
      - `/admin/disputes/{id}/resolve`
      - `/admin/settings/commission`
- `submit-result` хийхээс өмнө хамгийн багадаа 1 deliverable заавал бүртгэгдсэн байна.
- Client commission override устсан; payout fee нь server policy-аас тооцогдоно.

### Read Scalability Baseline

- Global pagination policy идэвхтэй (`PageNumberPagination`, `PAGE_SIZE=20`).
- List endpoint-үүд deterministic `order_by("-created_at")` ашиглана.
- Hot-query index-ууд `projects`, `proposals`, `escrow`, `dispute` дээр нэмэгдсэн.
- `REDIS_URL` тохируулсан үед cache backend автоматаар Redis рүү шилжинэ (`django-redis`).
- `GET /projects` болон `GET /projects/{id}` endpoint-үүд cache-тай (list TTL 60s, detail versioned key).
- `GET /users/{id}/rating-summary`, `GET /users/{id}/reviews`, `GET /profiles/{user_id}`, `GET /profiles/me` endpoint-үүд user-versioned cache ашиглана.
- Admin list endpoint-үүд (`/admin/users`, `/admin/projects`, `/admin/escrow`, `/admin/disputes`) versioned list cache ашиглана.
- Cache invalidation нь write path дээр version bump-аар хийгддэг тул stale цонх TTL-ээс хамаарал багатай.

### CI Pipeline

- Canonical CI/CD gate checklist: [backend/docs/DEPLOYMENT_CHECKLIST_PROD.md](backend/docs/DEPLOYMENT_CHECKLIST_PROD.md)
- Workflow definition: [.github/workflows/backend-tests.yml](.github/workflows/backend-tests.yml)
- Team-based CODEOWNERS migration template: [backend/docs/CODEOWNERS_TEAM_TEMPLATE.md](backend/docs/CODEOWNERS_TEAM_TEMPLATE.md)

## Quick Start (Backend)

1. Install dependencies:
   - `cd backend`
   - `pip install -r requirements.txt`
2. Configure `.env` for PostgreSQL.
3. Run migrations:
   - `python manage.py migrate`
4. Start server:
   - `python manage.py runserver`
