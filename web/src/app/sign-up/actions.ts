"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getReferralCodeHash, hasReferralAccess } from "@/lib/referral";

export async function signUpWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!(await hasReferralAccess())) {
    redirect("/referral?next=/sign-up");
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    redirect(`/sign-up?error=${encodeURIComponent(error.message)}`);
  }

  // Best-effort referral attribution (works when signUp creates a session).
  const codeHash = await getReferralCodeHash();
  if (codeHash) {
    await supabase.rpc("redeem_referral_code_hash", { p_code_hash: codeHash });
  }

  redirect("/app");
}
