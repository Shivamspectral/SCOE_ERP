import type { MetadataRoute } from 'next'

// This is a private, sign-in-only workspace. Keep it out of search indexes.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', disallow: '/' } }
}
