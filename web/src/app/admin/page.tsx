import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) notFound();

  return { supabase, user };
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const created = sp.created ? decodeURIComponent(sp.created) : null;
  const error = sp.error ? decodeURIComponent(sp.error) : null;

  const { supabase } = await requireAdmin();

  const { data: codes, error: codesError } = await supabase
    .from("referral_codes")
    .select(
      "id, code_prefix, note, disabled, max_uses, uses_count, created_at, created_by",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: redemptions, error: redemptionsError } = await supabase
    .from("referral_redemptions")
    .select("referral_code_id")
    .limit(5000);

  if (codesError) throw codesError;
  if (redemptionsError) throw redemptionsError;

  const redemptionCounts = new Map<string, number>();
  for (const r of (redemptions ?? []) as Array<{ referral_code_id: string }>) {
    const id = r.referral_code_id;
    redemptionCounts.set(id, (redemptionCounts.get(id) ?? 0) + 1);
  }

  async function createCode(formData: FormData) {
    "use server";

    const note = String(formData.get("note") ?? "").trim() || null;
    const maxUsesRaw = String(formData.get("max_uses") ?? "").trim();
    const maxUses = maxUsesRaw ? Number.parseInt(maxUsesRaw, 10) : null;

    const { supabase } = await requireAdmin();

    const raw = `KIDFIN-${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`
      .toUpperCase()
      .trim();

    const msg = new TextEncoder().encode(raw);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msg);
    const hash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const prefix = raw.slice(0, 6);

    const { error } = await supabase.from("referral_codes").insert({
      code_hash: hash,
      code_prefix: prefix,
      note,
      max_uses: Number.isFinite(maxUses ?? NaN) ? maxUses : null,
      disabled: false,
    });

    if (error) {
      const qs = encodeURIComponent(error.message);
      redirect(`/admin?error=${qs}`);
    }

    redirect(`/admin?created=${encodeURIComponent(raw)}`);
  }

  async function disableCode(formData: FormData) {
    "use server";

    const id = String(formData.get("id") ?? "").trim();
    if (!id) return;

    const { supabase } = await requireAdmin();
    const { error } = await supabase
      .from("referral_codes")
      .update({ disabled: true })
      .eq("id", id);

    if (error) throw error;
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-sm text-zinc-600">Manage referral codes.</p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {created && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          New referral code (copy now — it won’t be shown again):
          <div className="mt-2 font-mono text-base">{created}</div>
        </div>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Create referral code</h2>
        <form action={createCode} className="grid gap-3 sm:grid-cols-3">
          <input
            className="rounded-md border px-3 py-2 text-sm"
            name="note"
            placeholder="Note (optional)"
          />
          <input
            className="rounded-md border px-3 py-2 text-sm"
            name="max_uses"
            placeholder="Max uses (optional)"
            inputMode="numeric"
          />
          <button
            className="rounded-md bg-black px-3 py-2 text-sm font-medium text-white"
            type="submit"
          >
            Create
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Referral codes</h2>
        {!codes || codes.length === 0 ? (
          <p className="text-sm text-zinc-600">No codes yet.</p>
        ) : (
          <div className="space-y-3">
            {codes.map((c) => (
              <div
                key={c.id}
                className="rounded-md border px-4 py-3 text-sm"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="font-mono">{c.code_prefix}…</div>
                  <div className="text-zinc-600">
                    {c.disabled ? "disabled" : "active"} · redeemed {redemptionCounts.get(c.id) ?? 0}
                    {c.max_uses ? `/${c.max_uses}` : ""}
                  </div>
                </div>
                {c.note && <div className="mt-2 text-zinc-600">{c.note}</div>}
                {!c.disabled && (
                  <form action={disableCode} className="mt-3">
                    <input type="hidden" name="id" value={c.id} />
                    <button
                      className="rounded-md border px-3 py-1.5 text-xs"
                      type="submit"
                    >
                      Disable
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
