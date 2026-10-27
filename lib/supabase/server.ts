import 'server-only'

import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { cookieOptions, getSupabaseConfig, isDemoMode } from '@/lib/supabase/config'
import { DEMO_COOKIE } from '@/lib/demo/accounts'
import { isLiveDemoLoginEnabled, verifyDemoSessionValue } from '@/lib/demo/session'
import { createDemoServerClient } from '@/lib/demo/db'

export async function createClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies()
  if (isDemoMode()) {
    return (await createDemoServerClient()) as unknown as SupabaseClient
  }

  const demoSession = verifyDemoSessionValue(cookieStore.get(DEMO_COOKIE)?.value)
  if (isLiveDemoLoginEnabled() && demoSession) {
    return (await createDemoServerClient()) as unknown as SupabaseClient
  }

  const { url, key } = getSupabaseConfig()

  return createServerClient(url, key, {
    cookieOptions,
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Server Components cannot write cookies; the Next.js proxy refreshes them.
        }
      },
    },
  })
}
