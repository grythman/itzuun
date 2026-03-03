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

## Quick Start (Backend)
1. Install dependencies:
   - `cd backend`
   - `pip install -r requirements.txt`
2. Configure `.env` for PostgreSQL.
3. Run migrations:
   - `python manage.py migrate`
4. Start server:
   - `python manage.py runserver`
