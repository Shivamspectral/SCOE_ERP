import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'
import { demoAccounts, type DemoAccount } from '@/lib/demo/accounts'

// Demo-only deployment: no Vercel environment variables are required.
// WARNING: this signing key is in source control, so these sessions are NOT
// suitable for protecting real or sensitive institutional data.
const secret = 'astra-demo-session-key-public-source-demo-only-2026'

export function isLiveDemoLoginEnabled() {
  return true
}

export function createDemoSessionValue(accountId: string) {
  const signature = createHmac('sha256', secret).update(accountId).digest('hex')
  return `${accountId}.${signature}`
}

export function verifyDemoSessionValue(value: string | undefined | null): DemoAccount | null {
  if (!value) return null
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || (!process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
    return demoAccounts.find((account) => account.id === value) ?? null
  }

  const separator = value.lastIndexOf('.')
  if (separator < 1) return null
  const accountId = value.slice(0, separator)
  const supplied = value.slice(separator + 1)
  const expected = createHmac('sha256', secret).update(accountId).digest('hex')
  const suppliedBuffer = Buffer.from(supplied, 'hex')
  const expectedBuffer = Buffer.from(expected, 'hex')
  if (suppliedBuffer.length !== expectedBuffer.length || !timingSafeEqual(suppliedBuffer, expectedBuffer)) return null
  return demoAccounts.find((account) => account.id === accountId) ?? null
}
