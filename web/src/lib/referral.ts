import { cookies } from "next/headers";

export const REFERRAL_COOKIE_NAME = "kidfin_referral_ok";
export const REFERRAL_CODE_HASH_COOKIE_NAME = "kidfin_referral_code_hash";

export async function hasReferralAccess(): Promise<boolean> {
  const store = await cookies();
  return store.get(REFERRAL_COOKIE_NAME)?.value === "1";
}

export async function getReferralCodeHash(): Promise<string | null> {
  const store = await cookies();
  return store.get(REFERRAL_CODE_HASH_COOKIE_NAME)?.value ?? null;
}

export async function setReferralAccessCookies({
  codeHash,
}: {
  codeHash: string;
}) {
  const store = await cookies();

  // gate cookie
  store.set(REFERRAL_COOKIE_NAME, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  // store the hashed code so we can attribute signups later without keeping plaintext
  store.set(REFERRAL_CODE_HASH_COOKIE_NAME, codeHash, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}
