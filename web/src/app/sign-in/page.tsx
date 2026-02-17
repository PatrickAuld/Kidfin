import Link from "next/link";
import { sendMagicLink, signInWithPassword } from "./actions";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string; redirectTo?: string }>;
}) {
  const sp = await searchParams;
  const error = sp.error ? decodeURIComponent(sp.error) : null;
  const sent = sp.sent === "1";

  return (
    <div className="mx-auto w-full max-w-md space-y-6 py-12">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="text-sm text-zinc-600">
          Welcome back. Sign in to manage your family’s accounts.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {sent && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Magic link sent. Check your email.
        </div>
      )}

      <form action={signInWithPassword} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            className="w-full rounded-md border px-3 py-2"
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            className="w-full rounded-md border px-3 py-2"
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </div>

        <button
          className="w-full rounded-md bg-black px-3 py-2 text-white"
          type="submit"
        >
          Sign in
        </button>
      </form>

      <div className="border-t pt-6">
        <form action={sendMagicLink} className="space-y-3">
          <div className="text-sm font-medium">Or email me a magic link</div>
          <input
            className="w-full rounded-md border px-3 py-2"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
          />
          {/* Sign-in is gated by /referral; no referral field here. */}
          <button
            className="w-full rounded-md border px-3 py-2"
            type="submit"
          >
            Send magic link
          </button>
        </form>
      </div>

      <div className="text-sm text-zinc-600">
        Don’t have an account? <Link href="/sign-up">Sign up</Link>
      </div>
    </div>
  );
}
