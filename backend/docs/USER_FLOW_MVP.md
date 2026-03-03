# ITZuun MVP User Flow

## 1) Client Flow
1. Register/Login (`request-otp` -> `verify-otp`)
2. Create profile (`profiles/me`)
3. Post project (`POST /projects`)
4. Receive proposals (`GET /projects/{id}/proposals`)
5. Select freelancer (`POST /projects/{id}/select-freelancer`)
6. Fund escrow (`POST /projects/{id}/escrow/deposit`)
7. Admin approves escrow (`/admin/approve` by admin)
8. Collaborate via chat/files (`/messages`, `/files`)
9. Freelancer submits result (`/submit-result`)
10. Confirm completion (`/confirm-completion`)
11. Leave review (`POST /projects/{id}/reviews`)

## 2) Freelancer Flow
1. Register/Login
2. Update profile (skills, rate, portfolio-bio)
3. Browse open projects (`GET /projects?status=open`)
4. Submit proposal (`POST /projects/{id}/proposals`)
5. Get selected by client
6. Start implementation after escrow held
7. Communicate via chat/files
8. Submit result (`POST /projects/{id}/submit-result`)
9. Get payout on completion confirmation
10. Receive review/rating

## 3) Admin Flow
1. Verify freelancers (`POST /admin/users/{id}/verify`)
2. Monitor projects and escrow status
3. Approve escrow deposits (`POST /escrow/{id}/admin/approve`)
4. Resolve disputes (`POST /admin/disputes/{id}/resolve`)
5. Manage commission (`PATCH /admin/settings/commission`)

## 4) Escrow State Flow
`pending_admin -> held -> released`

Alternate paths:
- `held -> disputed -> refunded`
- `held -> disputed -> released` (split/release decision)

## 5) Project State Flow
`open -> in_progress -> awaiting_client_review -> completed`

Alternate paths:
- `open -> closed_refunded` (close/cancel path)
- `in_progress/awaiting_client_review -> disputed -> completed|closed_refunded`

## 6) Dispute Decision Matrix (MVP)
- `release`: freelancer-д бүрэн/ихэнх дүн гаргана
- `refund`: client руу буцаана
- `split`: хоёр талд хувааж шийднэ

All decisions must create ledger entries and admin note.
