import 'server-only'

import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { cookieOptions, getSupabaseConfig, isDemoMode } from '@/lib/supabase/config'
import { createDemoServerClient } from '@/lib/demo/db'

export async function createClient(): Promise<SupabaseClient> {
  if (isDemoMode()) {
    return (await createDemoServerClient()) as unknown as SupabaseClient
  }

  const { url, key } = getSupabaseConfig()
  const cookieStore = await cookies()

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
