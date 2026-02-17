"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/sign-in?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/app");
}

export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const referralCode = String(formData.get("referral_code") ?? "");

  // Supabase OTP can create new users depending on project settings.
  // During early access, require a referral code for magic links too.
  const { isValidReferralCode } = await import("@/lib/referral");
  if (!isValidReferralCode(referralCode)) {
    redirect("/sign-in?error=Invalid%20referral%20code");
  }

  const supabase = await createSupabaseServerClient();

  const { getSiteUrlFromEnv } = await import("@/lib/site-url");

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${getSiteUrlFromEnv()}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/sign-in?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/sign-in?sent=1");
}
