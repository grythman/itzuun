# Pilot Rollout Tracker (First 20 Projects)

## Goal
- Track launch-readiness rollout for first 20 real projects with owner + evidence.
- Link weekly KPI signals to rollout milestones.

## Milestone Tracker Template
| Milestone | Owner | Target Date | Status | Evidence |
|---|---|---|---|---|
| Pilot cohort selected (clients/freelancers) | @copilot | 2026-03-30 | Todo | sheet: https://docs.google.com/spreadsheets/d/PLACEHOLDER |
| 5 projects posted | @tara_growth | 2026-04-06 | Todo | sheet: https://docs.google.com/spreadsheets/d/PLACEHOLDER#projects |
| 5 projects funded escrow | @mike_ops | 2026-04-13 | Todo | jira: https://your-jira.atlassian.net/browse/PLACEHOLDER |
| 3 projects completed | @mike_ops | 2026-04-20 | Todo | notion: https://www.notion.so/PLACEHOLDER |
| 1 dispute resolved end-to-end | @julia_support | 2026-04-27 | Todo/In Progress/Done | notion: https://www.notion.so/PLACEHOLDER#disputes, jira: https://your-jira.atlassian.net/browse/PLACEHOLDER |
| 20 total pilot projects reached | @copilot | 2026-05-04 | Todo/In Progress/Done | sheet: https://docs.google.com/spreadsheets/d/PLACEHOLDER#final_export |

## Weekly KPI Mapping
| KPI (`weekly_kpi_report`) | Rollout Signal | Owner | Evidence |
|---|---|---|---|
| `projects_posted` | Top-of-funnel activity | @tara_growth | sheet: https://docs.google.com/spreadsheets/d/PLACEHOLDER#kpi |
| `hired_projects` | Match quality / conversion | @copilot | sheet: https://docs.google.com/spreadsheets/d/PLACEHOLDER#kpi |
| `proposal_to_hire_conversion_pct` | Marketplace efficiency | @copilot | sheet: https://docs.google.com/spreadsheets/d/PLACEHOLDER#kpi |
| `escrow_funded_count` | Transaction trust adoption | @mike_ops | jira: https://your-jira.atlassian.net/browse/PLACEHOLDER |
| `completion_rate_pct` | Delivery success | @mike_ops | notion: https://www.notion.so/PLACEHOLDER |
| `dispute_rate_pct` | Risk signal (must trend down) | @julia_support | notion: https://www.notion.so/PLACEHOLDER |
| `avg_rating` | Quality signal | @copilot | sheet: https://docs.google.com/spreadsheets/d/PLACEHOLDER#reviews |
| `new_freelancer_signups` | Supply growth | @tara_growth | sheet: https://docs.google.com/spreadsheets/d/PLACEHOLDER#signups |
| `verified_freelancers` | Trust supply quality | @mike_ops | sheet: https://docs.google.com/spreadsheets/d/PLACEHOLDER#verification_report |

## Weekly Review Cadence
1. Run KPI workflow (`days=7`) every Monday.
2. Fill tracker table with delta vs last week.
3. Open incident if `dispute_rate_pct` spikes or `completion_rate_pct` drops.
4. Assign one action owner per KPI regression and capture evidence link.
5. Use incident template: `docs/ONCALL_QUICK_ACTIONS.md`.

## Exit Gate (Pilot Complete)
- 20 real projects posted.
- Meaningful escrow-funded and completed volume.
- Dispute flow exercised and resolved with documented evidence.
- KPI trend is stable enough for broader rollout decision.
