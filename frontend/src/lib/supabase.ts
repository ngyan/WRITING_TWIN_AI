import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Lazy-initialized so the module can be imported at build time without
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY being set in the build environment.
// The client is created on first request (when the API route handler runs).
let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _client;
}
