
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qqfyjrugrinmdijpsutj.supabase.co'
const supabaseKey = 'sb_publishable_KzDns19CaSpI-40YZgPPCg_hCDb-1Iz'

export const supabase = createClient(supabaseUrl, supabaseKey)
