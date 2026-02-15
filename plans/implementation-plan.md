# Kids Financial Tracker — Implementation Plan

## Vision

A family-friendly financial tracker where parents can manage virtual "bank accounts" for their children — tracking allowances, gift money, debits, and simulated interest — to teach kids about money, saving, and the power of compound growth.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router) + React + Tailwind CSS |
| Auth | Supabase Auth (email/password + magic link) |
| Database | Supabase (Postgres) with Row-Level Security |
| Hosting | Vercel (or similar) |
| Cron / Interest | Supabase Edge Functions (or pg_cron) |

---

## Data Model (Supabase / Postgres)

```
┌──────────────┐         ┌──────────────┐
│ families     │──1:N───│ parents       │ (auth users)
└──────────────┘         └──────────────┘
       │
       │──1:N──┌──────────────┐
       └──────▶│ children      │ (data only, no auth)
               └──────────────┘
                      │ 1:1
                      ▼
               ┌──────────────┐
               │ accounts      │ (one per child)
               └──────────────┘
                      │ 1:N
                      ▼
               ┌──────────────────┐
               │ transactions      │
               │ (credits/debits)  │
               └──────────────────┘

┌─────────────────────┐
│ interest_settings    │ (per-family or per-account config)
└─────────────────────┘

┌─────────────────────┐
│ interest_ledger      │ (audit log of interest postings)
└─────────────────────┘
```

### Key Tables

#### families
- id (uuid, PK)
- name (text) — e.g. "The Johnsons"
- created_at

#### parents
- id (uuid, PK)
- family_id (FK → families)
- user_id (FK → auth.users, unique)
- display_name (text)
- created_at

#### children
- id (uuid, PK)
- family_id (FK → families)
- display_name (text)
- avatar_url (text, nullable)
- date_of_birth (date, nullable)
- created_at

#### accounts
- id (uuid, PK)
- family_id (FK → families)
- child_id (FK → children)
- balance (numeric, default 0) — denormalized running balance
- currency (text, default USD)
- created_at

#### transactions
- id (uuid, PK)
- account_id (FK → accounts)
- type (enum: credit | debit)
- category (enum: allowance | gift | chore | interest | withdrawal | adjustment | other)
- amount (numeric, positive)
- note (text, nullable) — e.g. "Birthday money from Grandma"
- created_by (FK → auth.users)
- created_at

#### interest_settings
- id (uuid, PK)
- account_id (FK → accounts) — nullable for family-wide defaults
- family_id (FK → families)
- annual_rate (numeric) — e.g. 5.0 for 5%
- compound_frequency (enum: daily | weekly | monthly)
- is_active (boolean)
- created_at, updated_at

#### interest_ledger
- id (uuid, PK)
- account_id (FK → accounts)
- amount (numeric)
- balance_before (numeric)
- balance_after (numeric)
- rate_snapshot (numeric)
- period_start (timestamptz)
- period_end (timestamptz)
- created_at

---

## Row-Level Security (RLS) Strategy

All tables have RLS enabled. Policies are simple with the atomic family model:

- Parents can read/write all data within their own family (verified by joining parents.user_id = auth.uid() → parents.family_id).
- No cross-family access ever.
- No child auth users — children have no Supabase auth accounts, so no child-facing RLS needed.
- Interest cron uses a service_role key (server-side only, bypasses RLS).

---

## Authentication Flow

Parents only — no child login.
