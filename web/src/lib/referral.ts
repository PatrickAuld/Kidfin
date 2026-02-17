import { cookies } from "next/headers";

export const REFERRAL_COOKIE_NAME = "kidfin_referral_ok";

export async function hasReferralAccess(): Promise<boolean> {
  const store = await cookies();
  return store.get(REFERRAL_COOKIE_NAME)?.value === "1";
}

export async function setReferralAccessCookie() {
  const store = await cookies();
  store.set(REFERRAL_COOKIE_NAME, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}
