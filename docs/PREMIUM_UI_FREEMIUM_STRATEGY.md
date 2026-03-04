# ITZuun Premium UI Strategy (Freemium Model)

## 1) Product Goal

Build a monetizable Premium layer that:

- increases freelancer visibility,
- improves client confidence,
- creates predictable monthly revenue,
- preserves platform trust,
- avoids pay-to-win toxicity.

Model: **Freemium + Subscription + Optional Boost**.

---

## 2) Tier Structure

### 2.1 Free Tier (Default)

**Freelancer**
- Create profile
- Submit 10 proposals / month
- Standard listing position
- Basic analytics
- Standard support

**Client**
- Unlimited project posting
- Standard proposal sorting
- Escrow protection

### 2.2 Premium Freelancer Tier (MVP Premium)

Price range: **49,000₮ – 99,000₮ / month** (start with 79,000₮ A/B in config)

Unlocks:
- Featured profile badge (PRO)
- Search priority boost (reorder, not exclusion)
- 50 proposals / month
- Advanced analytics
- Profile highlight card
- Early access to new projects (30 min)
- Faster payout queue
- Premium support badge

### 2.3 Premium Client Tier (Phase 2)

- Priority freelancer matching
- Dedicated support
- Smart project template
- Escrow fee discount (ex: 10% → 8%)

---

## 3) UI Visual Language

Design tone: **Trustworthy Fintech + Clean Marketplace**.

### Badge Rules

- Free: no badge
- Verified: blue check badge
- Premium (PRO):
  - subtle emerald border accent
  - `PRO` tag
  - slight elevation shadow

Constraint: Premium stands out but must not dominate the page.

### Card Rules

**Free freelancer card**
- white background
- standard border
- name, rating, skills, hourly rate

**Premium freelancer card**
- light neutral/emerald-tinted gradient
- subtle glow border
- PRO badge
- “Priority Response” label
- preview stats: completion rate, avg response time
- microcopy: “2x more visibility”

---

## 4) Structural UI Hierarchy (Concrete)

## 4.1 Go PRO Page (`/pro`)

1. Hero
   - title: “Grow Faster with ITZuun PRO”
   - price selector (monthly/annual phase 2)
   - CTA: “Upgrade to PRO”
2. Comparison Table
   - Free vs PRO features
3. ROI Calculator
   - inputs: average project win amount, expected extra wins
   - output: payback estimate
4. FAQ + Trust Box
   - “PRO does not guarantee selection”
   - “Ratings and reviews remain merit-based”

## 4.2 Freelancer Search/List Cards

Card anatomy (top → bottom):
1. Avatar + name + verified/pro badge row
2. Rating + completed jobs summary
3. Skills chips
4. Rate + response time
5. Optional premium strip: “Priority Response / 2x visibility”

## 4.3 Freelancer Dashboard (`/freelancer`)

Tabs:
- Overview
- Proposals
- **Growth Dashboard** (new)

Growth Dashboard blocks:
1. KPI row: profile views, win rate, ranking percentile
2. Trend charts (7d/30d)
3. Estimated earnings potential
4. Suggested improvements checklist
5. Locked premium insights (blur + CTA) for free users

## 4.4 Upgrade Modal

Trigger contexts:
- proposal limit reached
- profile completeness > 80%
- viewed stats panel
- lost 3 proposals in a row
- client used PRO-only filter

Modal structure:
1. reason-driven title: “Want more visibility?”
2. 3 concrete benefits
3. monthly price + trial note (optional)
4. CTA: Upgrade / Later

No hard-block popup loops (max 1 impression/session for soft triggers).

## 4.5 Boost Purchase Flow

When submitting proposal:
1. proposal form
2. optional boost toggle:
   - Boost proposal (5,000₮)
3. disclosure text:
   - “Boost does not guarantee selection.”
4. payment confirmation step
5. success state with expiry timer

Profile boost flow:
- From dashboard card → “Boost profile for 24h (10,000₮)”

---

## 5) Search & Ranking Logic (Trust-safe)

### 5.1 Ordering Strategy

Default ranking groups:
1. Verified + Premium
2. Verified
3. Rating/quality score
4. New

Important: free users remain visible in all result pages.

### 5.2 Suggested Scoring Formula

Use bounded additive scoring:

```
score = quality_score
      + verified_bonus
      + premium_bonus
      + freshness_bonus
      + boost_bonus(time-decayed)
```

Constraints:
- `quality_score` (reviews, completion, response SLA) is dominant weight
- `premium_bonus` capped (example: max +8% impact)
- `boost_bonus` short-lived and capped
- never use premium to alter ratings/review values

### 5.3 Sort and Filter Controls

- Sort: Recommended, Rating, Response Time, Newest
- Filter: “Show PRO only” toggle (off by default)

---

## 6) Backend Data Model Changes

## 6.1 User fields (extend `accounts.User`)

- `is_premium: bool` (default False)
- `premium_expiry: datetime | null`
- `premium_plan_type: char` (optional, for quick reads)

## 6.2 Subscription table

`subscriptions`
- `id`
- `user_id` (FK)
- `plan_type` (`pro_monthly`, `pro_annual` future)
- `status` (`active`, `past_due`, `canceled`, `expired`)
- `started_at`
- `expires_at`
- `auto_renew` (bool)
- `price_mnt`
- `source` (`qpay`, `admin`, `promo`)

