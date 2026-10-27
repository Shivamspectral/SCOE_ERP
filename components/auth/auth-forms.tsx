'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, LoaderCircle, MailCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isDemoMode } from '@/lib/supabase/config'
import { demoAccounts } from '@/lib/demo/accounts'
import { safeNextPath } from '@/lib/campus/safe-path'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

function AuthAlert({ message, success = false }: { message: string; success?: boolean }) {
  return (
    <Alert className={success ? 'border-primary/20 bg-primary/5' : ''} variant={success ? 'default' : 'destructive'}>
      {success ? <MailCheck aria-hidden="true" /> : null}
      <AlertTitle>{success ? 'Check your inbox' : 'Sign-in issue'}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

export function SignInForm({ next = '/dashboard', notice = '' }: { next?: string; notice?: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(notice)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    await signIn(String(formData.get('email') ?? '').trim(), String(formData.get('password') ?? ''))
  }

  async function signIn(email: string, password: string) {
    setMessage('')
    setBusy(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      const normalized = error.message.toLowerCase()
      setMessage(normalized.includes('not confirmed')
        ? 'Confirm your email address before signing in.'
        : normalized.includes('rate limit')
          ? 'Too many attempts. Wait a moment and try again.'
          : 'The email or password is incorrect.')
      setBusy(false)
      return
    }

    router.replace(safeNextPath(next))
    router.refresh()
  }

  async function signInDemo(email: string, password: string) {
    setMessage('')
    setBusy(true)

    try {
      const response = await fetch('/api/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password }),
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        setMessage(typeof result.error === 'string'
          ? result.error
          : 'Demo sign-in is unavailable. Check the demo-login environment settings.')
        setBusy(false)
        return
      }

      router.replace(safeNextPath(next))
      router.refresh()
    } catch {
      setMessage('Could not reach the demo sign-in service. Please try again.')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="signin-email">Campus email</FieldLabel>
          <Input id="signin-email" name="email" type="email" autoComplete="email" placeholder="name@institution.edu" required />
        </Field>
        <Field>
          <div className="flex items-center justify-between gap-3">
            <FieldLabel htmlFor="signin-password">Password</FieldLabel>
            <span className="text-xs text-muted-foreground">Email and password access</span>
          </div>
          <Input id="signin-password" name="password" type="password" autoComplete="current-password" required />
        </Field>
      </FieldGroup>
      {message ? <AuthAlert message={message} /> : null}
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <ArrowRight data-icon="inline-end" />}
        {busy ? 'Signing in…' : 'Sign in to Astra+'}
      </Button>
      {(isDemoMode() || process.env.NEXT_PUBLIC_DEMO_LOGIN_ENABLED === 'true') ? (
        <div className="flex flex-col gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Quick demo access</p>
          <p className="text-xs text-muted-foreground">Click a role to continue. Shared demo password: <code className="font-mono">Demo@1234</code></p>
          <div className="mt-1 flex flex-col gap-1.5">
            {demoAccounts.map((account) => (
              <button
                key={account.id}
                type="button"
                disabled={busy}
                onClick={() => signInDemo(account.email, account.password)}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background px-3 py-2 text-left text-sm transition-colors hover:bg-muted disabled:opacity-60"
              >
                <span className="min-w-0">
                  <span className="block font-medium">{account.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{account.email} · {account.blurb}</span>
                </span>
                <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </form>
  )
}

export function SignUpForm() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    if (isDemoMode()) {
      setErrorMessage('Sign-up is disabled in demo mode. Go back to Sign in and use one of the demo accounts.')
      return
    }
    setBusy(true)

    const formData = new FormData(event.currentTarget)
    const fullName = String(formData.get('full_name') ?? '').trim()
    const institutionName = String(formData.get('institution_name') ?? '').trim()
    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '')
    const emailRedirectTo = `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/auth/callback`
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: { full_name: fullName, institution_name: institutionName },
      },
    })

    if (error) {
      const message = error.message.toLowerCase()
      setErrorMessage(error.code === 'weak_password' || message.includes('password')
        ? 'Choose a stronger password and try again.'
        : error.code === 'email_address_invalid'
          ? 'Enter a valid email address.'
          : 'We could not create the account. Check the details and try again.')
      setBusy(false)
      return
    }

    if (data.session) {
      router.replace('/dashboard')
      router.refresh()
      return
    }

    setSuccessMessage('If this address is eligible, a confirmation email will arrive shortly. Follow the link to activate your campus profile.')
    setBusy(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="signup-name">Full name</FieldLabel>
          <Input id="signup-name" name="full_name" autoComplete="name" minLength={2} maxLength={120} placeholder="Your name" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="signup-institution">Institution name</FieldLabel>
          <Input id="signup-institution" name="institution_name" minLength={2} maxLength={160} placeholder="College or institution" required />
          <FieldDescription>The first confirmed account sets up this campus workspace.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="signup-email">Campus email</FieldLabel>
          <Input id="signup-email" name="email" type="email" autoComplete="email" placeholder="name@institution.edu" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="signup-password">Password</FieldLabel>
          <Input id="signup-password" name="password" type="password" autoComplete="new-password" minLength={8} required />
          <FieldDescription>Use at least 8 characters.</FieldDescription>
        </Field>
      </FieldGroup>
      {errorMessage ? <AuthAlert message={errorMessage} /> : null}
      {successMessage ? <AuthAlert message={successMessage} success /> : null}
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <ArrowRight data-icon="inline-end" />}
        {busy ? 'Creating account…' : 'Create campus account'}
      </Button>
    </form>
  )
}
