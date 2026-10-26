'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function CampusError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Campus page error', error.digest ?? '', error.message)
  }, [error])

  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-border/70 bg-card p-6">
      <h1 className="display-font text-2xl tracking-tight">This page could not be loaded.</h1>
      <p className="text-sm text-muted-foreground">
        Your data is safe. Try again, and contact your administrator if the problem continues.
        {error.digest ? ` Reference: ${error.digest}` : ''}
      </p>
      <Button size="sm" onClick={reset}>Try again</Button>
    </div>
  )
}