Indexes:
- `(user_id, status)`
- `(expires_at, status)`

## 6.3 Boost table

`boost_events`
- `id`
- `user_id`
- `target_type` (`proposal`, `profile`)
- `target_id`
- `amount_mnt`
- `started_at`
- `expires_at`
- `status` (`active`, `expired`, `refunded`)

---

## 7) API Contract Additions

### Freelancer Premium
- `GET /api/v1/premium/me`
  - returns tier, expiry, remaining proposals, growth stats access
- `POST /api/v1/premium/subscribe`
  - create invoice/subscription intent
- `POST /api/v1/premium/cancel`

### Growth Analytics
- `GET /api/v1/analytics/growth`
  - returns KPI blocks and lock-state fields

### Boost
- `POST /api/v1/boost/proposal`
- `POST /api/v1/boost/profile`
- `GET /api/v1/boost/me`

### Discovery
- `GET /api/v1/freelancers?pro_only=true&sort=recommended`

---

## 8) Middleware / Guard Logic

On each request (or cached per session):
1. check `is_premium`
2. if `premium_expiry < now`, auto-downgrade and mark status expired
3. apply entitlement limits:
   - proposal limit (10 vs 50)
   - early access window
   - analytics depth

Proposal limit policy:
- If free user reaches 10/month:
  - block new submission
  - return structured error code `PROPOSAL_LIMIT_REACHED`
  - frontend shows upgrade CTA panel

---

## 9) Feature Flag Architecture

Use server-side flags to rollout safely.

Suggested flags:
- `premium_enabled`
- `premium_client_phase2_enabled`
- `boost_enabled`
- `pro_filter_enabled`
- `growth_dashboard_enabled`

Flag resolution order:
1. environment default
2. admin override table
3. user cohort/experiment bucket

Frontend pattern:
- fetch flags in app bootstrap
- gate UI sections by flag + role + entitlement

---

## 10) Abuse Prevention & Risk Controls

Hard rules:
- premium never changes user rating value
- premium never auto-selects freelancer
- escrow/reviews remain unchanged
- boosted items require explicit label

Anti-abuse checks:
- cap simultaneous boosts per user/day
- block self-boost loops on same target beyond threshold
- anomaly detection for repeated low-quality boosted proposals
- cooldown on refunded/chargeback accounts

Transparency labels:
- “Sponsored / Boosted” on boosted listing
- tooltip: “Boost improves visibility only”

Audit logging:
- subscription state transitions
- boost purchases and expiries
- ranking score components snapshot (for dispute review)

---

## 11) Revenue Simulation Module

Base simulation:
- 200 active freelancers
- 10% premium conversion = 20 users
- 20 × 79,000₮ = 1,580,000₮ / month
- boost revenue target +500,000₮

Expected recurring total: **~2,080,000₮ / month**.

Dashboard metrics to track:
- premium conversion rate
- churn rate
- ARPU (premium and overall)
- boost attach rate
- win-rate delta free vs premium (must remain bounded)

---

## 12) Concrete Frontend Component Map

Add components:
- `PremiumBadge`
- `FreelancerCardPro`
- `GrowthLockedChart`
- `UpgradeCtaPanel`
- `UpgradeModal`
- `BoostToggle`
- `PricingComparisonTable`
- `RoiCalculator`

Placement:
- Dashboard (`/freelancer`): `GrowthLockedChart`, `UpgradeCtaPanel`
- Search results: `FreelancerCardPro`, `PremiumBadge`
- Proposal submit: `BoostToggle`
- New page `/pro`: `PricingComparisonTable`, `RoiCalculator`

---

## 13) Concrete Backend Implementation Map

Files to extend:
- `backend/apps/accounts/models.py`
  - add premium fields
- `backend/apps/payments/models.py`
  - add `Subscription`, `BoostEvent`
- `backend/apps/payments/services/`
  - subscription activate/expire jobs
- `backend/apps/projects/services.py`
  - ranking score composition with premium/boost caps
- `backend/apps/projects/views.py`
  - `pro_only` filter and sponsored labels
- `backend/apps/accounts/permissions.py`
  - entitlement checks (proposal quota)

---

## 14) Rollout Plan

Phase A (internal)
- flags on for staff only
- validate ranking fairness and logs

Phase B (5-10% freelancers)
- enable PRO subscription + dashboard lock
- monitor conversion/churn/trust signals

Phase C (full freelancer premium)
- enable boosts
- enforce sponsored labels everywhere

Phase D (client premium phase 2)
- escrow fee discount bundle

---

## 15) UX Copy Guardrails

Use soft language:
- “Want more visibility?”
- “Unlock deeper insights”
- “Visibility boost, not guaranteed selection”

Avoid:
- “Guaranteed win”
- “Top talent only (paid)”
- aggressive fear prompts

---

## 16) Acceptance Criteria (Non-vague)

1. Free users can still discover and be discovered in search.
2. Premium users receive visible but subtle differentiation.
3. Proposal limits enforce correctly by tier.
4. Locked analytics render with blur + CTA, without breaking free dashboard.
5. Boosted content is clearly labeled and expires automatically.
6. Ranking logs can explain why a user appeared above another.
7. No change to escrow/review trust mechanics.
