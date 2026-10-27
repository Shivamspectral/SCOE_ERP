import { NextResponse } from 'next/server'
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
  response.cookies.set(DEMO_COOKIE, createDemoSessionValue(account.id), {
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
