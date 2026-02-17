import { submitReferralCode } from "./actions";

export default async function ReferralPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const sp = await searchParams;
  const error = sp.error ? decodeURIComponent(sp.error) : null;
  const next = sp.next ?? "/sign-in";

  return (
    <div className="mx-auto w-full max-w-md space-y-6 py-12">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Early access</h1>
        <p className="text-sm text-zinc-600">
          Kidfin is currently invite-only. Enter a referral code to continue.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <form action={submitReferralCode} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="referral_code">
            Referral code
          </label>
          <input
            className="w-full rounded-md border px-3 py-2"
            id="referral_code"
            name="referral_code"
            required
            autoComplete="off"
          />
        </div>

        <button
          className="w-full rounded-md bg-black px-3 py-2 text-sm font-medium text-white"
          type="submit"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
