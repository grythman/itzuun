# CODEOWNERS Team Migration Template

Use this template when moving from single-owner CODEOWNERS to team-based ownership.

## 1) Preconditions

- GitHub organization teams already exist and are visible to the repository.
- Each team has at least 2 maintainers.
- Team permission is set to write/maintain for this repository.

## 2) Suggested Team Handles (example)

- `@YOUR_ORG/backend-team`
- `@YOUR_ORG/devops-team`
- `@YOUR_ORG/security-team`
- `@YOUR_ORG/product-tech-leads`

## 3) Draft Mapping Template

Copy this mapping into `.github/CODEOWNERS` and replace team handles.

```text
# Default fallback owners
* @YOUR_ORG/backend-team @YOUR_ORG/product-tech-leads

# CI/CD and repo governance
.github/workflows/* @YOUR_ORG/devops-team @YOUR_ORG/backend-team
.github/pull_request_template.md @YOUR_ORG/product-tech-leads @YOUR_ORG/backend-team
.github/CODEOWNERS @YOUR_ORG/product-tech-leads @YOUR_ORG/devops-team

# Core backend domains
backend/apps/payments/* @YOUR_ORG/backend-team @YOUR_ORG/security-team
backend/apps/projects/* @YOUR_ORG/backend-team
backend/apps/adminpanel/* @YOUR_ORG/backend-team @YOUR_ORG/security-team
backend/common/* @YOUR_ORG/backend-team
backend/config/* @YOUR_ORG/backend-team @YOUR_ORG/devops-team

# Docs and release process
backend/docs/* @YOUR_ORG/product-tech-leads @YOUR_ORG/backend-team
README.md @YOUR_ORG/product-tech-leads @YOUR_ORG/backend-team
```

## 4) Rollout Steps

1. Create/update teams and permissions.
2. Update `.github/CODEOWNERS` with real team handles.
3. Open PR and verify auto-reviewers are requested from teams.
4. Merge and monitor 3-5 PRs for expected reviewer routing.

## 5) Rollback Plan

- Revert `.github/CODEOWNERS` to last known-good commit.
- Re-run a test PR to ensure reviewer auto-request returns to expected behavior.
