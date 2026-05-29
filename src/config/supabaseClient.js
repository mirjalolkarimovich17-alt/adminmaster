import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Dynamic tenant from URL or env
export const getTenantId = async () => {
  const url = window.location.pathname
  const slugMatch = url.match(/\/@([^/]+)/)
  if (slugMatch) {
    const { data } = await supabase
      .from('barbershops')
      .select('id, name, theme_color, logo')
      .eq('slug', slugMatch[1])
      .maybeSingle()
    return data
  }
  return { id: import.meta.env.VITE_TENANT_ID }
}

export const TENANT_ID = import.meta.env.VITE_TENANT_ID
