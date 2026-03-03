# ITZuun Monetization Model (MVP)

## 1) Revenue Streams
1. **Platform commission:** 10–15% (default 12%)
2. **Featured listing (client-side):** premium project visibility
3. **Freelancer subscription:** monthly badge/priority exposure
4. **Escrow fee:** low fixed/percent fee for payment handling

## 2) Commission Math (Base Case)
- Project value: `1,000,000₮`
- Platform fee @12%: `120,000₮`
- Freelancer payout: `880,000₮`

Formula:
- `platform_revenue = project_amount * fee_pct`
- `freelancer_payout = project_amount - platform_revenue`

## 3) Unit Economics (Directional)
### CAC (Client acquisition cost)
- Organic/Facebook group first strategy
- Estimated CAC: `5,000₮ – 15,000₮`

### LTV (Client, 6–12 months)
Assumption:
- 3 projects/client
- avg project `1,000,000₮`
- fee 12%

Then:
- `LTV ≈ 3 * 1,000,000 * 0.12 = 360,000₮`

This supports healthy `LTV/CAC` in early stage if dispute/loss rate stays low.

## 4) Sensitivity Table (Example)
| Avg Project | Fee % | Projects per Client | LTV |
|---|---:|---:|---:|
| 700,000₮ | 10% | 2 | 140,000₮ |
| 1,000,000₮ | 12% | 3 | 360,000₮ |
| 1,500,000₮ | 15% | 3 | 675,000₮ |

## 5) Guardrails
- Refund/dispute reserve policy шаардлагатай
- Fraud prevention for fake projects/proposals
- Commission changes tracked via admin settings
- Ledger-level reconciliation mandatory for payouts

## 6) KPI Dashboard (Must-have)
- GMV (gross marketplace value)
- Net revenue (commission + fees)
- Take rate
- Completion vs dispute ratio
- CAC by channel
- 30/60/90-day retention (client + freelancer)
