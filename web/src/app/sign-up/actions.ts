"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signUpWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const referralCode = String(formData.get("referral_code") ?? "");

  const { isValidReferralCode } = await import("@/lib/referral");
  if (!isValidReferralCode(referralCode)) {
    redirect("/sign-up?error=Invalid%20referral%20code");
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    redirect(`/sign-up?error=${encodeURIComponent(error.message)}`);
  }

  // Depending on Supabase email confirmation settings, user may need to confirm.
  redirect("/app");
}
