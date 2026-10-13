import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return Boolean(
    url && publishableKey &&
      !url.includes("YOUR_PROJECT_REF") &&
      !publishableKey.includes("YOUR_SUPABASE_PUBLISHABLE_KEY")
  );
}

/** Browser-side Supabase client. Never put a service-role key in NEXT_PUBLIC_* variables. */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey || url.includes("YOUR_PROJECT_REF") || publishableKey.includes("YOUR_SUPABASE_PUBLISHABLE_KEY")) return null;
  if (!browserClient) browserClient = createClient(url, publishableKey);
  return browserClient;
}
