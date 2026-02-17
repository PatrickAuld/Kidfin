export const EARLY_ACCESS_REFERRAL_CODE = "KIDFIN";

export function isValidReferralCode(input: string | null | undefined): boolean {
  if (!input) return false;
  return input.trim().toUpperCase() === EARLY_ACCESS_REFERRAL_CODE;
}
