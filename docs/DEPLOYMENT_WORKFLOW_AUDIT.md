# Deployment Workflow Audit

Date: 2026-05-30
Branch: `fix/cleanup-deployment-workflows`

## Decision

The legacy VPS/SSH production deployment workflow has been removed from `.github/workflows/`.

Current repository documentation identifies production hosting as:

- Frontend: Vercel, using `NEXT_PUBLIC_API_BASE_URL=https://api.itzuun.works/api/v1`.
- Backend: Render, using Render-managed runtime environment variables and a deploy start command.
- Deployment model: Vercel + Render auto-deploy from Git integration.

Because of that deployment model, GitHub Actions must not contain a second production deploy path that copies files to a VPS and restarts Docker Compose over SSH. Keeping the old disabled workflow in `.github/workflows/ci.yml.disable` made the deployment source of truth ambiguous, so it was deleted instead of re-enabled.

## Workflow inventory

| File | Status | Purpose | Production deploy? | Secrets / env surface | Audit result |
| --- | --- | --- | --- | --- | --- |
| `.github/workflows/itzuun-ci-vercel-render.yml` | Active | Main CI for pull requests and pushes to `main`: workflow lint, backend checks/tests, frontend lint/typecheck/tests/build. | No. The `production-ready` job only confirms that CI passed and that Vercel/Render should deploy through Git integration. | Uses test-only CI env values; frontend build uses `NEXT_PUBLIC_API_BASE_URL=https://api.itzuun.works/api/v1` and a test Google client ID. | Keep active. This is the desired CI-only workflow for Vercel + Render auto-deploy. |
| `.github/workflows/kpi-weekly.yml` | Active | Scheduled/manual KPI and pilot-readiness reporting. | No application deploy, but it still shells into a production server to run management commands and collect artifacts. | Requires `SERVER_HOST`, `SERVER_USER`, `SERVER_KEY`; optional `SLACK_WEBHOOK_URL`. | Keep for now as an operational/reporting workflow only. Revalidate or replace before migrating KPI collection fully to Render-native jobs/API access. |
| `.github/workflows/ci.yml.disable` | Removed | Disabled legacy all-in-one CI/CD workflow with an SSH/SCP Docker Compose deploy job. | Yes, if renamed back to `.yml`. | Required `SERVER_HOST`, `SERVER_USER`, `SERVER_KEY`. | Removed to prevent accidental restoration of the old VPS deploy path. |

## Environment and secret verification performed

Repository-visible evidence checked before changing workflows:

- `CODEX.md` documents the production split as `itzuun.works` on Vercel and `api.itzuun.works` on Render, with Vercel + Render auto-deploy from Git integration.
- `frontend/.env.example` documents the production frontend API URL as `https://api.itzuun.works/api/v1`.
- `backend/.env.example` documents the backend runtime variables that must be provided by the hosting environment.
- Existing active CI already avoids SSH deploy and prints that Vercel and Render should deploy from Git integration.

What could not be verified from this local checkout:

- Actual Vercel project environment values.
- Actual Render service environment values.
- Actual GitHub Actions secret values. The local runner does not expose repository secrets, and the GitHub CLI is not installed in this environment.

For that reason, this cleanup deliberately avoids changing active deploy behavior or secret-dependent KPI behavior. It only removes the disabled legacy deploy workflow that conflicted with the documented Vercel/Render deployment model.

## Required owner checks before future workflow changes

Before editing active deployment or production-reporting workflows, verify these values in the hosting dashboards and GitHub repository settings:

### Vercel

- `NEXT_PUBLIC_API_BASE_URL=https://api.itzuun.works/api/v1`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- Any optional frontend observability variables such as `NEXT_PUBLIC_SENTRY_DSN`
- Git integration targets the intended production branch

### Render

- `DJANGO_SECRET_KEY`
- `DJANGO_ALLOWED_HOSTS` includes `api.itzuun.works`
- `DJANGO_CSRF_TRUSTED_ORIGINS` includes production origins
- Database variables or managed database attachment
- `REDIS_URL`
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Optional payment/observability variables such as `QPAY_*` and `SENTRY_DSN`
- Deploy command runs migrations before starting the app, as documented

### GitHub Actions

- `SERVER_HOST`, `SERVER_USER`, and `SERVER_KEY` are required only while `.github/workflows/kpi-weekly.yml` continues to collect KPI data over SSH.
- `SLACK_WEBHOOK_URL` is optional and only used for KPI notifications.
- No GitHub Actions workflow should perform application deployment while Vercel and Render Git auto-deploy are the production source of truth.
