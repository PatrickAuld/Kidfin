import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getReferralCodeHash } from "@/lib/referral";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/app";

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);

    // Attribute referral code to the newly logged-in user (best-effort).
    const codeHash = await getReferralCodeHash();
    if (codeHash) {
      await supabase.rpc("redeem_referral_code_hash", {
        p_code_hash: codeHash,
      });
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
