-- Referral codes + admin roles

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Admins: explicit allowlist of auth users.
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Referral codes are stored hashed (never store the plaintext code).
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash text NOT NULL UNIQUE,
  code_prefix text NOT NULL,
  note text,
  disabled boolean NOT NULL DEFAULT false,
  max_uses integer,
  uses_count integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS referral_codes_disabled_idx ON public.referral_codes(disabled);

-- Hash helper
CREATE OR REPLACE FUNCTION public.hash_referral_code(p_code text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT encode(digest(upper(trim(p_code)), 'sha256'), 'hex');
$$;

-- Validate referral code (RPC for early-access gating)
-- SECURITY DEFINER: lets anon/authenticated validate without selecting table.
CREATE OR REPLACE FUNCTION public.validate_referral_code(p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash text;
  v_ok boolean;
BEGIN
  v_hash := public.hash_referral_code(p_code);

  SELECT EXISTS(
    SELECT 1
    FROM public.referral_codes rc
    WHERE rc.code_hash = v_hash
      AND rc.disabled = false
      AND (rc.max_uses IS NULL OR rc.uses_count < rc.max_uses)
  ) INTO v_ok;

  IF v_ok THEN
    UPDATE public.referral_codes
      SET uses_count = uses_count + 1
      WHERE code_hash = v_hash;
  END IF;

  RETURN v_ok;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_referral_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_referral_code(text) TO anon, authenticated;

-- RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

-- Only admins can read and manage admin list.
DROP POLICY IF EXISTS admin_users_admin_all ON public.admin_users;
CREATE POLICY admin_users_admin_all
ON public.admin_users
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid()));

-- Referral codes: admins can manage.
DROP POLICY IF EXISTS referral_codes_admin_all ON public.referral_codes;
CREATE POLICY referral_codes_admin_all
ON public.referral_codes
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid()));

-- Lock down function ownership risk: only postgres role owns it; security definer uses creator.
-- (Supabase runs migrations as postgres.)
