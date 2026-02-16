import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-16">
      <header className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight">Kidfin</h1>
        <p className="text-zinc-600">
          Virtual allowances, spending, and interest — for kids.
        </p>
      </header>

      <main className="mt-10 space-y-6">
        <div className="flex gap-3">
          <Link
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
            href="/sign-in"
          >
            Sign in
          </Link>
          <Link
            className="rounded-md border px-4 py-2 text-sm font-medium"
            href="/sign-up"
          >
            Create account
          </Link>
        </div>

        <p className="text-sm text-zinc-600">
          Parents only. Children don’t have logins.
        </p>
      </main>
    </div>
  );
}
