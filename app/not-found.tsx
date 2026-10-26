import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">404</p>
      <h1 className="display-font text-4xl tracking-tight">We couldn&apos;t find that page.</h1>
      <p className="max-w-md text-sm text-muted-foreground">The link may be out of date, or the page may have moved.</p>
      <Link href="/dashboard" className={cn(buttonVariants({ size: 'sm' }))}>Back to overview</Link>
    </main>
  )
}
