# ITZuun MVP DB Schema (PostgreSQL)

Доорх schema нь одоогийн Django model-той нийцсэн.

## 1) Core Tables

### `accounts_user`
- `id` PK
- `email` UNIQUE
- `role` (`client|freelancer|admin`)
- `is_verified` bool
- `is_active` bool
- `is_staff` bool
- `created_at`

### `accounts_emailotp`
- `id` PK
- `email`
- `otp_code`
- `otp_token` UNIQUE
- `expires_at`
- `is_used`
- `created_at`

### `profiles_profile`
- `id` PK
- `user_id` FK -> accounts_user (one-to-one)
- `full_name`
- `bio`
- `skills` JSON
- `hourly_rate`

### `projects_project`
- `id` PK
- `owner_id` FK -> accounts_user
- `title`
- `description`
- `budget`
- `timeline_days`
- `category`
- `status` (`open|in_progress|awaiting_client_review|completed|closed_refunded|disputed`)
- `selected_proposal_id` FK -> projects_proposal (nullable)
- `created_at`
- `updated_at`

### `projects_proposal`
- `id` PK
- `project_id` FK -> projects_project
- `freelancer_id` FK -> accounts_user
- `price`
- `timeline_days`
- `message`
- `status` (`pending|withdrawn|accepted|rejected`)
- `created_at`

### `payments_escrow`
- `id` PK
- `project_id` FK -> projects_project (one-to-one)
- `amount`
- `status` (`pending_admin|held|released|refunded|disputed`)
- `created_at`
- `updated_at`

### `payments_ledgerentry`
- `id` PK
- `escrow_id` FK -> payments_escrow
- `entry_type` (`deposit|release|refund|fee`)
- `amount`
- `note`
- `created_at`

### `payments_dispute`
- `id` PK
- `project_id` FK -> projects_project
- `raised_by_id` FK -> accounts_user
- `reason`
- `evidence_files` JSON
- `resolved_by_id` FK -> accounts_user (nullable)
- `resolved_at` (nullable)
- `note`
- `created_at`

### `messaging_projectmessage`
- `id` PK
- `project_id` FK -> projects_project
- `sender_id` FK -> accounts_user
- `type` (`text|file`)
- `text`
- `created_at`

### `messaging_projectfile`
- `id` PK
- `project_id` FK -> projects_project
- `uploader_id` FK -> accounts_user
- `file`
- `name`
- `size`
- `created_at`

### `reviews_review`
- `id` PK
- `project_id` FK -> projects_project
- `reviewer_id` FK -> accounts_user
- `reviewee_id` FK -> accounts_user
- `rating` (1..5)
- `comment`
- `created_at`

### `common_platformsetting`
- `id` PK (singleton = 1)
- `platform_fee_pct`
- `updated_at`

## 2) Recommended Indexes (MVP+)
- `projects_project(status, category, created_at)`
- `projects_proposal(project_id, status)`
- `payments_escrow(status, updated_at)`
- `payments_dispute(project_id, created_at)`
- `reviews_review(reviewee_id, created_at)`
- `messaging_projectmessage(project_id, created_at)`

## 3) Data Integrity Rules
- `escrow.amount >= 0`
- `platform_fee_pct` range: 0..30 (business cap)
- `review.rating` range: 1..5
- Dispute resolve үед `release_amount + refund_amount == escrow.amount`
- Proposal select хийсний дараа project `in_progress` төлөвт орно
