import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookieOptions, getSupabaseConfig, isDemoMode } from '@/lib/supabase/config'
import { DEMO_COOKIE, demoAccounts } from '@/lib/demo/accounts'

const PUBLIC_PATHS = ['/login', '/signup', '/auth', '/api/health']

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

export async function updateSession(request: NextRequest) {
  if (isDemoMode()) {
    const uid = request.nextUrl.pathname === '/' ? undefined : request.cookies.get(DEMO_COOKIE)?.value
    const signedIn = demoAccounts.some((a) => a.id === uid)
    if (!signedIn && !isPublic(request.nextUrl.pathname) && request.nextUrl.pathname !== '/') {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.search = ''
      loginUrl.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next({ request })
  }

  const { url, key } = getSupabaseConfig()
  let response = NextResponse.next({ request })
  let refreshedCookies: { name: string; value: string; options?: Parameters<typeof response.cookies.set>[2] }[] = []
  let cacheHeaders: Record<string, string> = {}

  const supabase = createServerClient(url, key, {
    cookieOptions,
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        refreshedCookies = cookiesToSet
        cacheHeaders = headers
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value))
      },
    },
  })

  const { data } = await supabase.auth.getClaims()

  // Defence in depth: pages also verify the session, but unauthenticated visitors never reach them.
  if (!data?.claims && !isPublic(request.nextUrl.pathname) && request.nextUrl.pathname !== '/') {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.search = ''
    loginUrl.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`)
    const redirect = NextResponse.redirect(loginUrl)
    refreshedCookies.forEach(({ name, value, options }) => redirect.cookies.set(name, value, options))
    Object.entries(cacheHeaders).forEach(([name, value]) => redirect.headers.set(name, value))
    return redirect
  }

  return response
}
