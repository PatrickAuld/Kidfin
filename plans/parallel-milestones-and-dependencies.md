# Parallelizable Milestones & Task Dependency Map

Goal: break Kidfin into chunks that can be built in parallel while keeping the data model/RLS and UI flows coherent.

## Guiding constraints

- Parents only (no child auth).
- Atomic family model: one family per parent; no blended/multi-family.
- Supabase Auth + Postgres with RLS; server actions / route handlers use user session.

---

## Workstreams (can run in parallel)

### Stream A — Foundations (repo + app scaffolding)

**A1. Next.js + Tailwind scaffold**
- Output: Next.js app router project, Tailwind configured, basic lint/format tooling
- Depends on: none
- Unlocks: all UI work

**A2. Environment + config conventions**
- Output: .env.example, config helper, deployment environment expectations
- Depends on: A1
- Unlocks: local dev consistency

**A3. Layout shell + navigation**
- Output: header/sidebar layout, routing skeleton
- Depends on: A1
- Unlocks: feature pages can land inside shell

---

### Stream B — Supabase project + Auth (parents)

**B1. Supabase project bootstrap**
- Output: Supabase project created, local dev connection plan, storage bucket decision
- Depends on: none
- Unlocks: DB + auth + RLS work

**B2. Auth UI (signup/signin)**
- Output: sign up / sign in screens (password), session handling
- Depends on: A1, B1
- Unlocks: protected app routes

**B3. Magic link alternative**
- Output: magic link login flow
- Depends on: B2
- Unlocks: optional auth UX

**B4. Auth middleware / route protection**
- Output: middleware (or server-side guards) protecting app routes
- Depends on: B2
- Unlocks: all app pages assume auth

---

### Stream C — Core schema + RLS (family model)

**C1. Schema v1: families + parents + children + accounts + transactions**
- Output: SQL migrations for the core tables and enums
- Depends on: B1
- Unlocks: all core app functionality

**C2. RLS policies v1 (core tables)**
- Output: RLS enabled + policies enforcing family isolation
- Depends on: C1
- Unlocks: safe API usage from client/server

**C3. Seeds for dev**
- Output: seed script or SQL to create a sample family + parent + kids + accounts
- Depends on: C1 (optionally C2)
- Unlocks: faster UI iteration

**C4. Transaction invariants + balance strategy decision**
- Output: choose one:
  - (a) denormalized balance updated by DB trigger, or
  - (b) computed balance from transactions (view/materialized)
- Depends on: C1
- Unlocks: dashboard correctness

---

### Stream D — Family/member management UI

**D1. First-run onboarding: Create family**
- Output: if parent has no family, create one and insert parent row
- Depends on: B4, C1, C2
- Unlocks: everything else

**D2. Family settings page**
- Output: rename family, list parents, list children
- Depends on: D1

**D3. Add child flow**
- Output: create child + account
- Depends on: D1, C1, C2, C4
- Unlocks: dashboard data

**D4. Invite co-parent (email + invite token)**
- Output: generate invite link, accept flow adds parent to same family
- Depends on: D1, B1
- Notes: requires an `invites` table + RLS rules; email send can be deferred (manual copy link)

---

### Stream E — Transactions UX (core product)

**E1. Parent dashboard: children list + balances**
- Output: list children with account balances
- Depends on: D3, C4

**E2. Transaction entry: credit**
- Output: create credit transaction with category
- Depends on: E1, C1, C2, C4

**E3. Transaction entry: debit**
- Output: create debit transaction with category
- Depends on: E1, C1, C2, C4

**E4. Transaction history per child**
- Output: paginated history, filters
- Depends on: E2/E3

**E5. Editing policy decision (append-only vs editable)**
- Output: choose whether transactions are immutable
- Depends on: E2/E3
- Unlocks: admin corrections UX

---

### Stream F — Interest engine

**F1. Interest schema: settings + ledger**
- Output: tables for interest_settings and interest_ledger
- Depends on: C1

**F2. Interest calculation job (Edge Function or pg_cron)**
- Output: scheduled job to post interest transactions + ledger entries
- Depends on: F1, C4, E2/E3

**F3. Interest configuration UI**
- Output: per-family or per-child settings UI
- Depends on: F1, D2

**F4. Interest history view**
- Output: show interest postings per account
- Depends on: F2

Dependencies/decisions that affect this stream:
- open questions: rate caps, per-family vs per-child defaults, compounding frequency

---

### Stream G — Recurring allowances (optional V2)

**G1. Schema: recurring_allowances**
- Depends on: C1

**G2. Cron job: post allowance transactions**
- Depends on: G1, E2, C4

**G3. UI: configure allowances**
- Depends on: G1, D2

---

### Stream H — Quality, security hardening, and launch

**H1. E2E test plan + critical flows**
- Depends on: B4, D1, E2/E3

**H2. RLS audit + security checks**
- Depends on: C2

**H3. Observability + error handling**
- Depends on: A1, B2

**H4. Production deploy checklist**
- Depends on: A2, B1, C1

---

## Critical path (minimum to ship V1)

1. A1 → B1 → B2 → B4
2. C1 → C2 → D1 → D3
3. C4 → E1 → E2/E3 → E4
4. F1 → F2 → F3 (optional for V1 if interest included) → F4

---

## Suggested parallelization plan

- Week 1: A1/A2/A3 in parallel with B1/B2/B4 and C1/C2
- Week 2: D1/D3 + E1/E2/E3 while C3 seeds are added
- Week 3: E4 filtering + F1/F3
- Week 4: F2 cron + F4 + H1/H2/H4
