'use client'

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', display: 'grid', minHeight: '100vh', placeItems: 'center', margin: 0 }}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <h1 style={{ fontSize: 28, margin: 0 }}>Astra+ is unavailable right now.</h1>
          <p style={{ color: '#555' }}>Please try again in a moment.</p>
          <button onClick={reset} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #1f4238', background: '#1f4238', color: '#fff', cursor: 'pointer' }}>Retry</button>
        </div>
      </body>
    </html>
  )
}
