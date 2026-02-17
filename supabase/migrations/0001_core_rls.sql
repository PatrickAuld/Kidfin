-- Kidfin core schema + Row Level Security (RLS)
--
-- Atomic family model:
-- - One family per parent (auth user).
-- - Parents have full access within their family.
-- - Children are data only (no auth).
--
-- Ledger model:
-- - Transactions are append-only (no updates/deletes via RLS policies).
-- - Corrections are recorded via category = 'adjustment'.

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
DO $$ BEGIN
  CREATE TYPE public.transaction_type AS ENUM ('credit', 'debit');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.transaction_category AS ENUM (
    'allowance',
    'gift',
    'chore',
    'interest',
    'withdrawal',
    'adjustment',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Tables
CREATE TABLE IF NOT EXISTS public.families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.parents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  avatar_url text,
  date_of_birth date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  child_id uuid NOT NULL UNIQUE REFERENCES public.children(id) ON DELETE CASCADE,
  balance numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  type public.transaction_type NOT NULL,
  category public.transaction_category NOT NULL DEFAULT 'other',
  amount numeric NOT NULL CHECK (amount > 0),
  note text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS parents_family_id_idx ON public.parents(family_id);
CREATE INDEX IF NOT EXISTS children_family_id_idx ON public.children(family_id);
CREATE INDEX IF NOT EXISTS accounts_family_id_idx ON public.accounts(family_id);
CREATE INDEX IF NOT EXISTS transactions_account_id_occurred_at_idx ON public.transactions(account_id, occurred_at DESC);

-- Helper: is current user a parent in the family?
CREATE OR REPLACE FUNCTION public.is_parent_in_family(p_family_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.parents p
    WHERE p.user_id = auth.uid()
      AND p.family_id = p_family_id
  );
$$;

-- RLS enablement
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Families: parents can read their family row.
DROP POLICY IF EXISTS families_select_own ON public.families;
CREATE POLICY families_select_own
ON public.families
FOR SELECT
TO authenticated
USING (public.is_parent_in_family(id));

-- Families: allow insert (create family) for authenticated users.
-- Note: app should also insert into parents table to link the creator.
DROP POLICY IF EXISTS families_insert_authenticated ON public.families;
CREATE POLICY families_insert_authenticated
ON public.families
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Families: update name by parents in family.
DROP POLICY IF EXISTS families_update_own ON public.families;
CREATE POLICY families_update_own
ON public.families
FOR UPDATE
TO authenticated
USING (public.is_parent_in_family(id))
WITH CHECK (public.is_parent_in_family(id));

-- Parents: select within family
DROP POLICY IF EXISTS parents_select_family ON public.parents;
CREATE POLICY parents_select_family
ON public.parents
FOR SELECT
TO authenticated
USING (public.is_parent_in_family(family_id));

-- Parents: insert only into a family the user is joining.
-- For V1, simplest: only allow inserting a parent row if user_id = auth.uid().
DROP POLICY IF EXISTS parents_insert_self ON public.parents;
CREATE POLICY parents_insert_self
ON public.parents
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
);

-- Parents: updates allowed only for self row within family (e.g. display_name)
DROP POLICY IF EXISTS parents_update_self ON public.parents;
CREATE POLICY parents_update_self
ON public.parents
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Children: parents in family can read/write
DROP POLICY IF EXISTS children_select_family ON public.children;
CREATE POLICY children_select_family
ON public.children
FOR SELECT
TO authenticated
USING (public.is_parent_in_family(family_id));

DROP POLICY IF EXISTS children_insert_family ON public.children;
CREATE POLICY children_insert_family
ON public.children
FOR INSERT
TO authenticated
WITH CHECK (public.is_parent_in_family(family_id));

DROP POLICY IF EXISTS children_update_family ON public.children;
CREATE POLICY children_update_family
ON public.children
FOR UPDATE
TO authenticated
USING (public.is_parent_in_family(family_id))
WITH CHECK (public.is_parent_in_family(family_id));

-- Accounts: parents in family can read; inserts/updates restricted to family.
DROP POLICY IF EXISTS accounts_select_family ON public.accounts;
CREATE POLICY accounts_select_family
ON public.accounts
FOR SELECT
TO authenticated
USING (public.is_parent_in_family(family_id));

DROP POLICY IF EXISTS accounts_insert_family ON public.accounts;
CREATE POLICY accounts_insert_family
ON public.accounts
FOR INSERT
TO authenticated
WITH CHECK (public.is_parent_in_family(family_id));

-- Accounts: only allow updates by parents in family.
-- Balance will be updated by DB function/trigger later.
DROP POLICY IF EXISTS accounts_update_family ON public.accounts;
CREATE POLICY accounts_update_family
ON public.accounts
FOR UPDATE
TO authenticated
USING (public.is_parent_in_family(family_id))
WITH CHECK (public.is_parent_in_family(family_id));

-- Transactions: parents can read transactions for accounts in their family.
DROP POLICY IF EXISTS transactions_select_family ON public.transactions;
CREATE POLICY transactions_select_family
ON public.transactions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.accounts a
    WHERE a.id = transactions.account_id
      AND public.is_parent_in_family(a.family_id)
  )
);

-- Transactions: append-only inserts by parents; created_by must be auth.uid().
DROP POLICY IF EXISTS transactions_insert_family ON public.transactions;
CREATE POLICY transactions_insert_family
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.accounts a
    WHERE a.id = transactions.account_id
      AND public.is_parent_in_family(a.family_id)
  )
);

-- Transactions: disallow updates/deletes via absence of policies.
-- (RLS enabled: without UPDATE/DELETE policies, these are denied.)
