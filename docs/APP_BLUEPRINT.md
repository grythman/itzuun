# ITZuun App Blueprint

## 1) Product Vision

Build a Mongolia-focused IT freelance marketplace with secure role-based operations for client, freelancer, and admin users.

## 2) Core Stack

- Frontend: Next.js (App Router), TypeScript, Tailwind CSS
- Backend: Django, DRF, PostgreSQL
- Auth: JWT via HttpOnly cookies
- AI: Gemini + Genkit (project description assistant)
- Realtime-like updates: polling-based project chat

## 3) Functional Modules

### 3.1 User Authentication & Roles

- Email registration + password login
- OTP email verification (mock-capable)
- JWT access/refresh cookie flow
- Role-based access:
  - Client: creates/manages projects and escrow actions
  - Freelancer: proposals, delivery, profile portfolio
  - Admin: verification, disputes, commission, stats

### 3.2 Dynamic User Profiles

- Freelancer profile:
  - Bio, skills, rates, portfolio, rating summary
- Client profile:
  - Company name and basic business info
- Admin-managed freelancer verification

### 3.3 Project & Proposal Management

- Clients can create/edit/close projects
- Freelancers can browse and submit/edit proposals
- Proposal fields: pricing, timeline, message
- Hard constraints:
  - One selected freelancer per project
  - One proposal per freelancer per project

### 3.4 AI-Powered Project Description Assistant

- Client inputs: title, category, budget, timeline, required skills
- Backend Genkit flow with Gemini suggests description drafts
- Client can edit AI output before saving project
- Guardrails:
  - Prompt sanitization
  - Output length limits
  - Rate limiting

### 3.5 Escrow Payment System (MVP)

- Deposit funds into escrow
- Hold funds until client confirmation
- Release funds after platform commission deduction
- Commission policy:
  - 12% fixed default
  - Admin-adjustable policy (bounded)

### 3.6 Project-Based Chat & File Upload

- 1:1 chat per project between client and selected freelancer
- Message fields: text, sender, timestamp
- File attachment support
- Polling for near-real-time updates

### 3.7 Reviews & Ratings

- Reviews enabled only after completion/release
- Rating 1–5 + comment
- Aggregated freelancer average rating

### 3.8 Admin Control Panel

- Verify freelancers
- Manage users/projects
- Approve escrow releases
- Flag/resolve disputes
- Manage commission rate
- View MVP-level platform statistics

## 4) UI/UX System

### 4.1 Color

- Neutral and professional color system
- Consistent semantic states: success, warning, error, info

### 4.2 Layout

- Structured responsive grid layout
- Mobile-first content flow
- High readability for list-heavy and form-heavy screens

### 4.3 Typography

- Headline font: Space Grotesk
- Body font: Inter
- Headline/body separation for strong hierarchy + readability

### 4.4 Iconography

- Minimal modern vector icon set
- Icons should support navigation/actions without clutter

### 4.5 Animation

- Subtle transitions only:
  - Button/form feedback
  - Loading/skeleton transitions
  - Toast enter/exit

## 5) API Blueprint (MVP)

Base path: /api/v1

### Auth

- POST /auth/register
- POST /auth/login
- POST /auth/request-otp
- POST /auth/verify-otp
- POST /auth/refresh
- POST /auth/logout
- GET /auth/me
- PATCH /auth/me

### Profiles

- GET /profiles/me
- PATCH /profiles/me
- GET /profiles/{user_id}

### Projects

- GET /projects
- POST /projects
- GET /projects/{id}
- PATCH /projects/{id}
- POST /projects/{id}/close
- POST /projects/{id}/select-freelancer

### Proposals

- GET /projects/{id}/proposals
- POST /projects/{id}/proposals
- PATCH /proposals/{id}
- GET /me/proposals

### Escrow/Payments

- POST /projects/{id}/escrow/deposit
- POST /escrow/{id}/admin/approve
- POST /escrow/{id}/release
- POST /projects/{id}/dispute

### Messaging

- GET /projects/{id}/messages
- POST /projects/{id}/messages
- POST /projects/{id}/files

### Reviews

- POST /projects/{id}/reviews
- GET /users/{id}/rating-summary

### Admin

- GET /admin/users
- POST /admin/users/{id}/verify
- GET /admin/projects
- GET /admin/escrow
- GET /admin/disputes
- POST /admin/disputes/{id}/resolve
- PATCH /admin/settings/commission
- GET /admin/settings/commission/detail

## 6) Security & Domain Rules

- Role-based permission checks on all protected endpoints
- Serializer validation + service-layer business rules
- Idempotency keys for money-mutating actions
- Review allowed only after escrow release/completion
- Commission enforcement is server-side only

## 7) Delivery Milestones

1. Auth + role + profile baseline
2. Projects/proposals lifecycle
3. Escrow + dispute + commission controls
4. Chat + file support
5. Reviews + rating aggregation
6. Admin controls + statistics
7. AI assistant integration (Gemini/Genkit)

## 8) MVP Success Criteria

- Happy path works from project creation to review
- Admin can verify, resolve disputes, update commission
- Responsive, readable UX on desktop and mobile
- Automated tests cover auth refresh, role guard, and one happy-path API flow
