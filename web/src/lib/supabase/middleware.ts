import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export function createSupabaseMiddlewareClient({
  request,
  response,
  supabaseUrl,
  supabaseAnonKey,
}: {
  request: NextRequest;
  response: NextResponse;
  supabaseUrl: string;
  supabaseAnonKey: string;
}) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });
}
