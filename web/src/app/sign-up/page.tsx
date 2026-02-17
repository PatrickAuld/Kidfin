import Link from "next/link";
import { signUpWithPassword } from "./actions";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const error = sp.error ? decodeURIComponent(sp.error) : null;

  return (
    <div className="mx-auto w-full max-w-md space-y-6 py-12">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <p className="text-sm text-zinc-600">
          Kidfin is for parents. Children don’t log in.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <form action={signUpWithPassword} className="space-y-4">
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
            autoComplete="new-password"
          />
        </div>

        <button
          className="w-full rounded-md bg-black px-3 py-2 text-white"
          type="submit"
        >
          Sign up
        </button>
      </form>

      <div className="text-sm text-zinc-600">
        Already have an account? <Link href="/sign-in">Sign in</Link>
      </div>
    </div>
  );
}
