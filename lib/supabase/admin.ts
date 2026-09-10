import 'server-only';
import { createClient } from '@supabase/supabase-js';

// SERVER ONLY. Bypasses RLS via the service (secret) key.
// Never import this into a Client Component.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
