import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cookieOptions, getSupabaseConfig, isDemoMode } from '@/lib/supabase/config'
import { DEMO_COOKIE, demoAccounts } from '@/lib/demo/accounts'

function setDemoCookie(value: string, maxAge: number) {
  document.cookie = `${DEMO_COOKIE}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`
}

// Demo mode: just enough of the auth API for the sign-in / sign-out UI.
function createDemoBrowserClient() {
  return {
    auth: {
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        const account = demoAccounts.find((a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password)
        if (!account) return { data: { user: null, session: null }, error: { message: 'Invalid login credentials', code: 'invalid_credentials' } }
        setDemoCookie(account.id, 60 * 60 * 24 * 7)
        return { data: { user: { id: account.id, email: account.email }, session: {} }, error: null }
      },
      signUp: async () => ({
        data: { user: null, session: null },
        error: { message: 'Sign-up is disabled in demo mode.', code: 'demo_mode' },
      }),
      signOut: async () => {
        setDemoCookie('', 0)
        return { error: null }
      },
    },
  }
}

export function createClient(): SupabaseClient {
  if (isDemoMode()) return createDemoBrowserClient() as unknown as SupabaseClient

  const { url, key } = getSupabaseConfig()
  return createBrowserClient(url, key, { cookieOptions })
}
