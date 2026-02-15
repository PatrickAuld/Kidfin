# Open Questions + Scope Decisions

This doc lists the remaining product decisions that affect schema, RLS, UX, and implementation complexity.

## 1) Interest model details

- Should there be a cap on interest rate to prevent silly configurations (e.g., 1000%)?
- Is the interest rate per-child or family-wide?
- Should interest only apply to a "savings" bucket, or to the full balance?

## 2) Currency & localization

- Single currency (USD) or multi-currency support?
- Any need for localization / i18n?

## 3) Recurring allowances

- Do you want automatic recurring allowances (e.g., $5 every Saturday) in V1, or is manual crediting sufficient for launch?

## 4) Savings goals

- Should parents be able to set savings goals per child (e.g., "Save $50 for a video game") with a progress tracker?

## 5) Transaction approval workflow

- Should large debits require approval from a second parent?
- Or can any parent freely credit/debit?

## 6) Notifications

- Do you want email notifications for events like: allowance posted, interest earned, savings goal reached?

## 7) Data export

- Should parents be able to export transaction history (CSV/PDF)?

## 8) Audit trail

- Should transactions be immutable (append-only ledger, corrections via adjustment entries) or can parents edit/delete past transactions?

## 9) Visual theme

- Any preferences? Playful and colorful? Clean and minimal? Something in between?

## 10) V1 scope

Recommended lean V1 (4 weeks):

- Auth + family/parent management
- Add children + accounts
- Manual credit/debit transactions
- Interest engine

V2 additions:

- Recurring allowances
- Savings goals
- Notifications
- Data export

Question: does that split feel right?

---

## Decisions (2026-02-15)

- Interest cap: **No cap**.
- Interest setting scope: **Family-wide default with per-child override**.
- Interest applies to: **Full account balance**.
- Requirement: **Show interest earned**.
- Currency: **USD only**.
- Localization: **English only**.
- Recurring allowances: **Manual only (no automation in V1)**.
- Savings goals: **No**.
- Transaction approvals: **No**; all parents have full access.
- Notifications: **None**.
- Export: **None**.
- Audit trail: **Append-only ledger** (corrections via adjustment entries).
- Visual theme: **Clean, minimal**.
