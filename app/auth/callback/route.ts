import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeNextPath } from '@/lib/campus/safe-path'


export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const supabase = await createClient()

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=callback', request.url))
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(new URL('/login?error=callback', request.url))
  }

  const nextPath = safeNextPath(request.nextUrl.searchParams.get('next'))
  return NextResponse.redirect(new URL(nextPath, request.url))
}
