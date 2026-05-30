# Production Smoke Test — Stage 2

- Checked at (UTC): 2026-05-30T11:00:47Z
- Frontend base URL: `https://itzuun.works`
- API base URL: `https://api.itzuun.works/api/v1`
- Scope: unauthenticated production smoke from the Codex runner plus a web fetch of the public homepage.

## Result Summary

| Target | Expected smoke behavior | Result | Evidence / notes |
|---|---:|:---:|---|
| `https://itzuun.works` | Public homepage renders | PASS | Web fetch redirected to `https://itzuun.works/en` and rendered the ITZuun homepage content. |
| `https://api.itzuun.works/api/v1/projects/` | Public project list returns JSON, or frontend projects page hydrates from it | FAIL | Shell smoke could not complete TLS CONNECT through the runner proxy (`curl: (56) CONNECT tunnel failed, response 403`, `http_code=000`). The public `/en/projects` page rendered the shell but stayed at `Loading projects...`, so this smoke did not confirm project data availability. |
| `/profiles/me` | Unauthenticated API request should return an auth guard response such as `401` | FAIL | Direct runner request to `https://api.itzuun.works/api/v1/profiles/me` failed before HTTP response (`http_code=000`, CONNECT tunnel 403). No authenticated session was available for profile UI validation. |
| `/notifications/` | Unauthenticated API/page should be auth-guarded rather than 500 | FAIL | Direct runner request to `https://api.itzuun.works/api/v1/notifications/` failed before HTTP response (`http_code=000`, CONNECT tunnel 403). No authenticated session was available for dashboard notification page validation. |
| project detail page | Public detail page should render for a valid project id | FAIL | A valid production project id could not be discovered because the project list did not hydrate during this smoke. |
| payment page | Payment page should render; QPay-unavailable state should show manual payment guidance when applicable | FAIL | A valid production project id/session could not be confirmed, so the payment page/manual banner path was not validated. |

## Screenshot Decision

Screenshots were **not captured** in this run. The requested targets (`payment manual banner` and `profile page`) require either a valid project/payment context or an authenticated dashboard session, and this smoke did not reach those states reliably. Capture them in the next privileged/manual run after signing in and selecting a known project.

## Stage 2 Completion Note Decision

Add the Stage 2 completion summary to `CODEX.md` rather than `docs/RELEASE_NOTES_RC1.md`: this run is operational smoke evidence and follow-up status, while the RC1 release note should remain tied to the RC1 release artifact.

## Commands / Checks Used

```bash
# Runner curl smoke. These failed in this environment before an HTTP response.
for url in \
  https://itzuun.works \
  https://api.itzuun.works/api/v1/projects/ \
  https://api.itzuun.works/api/v1/profiles/me \
  https://api.itzuun.works/api/v1/notifications/; do
  curl -L -sS --max-time 30 -o "$file" \
    -w 'http_code=%{http_code}\nfinal_url=%{url_effective}\ncontent_type=%{content_type}\ntime_total=%{time_total}\n' \
    "$url"
done
```

```text
curl: (56) CONNECT tunnel failed, response 403
http_code=000
```

Web fetch evidence for the homepage showed `https://itzuun.works/` redirecting to `https://itzuun.works/en` and rendering the homepage hero, navigation, and footer content.
