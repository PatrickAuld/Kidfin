"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { setReferralAccessCookie } from "@/lib/referral";

function referralErrorUrl(message: string, next: string) {
  return (
    "/referral?error=" +
    encodeURIComponent(message) +
    "&next=" +
    encodeURIComponent(next)
  );
}

export async function submitReferralCode(formData: FormData) {
  const code = String(formData.get("referral_code") ?? "").trim();
  const next = String(formData.get("next") ?? "/sign-in");

  if (!code) {
    redirect(referralErrorUrl("Missing referral code", next));
  }

  const supabase = await createSupabaseServerClient();

  // Validate via RPC so we don't expose the referral_codes table.
  const { data, error } = await supabase.rpc("validate_referral_code", {
    p_code: code,
  });

  if (error) {
    redirect(referralErrorUrl(error.message, next));
  }

  if (data !== true) {
    redirect(referralErrorUrl("Invalid referral code", next));
  }

  await setReferralAccessCookie();
  redirect(next);
}
