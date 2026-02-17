-- Referral tracking: record which referral code a user used.

CREATE TABLE IF NOT EXISTS public.referral_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id uuid NOT NULL REFERENCES public.referral_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS referral_redemptions_code_id_idx
  ON public.referral_redemptions (referral_code_id);

ALTER TABLE public.referral_redemptions ENABLE ROW LEVEL SECURITY;

-- Only admins can list redemptions.
DROP POLICY IF EXISTS referral_redemptions_admin_all ON public.referral_redemptions;
CREATE POLICY referral_redemptions_admin_all
ON public.referral_redemptions
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid()));

-- Redeem referral code for current user.
-- Takes a SHA-256 hex code hash (not plaintext) stored in a cookie.
CREATE OR REPLACE FUNCTION public.redeem_referral_code_hash(p_code_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_code_id uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  SELECT rc.id
    INTO v_code_id
  FROM public.referral_codes rc
  WHERE rc.code_hash = p_code_hash
    AND rc.disabled = false
    AND (rc.max_uses IS NULL OR rc.uses_count < rc.max_uses)
  LIMIT 1;

  IF v_code_id IS NULL THEN
    RETURN false;
  END IF;

  -- only one attribution per user
  INSERT INTO public.referral_redemptions (referral_code_id, user_id)
    VALUES (v_code_id, v_uid)
    ON CONFLICT (user_id) DO NOTHING;

  -- Count actual redemptions (not validations)
  UPDATE public.referral_codes
    SET uses_count = uses_count + 1
    WHERE id = v_code_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_referral_code_hash(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_referral_code_hash(text) TO authenticated;
