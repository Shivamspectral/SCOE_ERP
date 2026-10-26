/** Only allow same-site relative redirects (blocks open redirects such as //evil.com or /\evil.com). */
export function safeNextPath(value: string | null | undefined, fallback = '/dashboard') {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback
  return value
}
