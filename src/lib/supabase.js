import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://rnkdzthceewfpjqycepy.supabase.co"
const supabaseKey = "sb_publishable_vt8vlZ80f2GxMF43pRRWBA_WdCfMqq4"

export const supabase = createClient(supabaseUrl, supabaseKey)