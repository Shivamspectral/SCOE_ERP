import Link from 'next/link'
import { Bell, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { CampusNavigation } from '@/components/campus/navigation'
import { initials, humanize } from '@/lib/campus/format'
import type { CampusContext } from '@/lib/campus/context'

export function CampusShell({ context, children }: { context: CampusContext; children: React.ReactNode }) {
  const displayName = context.profile.full_name || context.user.email || 'Campus member'
  const activeRole = context.roles[0]?.role ?? 'member'

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <Link href="/dashboard" className="flex items-center gap-3 border-b border-sidebar-foreground/10 px-5 py-5">
          <span className="flex size-10 items-center justify-center overflow-hidden rounded-xl border border-sidebar-border bg-white p-1.5">
            <Image src="/scoe-logo.png" alt="SCOE logo" width={40} height={40} className="size-full object-contain" priority />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold tracking-[0.16em] text-[#922526]">ASTRA+</span>
            <span className="block truncate text-xs text-sidebar-foreground/55">{context.institution?.name ?? 'Campus workspace'}</span>
          </span>
        </Link>
        <CampusNavigation unreadCount={context.unreadCount} roles={context.roles.map((role) => role.role)} />
        <div className="mt-auto border-t border-sidebar-foreground/10 px-5 py-4">
          <p className="text-xs font-medium text-sidebar-foreground/75">A considered space for campus work.</p>
          <p className="mt-1 text-[11px] text-sidebar-foreground/40">Your access is governed by campus roles.</p>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-4 border-b border-[#eae3de] bg-white/95 px-4 shadow-[0_1px_2px_rgba(41,23,20,0.02)] backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2.5">
            <Image src="/scoe-logo.png" alt="SCOE" width={30} height={30} className="size-7 shrink-0 object-contain sm:hidden" />
            <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#922526]">Astra+ Campus</p>
            <p className="truncate text-sm font-medium text-foreground">{context.institution?.name ?? 'Institutional workspace'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/notifications" className="relative inline-flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label={context.unreadCount ? `${context.unreadCount} unread notifications` : 'Notifications'}>
              <Bell aria-hidden="true" className="size-4" />
              {context.unreadCount > 0 ? <span className="absolute right-2 top-2 size-2 rounded-full bg-primary ring-2 ring-background" /> : null}
            </Link>
            <div className="hidden items-center gap-2 border-l border-border pl-4 sm:flex">
              <Avatar className="size-9">
                <AvatarFallback className="bg-accent text-xs font-semibold text-primary">{initials(displayName)}</AvatarFallback>
              </Avatar>
              <div className="max-w-40">
                <p className="truncate text-sm font-medium">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">{humanize(activeRole)}</p>
              </div>
              <ChevronDown aria-hidden="true" className="size-3 text-muted-foreground" />
            </div>
            <SignOutButton compact />
          </div>
        </header>
        <div className="border-b border-border/70 bg-card lg:hidden">
          <CampusNavigation unreadCount={context.unreadCount} roles={context.roles.map((role) => role.role)} mobile />
        </div>
        <main className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          {children}
        </main>
      </div>
    </div>
  )
}
