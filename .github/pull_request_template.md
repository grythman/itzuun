# Pull Request Template

## Summary

-

## Scope

- [ ] Backend API
- [ ] Admin/API operations
- [ ] Data model / migrations
- [ ] CI/CD / Infra docs

## Validation

- [ ] `python manage.py check --fail-level WARNING`
- [ ] `python manage.py makemigrations --check --dry-run`
- [ ] `python manage.py test apps.payments.tests -v 1`
- [ ] (If touching deploy/security settings) `python manage.py check --deploy --fail-level WARNING`

## Release Ownership Matrix

- [ ] CI workflow green
  - Owner:
  - Reviewer:
  - Evidence:
- [ ] Migration drift check
  - Owner:
  - Reviewer:
  - Evidence:
- [ ] Staging smoke tests
  - Owner:
  - Reviewer:
  - Evidence:
- [ ] Production deploy execution
  - Owner:
  - Reviewer:
  - Evidence:
- [ ] Post-deploy health verification
  - Owner:
  - Reviewer:
  - Evidence:

## Risk & Rollback

- Risk level: Low / Medium / High
- Rollback plan:
- Monitoring signals to watch:

## Notes

- Additional context, trade-offs, or follow-up tasks:
