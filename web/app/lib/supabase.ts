import { createClient } from "@supabase/supabase-js";

// Fallbacks let the module load during SSR/build without real credentials.
// Auth operations will fail at runtime until real values are supplied in .env.local.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
