# Kidfin — Project Plan (V1)

Kidfin is a clean, minimal web app for parents to manage **virtual bank accounts** for their children.
Parents can record credits (allowance, gifts, chores) and debits (spending), and optionally apply **simulated interest** to teach savings and compound growth.

## Product constraints (decided)

- **Parents only**: children are data records (no child logins)
- **Atomic family model**: one family per parent; no blended/multi-family
- **Currency/i18n**: USD-only, English-only
- **Permissions**: all parents in a family have full access
- **Ledger**: append-only transactions (corrections via adjustment entries)
- **Automation**: no recurring allowances in V1
- **Notifications/export/goals**: none in V1
- **Interest**:
  - no rate cap
  - family-wide default with per-child override
  - applies to full balance
  - **show interest earned is required**

---

## V1 deliverables

1) Auth: signup/signin (password) + magic link
2) Onboarding: create family; add children
3) Accounts: one account per child; show balance
4) Transactions: manual credit/debit + history + basic filtering
5) Interest: configure + scheduled postings + interest history
6) Polish: mobile responsiveness, accessibility basics, error handling, deploy

---

## V1 tasks (dependency-mapped)

Legend: `T#` task id. Dependencies listed as `depends on: ...`.

### Foundation

**T1 — Scaffold Next.js + Tailwind**
- Output: Next.js app lives in `web/` (App Router + TS + Tailwind + ESLint)
- depends on: —

**T2 — Env/config conventions**
- Output: `.env.example`, config helper (Supabase URL/anon key), build/deploy notes
- depends on: T1

**T3 — Layout shell**
- Output: basic app layout (header/nav), empty routes
- depends on: T1

### Supabase + Auth

**T4 — Supabase project bootstrap**
- Output: Supabase project created, auth enabled, connection info
- depends on: —

**T5 — Supabase client helpers (server + browser)**
- Output: helpers for session, server actions, and client components
- depends on: T1, T4

**T6 — Auth pages (email/password)**
- Output: signup/signin UI and server actions
- depends on: T5

**T7 — Magic link auth**
- Output: alternative sign-in flow
- depends on: T6

**T8 — Route protection**
- Output: middleware or server-side guards for authenticated sections
- depends on: T6

### Core DB schema + RLS

**T9 — Core schema migration (families/parents/children/accounts/transactions + enums)**
- Output: SQL migrations (or Drizzle) for core tables
- depends on: T4

**T10 — RLS policies (core)**
- Output: RLS enabled + policies enforcing family isolation based on parents.user_id = auth.uid()
- depends on: T9

**T11 — Seed/dev fixture**
- Output: seed script or SQL for local dev
- depends on: T9 (optionally T10)

**T12 — Balance strategy implementation**
- Decision: denormalized `accounts.balance` updated by DB trigger on insert
- Output: trigger/function; invariant tests; correction via adjustment
- depends on: T9

### Onboarding + family management UI

**T13 — First-run onboarding: create family**
- Output: if user has no parent/family record, create family + parent row
- depends on: T8, T9, T10

**T14 — Add child flow (creates child + account)**
- Output: UI + server actions
- depends on: T13, T12

**T15 — Family settings**
- Output: rename family, list parents, list children
- depends on: T13

**T16 — Invite co-parent**
- Output: invite link generation + accept flow
- Implementation note: add `invites` table + RLS; emailing can be deferred (copy link)
- depends on: T13, T9, T10

### Transactions (core product)

**T17 — Dashboard: children list + balances**
- Output: home/dashboard showing each child + balance
- depends on: T14, T12

**T18 — Create transaction: credit**
- Output: add money (allowance/gift/chore/other)
- depends on: T17, T9, T10, T12

**T19 — Create transaction: debit**
- Output: spend/withdrawal
- depends on: T17, T9, T10, T12

**T20 — Transaction history per child + basic filtering**
- Output: list transactions, filter by type/category/date range
- depends on: T18, T19

**T21 — Append-only corrections**
- Output: UI affordance to add an adjustment entry; no editing/deleting
- depends on: T18, T19

### Interest (required)

**T22 — Interest schema migration (interest_settings, interest_ledger)**
- Output: tables + enums; family default + per-account override
- depends on: T9

**T23 — Interest configuration UI**
- Output: set family default rate/frequency; per-child override
- depends on: T22, T15

**T24 — Interest posting job**
- Output: scheduled Edge Function (or pg_cron) that:
  - selects eligible accounts
  - calculates interest for period
  - inserts `transactions` row (category: interest)
  - writes `interest_ledger` audit row
  - updates account balance (via same balance mechanism)
- depends on: T22, T12, T18/T19

**T25 — Interest history (show interest earned)**
- Output: per-child interest ledger view and/or highlight interest transactions
- depends on: T24, T20

### Quality + Launch

**T26 — Error handling + loading states**
- depends on: T13–T25 (iterative)

**T27 — Mobile responsiveness + a11y basics**
- depends on: T3, T13–T25 (iterative)



### Growth gating (pre-launch)

**T29 — Gate new signups with referral codes**
- Goal: prevent open public signups before launch
- Output: referral code generation + validation; sign-up blocked unless code is present
- UX: add a referral code field to sign-up; handle invite links
- Storage: a  table (hashed codes) or KV equivalent; track usage
- depends on: T6 (sign-up), T4 (Supabase)

---

## Parallelization suggestions

- While UI scaffolding (T1–T3) is happening, DB/RLS can proceed (T9–T12) and Supabase bootstrap (T4–T6) can proceed.
- Interest (T22–T25) can start as soon as transactions + balance (T12, T18/T19) exist.

---

## Files to keep / consolidate

This repo now treats `plans/PROJECT_PLAN.md` as the single source of truth for V1 work.
Other plan docs can remain for history, but should not be required reading to start.
