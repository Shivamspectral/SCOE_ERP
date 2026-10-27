import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { isDemoMode } from '@/lib/supabase/config'
import { verifyDemoSessionValue } from '@/lib/demo/session'
import { DEMO_COOKIE, demoAccounts } from '@/lib/demo/accounts'
import { createDemoSessionValue, isLiveDemoLoginEnabled } from '@/lib/demo/session'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  if (!isLiveDemoLoginEnabled()) {
    return NextResponse.json({ error: 'Demo logins are not enabled on this deployment.' }, { status: 404 })
  }

  let body: { email?: unknown; password?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const account = demoAccounts.find((item) => item.email.toLowerCase() === email && item.password === password)
  if (!account) return NextResponse.json({ error: 'Invalid demo email or password.' }, { status: 401 })

  const response = NextResponse.json({ ok: true })
  response.cookies.set(DEMO_COOKIE, isDemoMode() ? account.id : createDemoSessionValue(account.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  })
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(DEMO_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return response
}

export async function GET() {
  const jar = await cookies()
  const value = jar.get(DEMO_COOKIE)?.value
  const account = isDemoMode()
    ? demoAccounts.find((item) => item.id === value)
    : verifyDemoSessionValue(value)
  if (!account) return NextResponse.json({ ok: false }, { status: 401 })
  return NextResponse.json({ ok: true, account: { id: account.id, email: account.email, name: account.name, label: account.label } })
}
