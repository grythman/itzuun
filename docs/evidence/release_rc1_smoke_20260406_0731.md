# Release RC1 Smoke Report

- Checked at (UTC): 2026-04-06T07:31:03Z
- Release tag: `v0.1.0-rc1`
- Base URL: `https://itzuun.works`

## Public Route Availability
- `/` -> `200`
- `/auth/login` -> `200`
- `/client` -> `200`
- `/freelancer` -> `200`
- `/projects` -> `200`
- `/projects/new` -> `200`

Command used:
```bash
BASE=https://itzuun.works
for p in / /auth/login /client /freelancer /projects /projects/new; do
  curl -L -s -o /dev/null -w "%{http_code}" "$BASE$p"
done
```

## API Smoke (No Auth Session)
- `GET /api/v1/admin/audit-logs` -> `401`
  - body: `{"detail":"Authentication credentials were not provided."}`
- `GET /api/v1/auth/google` -> `405`
  - body: `{"detail":"Method \"GET\" not allowed."}`
- `POST /api/v1/auth/google` with empty JSON -> `400`
  - body: `{"credential":["This field is required."]}`
- `GET /api/v1/admin/users/1/unsuspend` -> `401`
  - body: `{"detail":"Authentication credentials were not provided."}`

Command used:
```bash
BASE=https://itzuun.works
curl -s -o /tmp/audit.out -w "%{http_code}\n" "$BASE/api/v1/admin/audit-logs"
curl -s -o /tmp/google_get.out -w "%{http_code}\n" "$BASE/api/v1/auth/google"
curl -s -X POST -H 'Content-Type: application/json' -d '{}' -o /tmp/google_post.out -w "%{http_code}\n" "$BASE/api/v1/auth/google"
curl -s -o /tmp/unsuspend_get.out -w "%{http_code}\n" "$BASE/api/v1/admin/users/1/unsuspend"
```

## Notes
- Unauthenticated smoke confirms public route reachability and expected auth-guard behavior.
- Admin-authenticated checks from the RC1 checklist (actual audit log data read, unsuspend success, audit event verification) require a valid admin session token/cookie and should be executed by ops in a privileged run.
