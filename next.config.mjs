const isProd = process.env.NODE_ENV === 'production'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseOrigins = supabaseUrl
  ? [new URL(supabaseUrl).origin, new URL(supabaseUrl).origin.replace(/^http/, 'ws')]
  : []

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  // Next.js injects inline bootstrap scripts; a nonce-based policy needs dynamic rendering of every page.
  "script-src 'self' 'unsafe-inline'",
  `connect-src ${['\'self\'', ...supabaseOrigins, 'https://vitals.vercel-insights.com'].join(' ')}`,
  'upgrade-insecure-requests',
].join('; ')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  async headers() {
    const headers = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
    ]
    if (isProd) {
      headers.push(
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
        { key: 'Content-Security-Policy', value: csp },
      )
    }
    return [{ source: '/:path*', headers }]
  },
}

export default nextConfig
