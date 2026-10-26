import { Bell, BellRing, CircleCheck } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState, PageHeading, StatusBadge } from '@/components/campus/ui'
import { NotificationReadButton } from '@/components/forms/notification-read-button'
import { getCampusContext } from '@/lib/campus/context'
import { formatDateTime, humanize } from '@/lib/campus/format'

export const metadata = { title: 'Notifications' }

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ unread?: string }> }) {
  const { supabase } = await getCampusContext()
  const params = await searchParams
  const unreadOnly = params.unread === '1'
  let notificationsQuery = supabase.from('notifications').select('id, title, body, kind, href, read_at, created_at').order('created_at', { ascending: false }).limit(80)
  if (unreadOnly) notificationsQuery = notificationsQuery.is('read_at', null)
  const { data: notifications } = await notificationsQuery
  const items = notifications ?? []
  const unread = items.filter((item) => !item.read_at).length

  return (
    <>
      <PageHeading eyebrow={`Campus communications / Inbox${unreadOnly ? ' / Unread' : ''}`} title={unreadOnly ? 'Unread notifications' : 'Notifications'} description="A personal record of approvals, operational changes, and campus updates assigned to your account." action={unreadOnly ? <a href="/notifications" className="text-sm font-medium text-primary hover:underline">Show all</a> : undefined} />
      <Card className="border-border/70 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div><CardTitle className="text-lg">{unreadOnly ? 'Unread items' : 'Your inbox'}</CardTitle><CardDescription>{unreadOnly ? `${items.length} unread notifications in view.` : `${unread} unread notifications in the latest ${items.length} records.`}</CardDescription></div>
          <BellRing aria-hidden="true" className="size-5 text-primary" />
        </CardHeader>
        <CardContent>
          {items.length ? (
            <div className="flex flex-col divide-y divide-border/70">
              {items.map((notification) => (
                <article key={notification.id} className="flex flex-col gap-3 py-4 first:pt-1 last:pb-1 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <span className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${notification.read_at ? 'bg-muted text-muted-foreground' : 'bg-accent text-primary'}`}>
                      {notification.read_at ? <CircleCheck aria-hidden="true" className="size-4" /> : <Bell aria-hidden="true" className="size-4" />}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-semibold">{notification.title}</h2><StatusBadge status={notification.kind} /></div>
                      {notification.body ? <p className="mt-1 text-sm leading-5 text-muted-foreground">{notification.body}</p> : null}
                      <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(notification.created_at)}{notification.read_at ? ` · Read ${formatDateTime(notification.read_at)}` : ' · Unread'}</p>
                    </div>
                  </div>
                  {!notification.read_at ? <NotificationReadButton notificationId={notification.id} /> : null}
                </article>
              ))}
            </div>
          ) : (
            <EmptyState icon={Bell} title="You are all caught up" description="New approval requests and updates for your account will appear here." />
          )}
        </CardContent>
      </Card>
    </>
  )
}
