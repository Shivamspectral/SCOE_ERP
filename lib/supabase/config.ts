const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Use demo mode when explicitly requested, or when no Supabase credentials
 * have been configured yet. This lets the prototype start before the
 * institution connects its Supabase project.
 *
 * If only one credential is present, demo mode is not enabled; getSupabaseConfig
 * will show a useful configuration error instead of silently hiding a typo.
 */
export function isDemoMode() {
  const hasUrl = Boolean(supabaseUrl)
  const hasKey = Boolean(supabaseKey)

  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') return true
  if (!hasUrl && !hasKey) return true

  return false
}

export function getSupabaseConfig() {
  const url = supabaseUrl
  const key = supabaseKey

  if (!url || !key) {
    throw new Error(
      'Supabase configuration is incomplete. Set both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (see .env.example), or remove partial Supabase settings to use demo mode.',
    )
  }

  return { url, key }
}

export const cookieOptions = { secure: process.env.NODE_ENV === 'production' }
