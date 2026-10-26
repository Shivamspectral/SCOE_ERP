import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { SignUpForm } from '@/components/auth/auth-forms'
import { AuthShell } from '@/components/auth/auth-shell'

export const metadata = { title: 'Create account' }

export default function SignUpPage() {
  return (
    <AuthShell>
      <Card className="border-border/70 shadow-sm shadow-primary/5">
        <CardHeader className="pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.17em] text-primary">Set up your access</p>
          <CardTitle className="display-font text-3xl font-normal">Join your campus.</CardTitle>
          <CardDescription>Create an account with your institutional email.</CardDescription>
        </CardHeader>
        <CardContent><SignUpForm /></CardContent>
        <CardFooter className="justify-center border-t border-border/60 pt-5 text-sm text-muted-foreground">
          Already a member? <Link href="/login" className="ml-1 font-medium text-primary underline-offset-4 hover:underline">Sign in</Link>
        </CardFooter>
      </Card>
    </AuthShell>
  )
}
