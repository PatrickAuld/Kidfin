import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AppHomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-sm text-zinc-600">Signed in as {user?.email}</p>

      <p className="text-sm text-zinc-600">
        Next: create your family, add children, and start recording transactions.
      </p>
    </div>
  );
}
