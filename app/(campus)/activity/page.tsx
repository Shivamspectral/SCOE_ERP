import { Activity, ScrollText } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState, PageHeading } from '@/components/campus/ui'
import { getCampusContext } from '@/lib/campus/context'
import { formatDateTime, humanize } from '@/lib/campus/format'

export const metadata = { title: 'Activity log' }

export default async function ActivityPage() {
  const { supabase, user } = await getCampusContext()
  const { data: logs } = await supabase
    .from('audit_logs')
    .select('id, actor_id, action, entity_type, created_at, related_workflow_id')
    .order('created_at', { ascending: false })
    .limit(80)
  const items = logs ?? []

  return (
    <>
      <PageHeading eyebrow="Campus workspace / Governance" title="Activity log" description="A role-scoped timeline of important changes and workflow decisions across your campus." />
      <Card className="border-border/70 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div><CardTitle className="text-lg">Recent activity</CardTitle><CardDescription>Only audit events visible to your role are shown.</CardDescription></div>
          <Activity aria-hidden="true" className="size-5 text-primary" />
        </CardHeader>
        <CardContent>
          {items.length ? (
            <ol className="flex flex-col">
              {items.map((event) => (
                <li key={event.id} className="flex gap-4 border-b border-border/60 py-4 last:border-0">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"><ScrollText aria-hidden="true" className="size-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{humanize(event.action)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{humanize(event.entity_type)} · {event.actor_id === user.id ? 'You' : 'Campus member'} · {formatDateTime(event.created_at)}</p>
                    {event.related_workflow_id ? <p className="mt-1 text-xs text-primary">Workflow record attached</p> : null}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState icon={Activity} title="No activity recorded yet" description="Changes and workflow decisions will create a time-stamped record here." />
          )}
        </CardContent>
      </Card>
    </>
  )
}
