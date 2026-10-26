'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Unhandled application error', error.digest ?? '', error.message)
  }, [error])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="display-font text-4xl tracking-tight">Something went wrong.</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        The page could not be loaded. Try again, and contact your administrator if it keeps happening.
        {error.digest ? ` Reference: ${error.digest}` : ''}
      </p>
      <Button size="sm" onClick={reset}>Try again</Button>
    </main>
  )
}
