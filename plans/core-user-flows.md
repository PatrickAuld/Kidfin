# Kidfin — Core User Flows (V1)

This doc describes the core parent-facing flows for Kidfin.

## Entities (V1 mental model)

- **Parent (auth user)**: a logged-in Supabase Auth user.
- **Family**: a single household. Atomic model: one family per parent.
- **Child**: a record owned by a family (no login).
- **Account**: one per child; has a balance.
- **Transaction**: append-only ledger entries that credit/debit an account.
- **Interest settings**: family default + optional per-child override.

---

## Flow 1 — Parent signs up → creates family → adds children

**Goal:** A new parent can get to “I have kids with accounts and balances.”

**Steps:**
1) Parent visits site and selects **Create account**.
2) Parent signs up (email/password or magic link).
3) Parent lands in app and sees onboarding: **Create your family**.
4) Parent enters family name → family is created.
5) Parent is auto-added as a family member (parent role).
6) Parent adds first child (name, optional avatar/DOB).
7) System creates the child’s account.
8) Parent repeats for additional children.

**Success state:** Dashboard / family page shows each child and their current balance (starting at $0).

---

## Flow 2 — Parent links their account to an existing family (co-parent joins)

**Goal:** A co-parent can join an existing family that already has children and accounts.

**Steps:**
1) Existing parent opens **Family settings** and generates an invite link.
2) Co-parent opens invite link.
3) If not logged in, co-parent signs up/signs in.
4) Co-parent accepts invite.
5) Co-parent is added to the same family.

**Success state:** Co-parent can see the family dashboard with existing children and balances.

**Notes:**
- V1: invite link acceptance is sufficient; email sending can be added later.

---

## Flow 3 — Add a credit or debit transaction for a child

**Goal:** A parent records money in/out for a child.

**Inputs required:**
- amount (positive number)
- type: **credit** or **debit**
- date/time (defaults to now, editable)
- note (optional)

**Steps:**
1) Parent navigates to a child’s account detail page.
2) Parent chooses **Add credit** or **Add debit**.
3) Parent enters amount, date/time, optional note.
4) Parent submits.
5) System appends a new transaction.
6) System updates account balance.

**Success state:**
- Child’s balance updates.
- Transaction appears at top of transaction list.

---

## Flow 4 — View totals for each child on the family info page

**Goal:** A parent sees an overview of all kids and balances.

**Steps:**
1) Parent opens the Family page.
2) System shows list of children with:
   - current balance
   - (optional) recent activity snippet

**Success state:** Parent understands “who has what” at a glance.

---

## Flow 5 — View child details + transaction history

**Goal:** A parent sees account details for a specific child.

**Steps:**
1) Parent clicks a child from the family page.
2) System shows the child detail page including:
   - current balance
   - transaction list (append-only)
   - filters (date range, type, category) (if/when added)

**Success state:** Parent can audit history and understand the balance.

---

## Flow 6 — Set interest settings for the family (default)

**Goal:** Configure a family-wide interest rate and compounding frequency.

**Steps:**
1) Parent opens Family settings → Interest.
2) Parent sets annual rate + frequency (daily/weekly/monthly).
3) Parent saves.

**Success state:** New interest settings become the default for all children (unless overridden).

---

## Flow 7 — Set interest override for a specific child

**Goal:** Some children may have different interest rules.

**Steps:**
1) Parent opens a child detail page.
2) Parent enables “Override family interest” and sets rate/frequency.
3) Parent saves.

**Success state:** Interest job uses child override instead of family default.

---

## Flow 8 — Add a new child to an existing family

**Goal:** Add another child later.

**Steps:**
1) Parent opens Family settings or Family page.
2) Parent selects **Add child**.
3) Parent enters child name (+ optional avatar/DOB).
4) System creates child and account.

**Success state:** New child appears in family totals list with $0 balance.

---

## Flow 9 — Visual line chart of account balance on child detail page

**Goal:** Help kids/parents see growth over time.

**High-level behavior:**
- Chart shows balance over time.
- Balance is derived from transactions ordered by date/time.

**Steps:**
1) Parent opens child detail page.
2) System loads transactions and constructs a time series.
3) Chart renders (line).

**Success state:** The chart matches the ledger and current balance.

**Notes:**
- Even with denormalized balance, the chart should be derived from transactions (source of truth).
- For performance, consider materializing daily snapshots later if needed.
