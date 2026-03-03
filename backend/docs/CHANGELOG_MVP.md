# ITZuun MVP Changelog

## 2026-03-03

### Added
- Web UI scaffold for MVP in Django templates/static assets.
- Main page flow for OTP auth, project listing/selection, proposal actions, escrow actions, chat/file upload.
- Admin dashboard page for escrow approval and dispute resolution.
- Admin API list endpoints for escrow and disputes.

### Changed
- Authentication moved to HttpOnly cookie-based JWT flow.
- Added cookie refresh endpoint and logout endpoint.
- DRF authentication switched to cookie-capable JWT authentication class.
- Admin dashboard access restricted by backend role check using cookie token.
- Project read permissions opened for public browsing on list/detail endpoints.

### UX Improvements
- Session expiry handling with silent refresh retry on 401.
- On refresh failure, user is guided to re-auth flow (main) or redirected to main UI (admin).
- Reusable top-banner notification system across main/admin.
- Banner variants added (`info`, `success`, `warn`) with dismiss button.
- Auto-hide progress indicator for banners.
- Accessibility improvements:
  - `role="status"` and `aria-live="polite"` on notification region.
  - Keyboard-visible focus style for dismiss button.
  - Reduced-motion fallback for banner progress animation.
- Session flow hardening:
  - Prevent duplicate expiry redirects.
  - Clear banner timers reliably before new banners.

### Notes
- Runtime Django checks were limited by environment package availability at some stages; editor diagnostics show no syntax errors in modified files.
- Current branch: `main`.
