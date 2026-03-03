# ITZuun MVP API Contract (Current Backend Aligned)

Base URL: `/api/v1`

## 1) Auth (`/auth`)
### POST `/auth/request-otp`
Request:
```json
{ "email": "user@example.com" }
```
Response:
```json
{ "otp_token": "..." }
```

### POST `/auth/verify-otp`
Request:
```json
{ "email": "user@example.com", "otp": "123456", "otp_token": "..." }
```
Response:
```json
{ "access": "jwt", "refresh": "jwt", "user": { "id": 1, "email": "...", "role": "client", "is_verified": false, "created_at": "..." } }
```

### POST `/auth/refresh`
JWT refresh endpoint.

### GET `/auth/me`
Current authenticated user.

### PATCH `/auth/me`
Request:
```json
{ "role": "client" }
```
`role` accepted: `client | freelancer`

## 2) Profiles
### GET `/profiles/{user_id}`
Public profile detail.

### GET `/profiles/me`
Current user profile.

### PATCH `/profiles/me`
Updatable fields:
- `full_name`
- `bio`
- `skills` (JSON list)
- `hourly_rate`

## 3) Projects
### GET `/projects`
Query params: `status`, `category`, `search`

### POST `/projects`
Client only.
Request:
```json
{
  "title": "POS засвар",
  "description": "Сүлжээтэй холболтын алдаа",
  "budget": 1200000,
  "timeline_days": 7,
  "category": "pos"
}
```

### GET `/projects/{id}`
### PATCH `/projects/{id}`
Owner only, project status must be `open`.

### POST `/projects/{project_id}/close`
Client owner only.

### POST `/projects/{project_id}/select-freelancer`
Client owner only.
Request:
```json
{ "proposal_id": 45 }
```

## 4) Proposals
### GET `/projects/{project_id}/proposals`
Visible to project owner or admin.

### POST `/projects/{project_id}/proposals`
Freelancer only, project must be `open`.
Request:
```json
{ "price": 1000000, "timeline_days": 10, "message": "Implementation plan..." }
```

### GET `/me/proposals`
Freelancer’s own proposals.

### PATCH `/proposals/{id}`
Freelancer owner only, status must be `pending`.

### POST `/proposals/{proposal_id}/withdraw`
Freelancer owner only.

## 5) Messaging & Files
### GET `/projects/{project_id}/messages`
### POST `/projects/{project_id}/messages`
Project participants only (owner, selected freelancer, admin).
Request:
```json
{ "type": "text", "text": "Requirement update" }
```

### POST `/projects/{project_id}/files`
Multipart upload (`file`).
Participants only.
Response includes `file_id`, `url`, `name`, `size`.

## 6) Escrow & Dispute
### POST `/projects/{project_id}/escrow/deposit`
Client owner only.
Request:
```json
{ "amount": 1000000 }
```
If omitted, defaults to selected proposal price.

### POST `/escrow/{escrow_id}/admin/approve`
Admin only; sets escrow to `held`.

### POST `/projects/{project_id}/submit-result`
Selected freelancer only; requires escrow `held`.

### POST `/projects/{project_id}/confirm-completion`
Client owner only.
Optional request:
```json
{ "platform_fee_pct": 12 }
```
If omitted, uses platform setting.

### POST `/projects/{project_id}/dispute`
Project participants only.
Request:
```json
{ "reason": "Scope mismatch", "evidence_files": [101, 102] }
```

## 7) Reviews
### POST `/projects/{project_id}/reviews`
Participants only, only after project `completed`, one review per reviewer.

### GET `/users/{user_id}/reviews`
### GET `/users/{user_id}/rating-summary`
Response:
```json
{ "average": 4.8, "total": 12 }
```

## 8) Admin (`/admin`)
### GET `/admin/users?verified=true|false`
### POST `/admin/users/{user_id}/verify`
### GET `/admin/projects?status=...`
### POST `/admin/disputes/{dispute_id}/resolve`
Request:
```json
{
  "action": "release",
  "release_amount": 880000,
  "refund_amount": 120000,
  "note": "Final decision"
}
```
`action` values: `release | refund | split`

### PATCH `/admin/settings/commission`
Request:
```json
{ "platform_fee_pct": 12 }
```

### GET `/admin/settings/commission/detail`
Response:
```json
{ "platform_fee_pct": 12 }
```
