# Pilot Rollout Tracker (First 20 Projects)

## Goal
- Track launch-readiness rollout for first 20 real projects with owner + evidence.
- Link weekly KPI signals to rollout milestones.

## Milestone Tracker Template
| Milestone | Owner | Target Date | Status | Evidence |
|---|---|---|---|---|
| Pilot cohort selected (clients/freelancers) | Product Lead | YYYY-MM-DD | Todo/In Progress/Done | Cohort sheet URL |
| 5 projects posted | Growth Lead | YYYY-MM-DD | Todo/In Progress/Done | Project IDs list |
| 5 projects funded escrow | Ops Lead | YYYY-MM-DD | Todo/In Progress/Done | Escrow IDs + screenshot |
| 3 projects completed | Ops Lead | YYYY-MM-DD | Todo/In Progress/Done | Completion IDs |
| 1 dispute resolved end-to-end | Support Lead | YYYY-MM-DD | Todo/In Progress/Done | Dispute ID + resolution note |
| 20 total pilot projects reached | Product Lead | YYYY-MM-DD | Todo/In Progress/Done | Final tracker export |

## Weekly KPI Mapping
| KPI (`weekly_kpi_report`) | Rollout Signal | Owner | Evidence |
|---|---|---|---|
| `projects_posted` | Top-of-funnel activity | Growth Lead | Weekly KPI artifact |
| `hired_projects` | Match quality / conversion | Product Lead | Weekly KPI artifact |
| `proposal_to_hire_conversion_pct` | Marketplace efficiency | Product Lead | Weekly KPI artifact |
| `escrow_funded_count` | Transaction trust adoption | Ops Lead | Escrow IDs + KPI artifact |
| `completion_rate_pct` | Delivery success | Ops Lead | Completed project IDs |
| `dispute_rate_pct` | Risk signal (must trend down) | Support Lead | Dispute IDs + notes |
| `avg_rating` | Quality signal | Product Lead | Review snapshots |
| `new_freelancer_signups` | Supply growth | Growth Lead | Signup log extract |
| `verified_freelancers` | Trust supply quality | Ops Lead | Verification report |

## Weekly Review Cadence
1. Run KPI workflow (`days=7`) every Monday.
2. Fill tracker table with delta vs last week.
3. Open incident if `dispute_rate_pct` spikes or `completion_rate_pct` drops.
4. Assign one action owner per KPI regression and capture evidence link.

## Exit Gate (Pilot Complete)
- 20 real projects posted.
- Meaningful escrow-funded and completed volume.
- Dispute flow exercised and resolved with documented evidence.
- KPI trend is stable enough for broader rollout decision.
