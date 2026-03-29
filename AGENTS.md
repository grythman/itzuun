# Repository Guidelines

## Project Structure & Module Organization
`backend/` contains the Django API, app modules under `backend/apps/`, shared utilities in `backend/common/`, configuration in `backend/config/`, and operational docs in `backend/docs/`. `frontend/` contains the Next.js App Router app, reusable UI in `frontend/components/`, shared client logic in `frontend/lib/`, locale messages in `frontend/messages/`, and Vitest tests in `frontend/tests/`. Production infrastructure lives in `docker-compose.prod.yml`, `nginx/`, and GitHub Actions workflows under `.github/workflows/`.

## Build, Test, and Development Commands
Use the root scripts for full-stack local work:

```bash
./scripts/run_stack.sh
./scripts/stop_stack.sh --with-db
```

Backend:

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
python manage.py test
```

Frontend:

```bash
cd frontend
npm install
npm run dev
npm run build
npm test
```

## Coding Style & Naming Conventions
Follow existing style in each app. Python uses 4-space indentation, `snake_case` for functions/modules, and Django app-local organization. TypeScript/React uses 2-space indentation, `PascalCase` for components, `camelCase` for helpers/hooks, and App Router folder naming such as `app/[locale]/projects/page.tsx`. Keep user-facing text translatable and add EN/MN message keys when introducing UI copy.

## Testing Guidelines
Backend tests run through Django’s test runner; keep tests close to the owning app and name files `tests.py` or `test_*.py`. Frontend uses Vitest with Testing Library; place specs in `frontend/tests/` and use `*.test.ts` or `*.test.tsx`. Run `python manage.py test`, `npm test`, and `npm run build` before opening a PR, especially for route or i18n changes.

## Commit & Pull Request Guidelines
Recent history follows Conventional Commit style: `feat: ...`, `refactor: ...`, `style: ...`. Keep subjects imperative and scoped to one change. PRs should include a short summary, linked issue or task, test evidence, and screenshots for frontend UI changes. Call out config, secret, or deployment impacts explicitly when touching workflows or production compose files.

## Security & Configuration Tips
Start from `backend/.env.example` and `frontend/.env.example`; never commit real secrets. Required deployment values include server SSH secrets and app env vars such as `DJANGO_SECRET_KEY` and `NEXT_PUBLIC_API_BASE_URL`. When editing CI or production files, verify health checks and artifact outputs in GitHub Actions before merging.
