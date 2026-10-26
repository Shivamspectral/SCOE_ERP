import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { SignInForm } from '@/components/auth/auth-forms'
import { AuthShell } from '@/components/auth/auth-shell'
import { safeNextPath } from '@/lib/campus/safe-path'

export const metadata = { title: 'Sign in' }

const notices: Record<string, string> = {
  profile: 'Your campus profile is not ready yet. Confirm your email address, then sign in again.',
  callback: 'That confirmation link is invalid or has expired. Sign in, or request a new link.',
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; notice?: string; error?: string }> }) {
  const params = await searchParams
  const notice = notices[params.notice ?? ''] ?? notices[params.error ?? ''] ?? ''

  return (
    <AuthShell>
      <Card className="border-border/70 shadow-sm shadow-primary/5">
        <CardHeader className="pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.17em] text-primary">Member portal</p>
          <CardTitle className="display-font text-3xl font-normal">Welcome back.</CardTitle>
          <CardDescription>Sign in to continue your campus work.</CardDescription>
        </CardHeader>
        <CardContent><SignInForm next={safeNextPath(params.next)} notice={notice} /></CardContent>
        <CardFooter className="justify-center border-t border-border/60 pt-5 text-sm text-muted-foreground">
          New to Astra+? <Link href="/signup" className="ml-1 font-medium text-primary underline-offset-4 hover:underline">Create an account</Link>
        </CardFooter>
      </Card>
    </AuthShell>
  )
}
