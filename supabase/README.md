# Supabase migrations

This folder contains SQL migrations for Kidfin.

## Applying

Recommended: use Supabase CLI.

- `supabase link --project-ref <ref>`
- `supabase db push`

Or run the SQL manually in the Supabase SQL editor.

## Notes

- Core schema + RLS lives in `migrations/0001_core_rls.sql`.
- Transactions are append-only via RLS (INSERT + SELECT only).
