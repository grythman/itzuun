# ITZuun UI/UX Optimization Master

## 1. Design System

### Colors
- Primary: `#1E3A8A` (Trust)
- Success: `#059669` (Payment success)
- Warning: `#D97706` (Attention)
- Danger: `#DC2626` (Risk/Error)
- Neutral scale: Slate 50–900

### Typography
- H1: `text-3xl font-semibold`
- H2: `text-xl font-semibold`
- H3: `text-lg font-semibold`
- Body: `text-sm text-slate-700`
- Form inputs: `text-sm`, min-height 40px, rounded-xl

### Spacing
- Page container: `max-w-6xl px-4 py-10`
- Section gaps: `space-y-6`
- Card padding: `p-5`
- Corner radius: `rounded-2xl`

## 2. Component Library
- Navbar
- Role sidebar
- Card: project/freelancer/proposal/payment
- Escrow status badge
- Verified badge
- Rating stars
- Step progress bar
- Chat bubble
- Compare table
- Mobile bottom bar

## 3. Low-Fidelity Wireframes

### Landing
1. Hero (headline + trust CTA)
2. 3-step how-it-works
3. Trust block (escrow / verification / mediation)
4. Featured freelancers
5. Testimonials + footer legal links

### Project Posting Wizard
1. Step 1: Basic Info
2. Step 2: Budget & Timeline
3. Step 3: Review + Confirm (escrow trust note)

### Escrow Payment
1. Project summary card
2. Amount + platform fee + freelancer amount
3. Payment progress: Invoice Created → Waiting Payment → Confirmed
4. Security FAQ

### Freelancer Dashboard
1. Earnings summary
2. Active projects
3. Pending proposals
4. Rating + verification + profile completeness

## 4. High-Fidelity Screen Decisions
- Primary actions always blue
- Critical success states always emerald
- Financial warnings always amber/red
- Escrow status visible above payment/chat/actions
- Trust copy repeated before financial actions

## 5. Conversion Optimization Notes
- Project posting uses stepper to reduce form anxiety
- Escrow page shows "what happens next" to reduce abandonment
- Freelancer dashboard emphasizes credibility (rating/verification/profile completion)
- Proposal cards include comparison-friendly structure

## 6. Interaction States
- Hover: slightly darker background on CTA
- Loading: muted button + text status
- Success: green badge + confirmation message
- Error: red card with actionable guidance

## 7. Metrics to Track
- Project posting completion rate
- Payment completion rate
- Escrow abandonment rate
- Proposal acceptance rate
- Time to first proposal
