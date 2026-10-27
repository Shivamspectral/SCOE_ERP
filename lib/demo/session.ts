import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'
import { demoAccounts, type DemoAccount } from '@/lib/demo/accounts'

const secret = process.env.DEMO_LOGIN_SECRET ?? ''

export function isLiveDemoLoginEnabled() {
  return process.env.DEMO_LOGIN_ENABLED === 'true' && secret.length >= 32
}

export function createDemoSessionValue(accountId: string) {
  if (!isLiveDemoLoginEnabled()) throw new Error('Live demo login is not enabled.')
  const signature = createHmac('sha256', secret).update(accountId).digest('hex')
  return `${accountId}.${signature}`
}

export function verifyDemoSessionValue(value: string | undefined | null): DemoAccount | null {
  if (!value) return null
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || (!process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
    return demoAccounts.find((account) => account.id === value) ?? null
  }
  if (!isLiveDemoLoginEnabled()) return null

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
