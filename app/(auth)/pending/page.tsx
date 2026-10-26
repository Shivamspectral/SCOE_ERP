import { redirect } from 'next/navigation'
import { ShieldCheck, ShieldX } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthShell } from '@/components/auth/auth-shell'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { StatusBadge } from '@/components/campus/ui'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Access review' }

export default async function PendingAccessPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, status')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profile?.status === 'active') redirect('/dashboard')
  const suspended = profile?.status === 'suspended'
  const Icon = suspended ? ShieldX : ShieldCheck

  return (
    <AuthShell>
      <Card className="border-border/70 shadow-sm shadow-primary/5">
        <CardHeader className="pb-4">
          <span className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-accent text-primary"><Icon aria-hidden="true" /></span>
          <CardTitle className="display-font text-3xl font-normal">{suspended ? 'Access paused.' : 'Access under review.'}</CardTitle>
          <CardDescription>{profile?.full_name ? `Hello, ${profile.full_name}.` : 'Your campus account is ready for review.'}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm leading-6 text-muted-foreground">
            {suspended
              ? 'Your campus access is currently suspended. Contact your institution administrator for help.'
              : 'An administrator needs to assign your campus role before you can open the workspace.'}
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">Account status <StatusBadge status={profile?.status ?? 'pending'} /></div>
        </CardContent>
        <CardFooter className="border-t border-border/60 pt-5">
          <SignOutButton />
        </CardFooter>
      </Card>
    </AuthShell>
  )
}
