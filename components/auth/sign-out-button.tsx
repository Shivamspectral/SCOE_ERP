'use client'

import { useState } from 'react'
import { LogOut, LoaderCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function signOut() {
    setBusy(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
    router.refresh()
  }

  return (
    <Button type="button" variant="ghost" size={compact ? 'icon' : 'sm'} onClick={signOut} disabled={busy} aria-label="Sign out">
      {busy ? <LoaderCircle className="animate-spin" /> : <LogOut />}
      {!compact ? <span className="sr-only sm:not-sr-only">Sign out</span> : null}
    </Button>
  )
}
