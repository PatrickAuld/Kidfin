# Auth, Family Model, and Milestones

## Authentication + Family Flow

1. Parent signs up via email/password (or magic link).
2. Parent creates a family and is auto-assigned the parent role.
3. Parent invites co-parent via email → generates an invite link; co-parent signs up and is added to the same family as parent.
4. Parent adds children as data records (name, avatar) — children are not auth users; they are entries in the children table managed entirely by parents.

## Family Model

Atomic.

- One family per parent.
- No multi-family / blended-family support.

This keeps the data model and RLS policies straightforward.

---

## Milestones & Discrete Steps

### Milestone 1: Project Scaffolding & Auth (Week 1)
- [ ] Initialize Next.js project with Tailwind CSS
- [ ] Set up Supabase project (database, auth, storage)
- [ ] Configure Supabase client (server + browser helpers)
- [ ] Implement sign-up / sign-in pages (email + password)
- [ ] Implement magic link sign-in as alternative
- [ ] Build auth middleware (protect routes)
- [ ] Create basic layout shell (nav, sidebar, footer)

### Milestone 2: Family & Member Management (Week 2)
- [ ] Create families + parents + children tables + RLS policies
- [ ] Build "Create Family" onboarding flow for first-time parents
- [ ] Build "Invite Co-Parent" flow (email invite → accept → join family)
- [ ] Build "Add Child" form (name, optional avatar, optional DOB)
- [ ] Build Family Settings page (rename family, manage members, remove child)
- [ ] Write database seed script for development

### Milestone 3: Accounts & Transactions — Core (Week 3)
- [ ] Create accounts + transactions tables + RLS
- [ ] Build parent dashboard: list of children with balances
- [ ] Build "Add Money" flow (credit: allowance, gift, chore, other)
- [ ] Build "Withdraw / Spend" flow (debit)
- [ ] Implement balance update trigger (Postgres function that updates accounts.balance on INSERT to transactions)
- [ ] Build transaction history view per child
- [ ] Add transaction filtering (by date range, category, type)

### Milestone 4: Interest Engine (Week 4)
- [ ] Create interest_settings + interest_ledger tables
- [ ] Build interest configuration UI (parent sets rate + frequency per child or family-wide)
- [ ] Write interest calculation Edge Function / pg_cron job:
  - Reads all active accounts with interest enabled
  - Calculates interest based on balance, rate, and compounding frequency
  - Inserts a transaction (category: interest) and an interest_ledger entry
  - Updates account balance
- [ ] Schedule the function (daily at midnight UTC, or per configured frequency)
- [ ] Build interest history view (show kids how their money grew)
- [ ] Add a "savings projection" mini-calculator (what will balance be in 6/12 months?)

### Milestone 5: Recurring Allowances & Automation (Week 5)
- [ ] Create recurring_allowances table (amount, frequency, day_of_week/month)
- [ ] Build UI for parents to set up recurring allowances per child
- [ ] Write Edge Function / cron to auto-post allowance transactions on schedule
- [ ] Add notification preferences (email digest to parents on allowance posted)

### Milestone 6: Polish, Testing & Launch (Week 6)
- [ ] End-to-end testing of all flows
- [ ] Mobile responsiveness pass
- [ ] Accessibility audit (ARIA, keyboard nav, color contrast)
- [ ] Error handling + loading states throughout
- [ ] Add confirmation dialogs for destructive actions (debits, deleting members)
- [ ] Set up production Supabase project + environment variables
- [ ] Deploy to Vercel
- [ ] Write a brief onboarding tutorial / first-run wizard

---

## Resolved Decisions

- Child login: None. Parents manage everything.
- Family model: Atomic. One family per parent, no blended-family support.

---

## Remaining Open Questions

### Interest model details

- Should interest compound on a set schedule (e.g., monthly) or should parents be able to choose (daily / weekly / monthly)?
