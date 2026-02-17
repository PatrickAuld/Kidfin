import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="text-sm text-zinc-600">Signed in as {user?.email}</p>

      <form action="/auth/sign-out" method="post">
        <button className="rounded-md border px-3 py-2 text-sm" type="submit">
          Sign out
        </button>
      </form>
    </div>
  );
}
