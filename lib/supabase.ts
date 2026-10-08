import { createClient } from "@supabase/supabase-js";

export const NUSA_SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://abdhojyqvffprfqskwmt.supabase.co";

export const NUSA_SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_odIAv9TZ_IFMVemgSaSwrQ_v61P4cM5";

export const supabase = createClient(NUSA_SUPABASE_URL, NUSA_SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
