import Link from "next/link";
import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-3xl px-6 py-10">
      <header className="mb-10 flex items-center justify-between">
        <Link href="/app" className="text-lg font-semibold">
          Kidfin
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link href="/app">Dashboard</Link>
          <Link href="/app/settings">Settings</Link>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
