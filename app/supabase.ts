import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vshglekspdbjnxngudmc.supabase.co";
const supabaseKey = "sb_publishable_kzsAi2dFuLrMjcr6R06MNw_8Vuv5Ilq";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});