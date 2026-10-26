import { Megaphone, MessagesSquare } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState, PageHeading, StatusBadge } from '@/components/campus/ui'
import { CircularForm } from '@/components/forms/circular-form'
import { CircularAckButton } from '@/components/forms/circular-ack-button'
import { getCampusContext } from '@/lib/campus/context'
import { formatDateTime, humanize } from '@/lib/campus/format'

export const metadata = { title: 'Circulars' }

export default async function CircularsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { supabase, user, roles } = await getCampusContext()
  const params = await searchParams
  const selectedStatus = ['draft', 'published', 'archived'].includes(params.status ?? '') ? params.status : undefined
  let circularsQuery = supabase.from('circulars').select('id, author_id, title, content, category, status, created_at, publish_at, acknowledge_by').order('created_at', { ascending: false }).limit(60)
  if (selectedStatus) circularsQuery = circularsQuery.eq('status', selectedStatus)
  const { data: circularRows } = await circularsQuery
  const circulars = circularRows ?? []
  const ids = circulars.filter((item) => item.status === 'published').map((item) => item.id)
  const { data: acknowledgements } = ids.length
    ? await supabase.from('circular_acknowledgements').select('circular_id').eq('user_id', user.id).in('circular_id', ids)
    : { data: [] }
  const acknowledged = new Set((acknowledgements ?? []).map((item) => item.circular_id))
  const canPublish = roles.some((assignment) =>
    ['principal', 'administrator'].includes(assignment.role) ||
    (assignment.role === 'coordinator' && assignment.department_id === null),
  )

  return (
    <>
      <PageHeading eyebrow={`Campus communications / Notices${selectedStatus ? ` / ${selectedStatus}` : ''}`} title={selectedStatus === 'published' ? 'Published circulars' : selectedStatus ? `${humanize(selectedStatus)} circulars` : 'Circulars'} description="Publish a clear campus notice and keep acknowledgement visible for your own account." action={selectedStatus ? <a href="/circulars" className="text-sm font-medium text-primary hover:underline">Clear filter</a> : undefined} />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
        <Card className="border-border/70 shadow-none">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div><CardTitle className="text-lg">Campus notices</CardTitle><CardDescription>Published notices and drafts visible to your role.</CardDescription></div>
            <MessagesSquare aria-hidden="true" className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            {circulars.length ? (
              <div className="flex flex-col gap-4">
                {circulars.map((circular) => (
                  <article key={circular.id} className="rounded-xl border border-border/70 p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">{humanize(circular.category)} · {formatDateTime(circular.created_at)}</p><h2 className="mt-2 text-base font-semibold">{circular.title}</h2></div>
                      <StatusBadge status={circular.status} />
                    </div>
                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">{circular.content}</p>
                    {circular.status === 'published' ? (
                      <div className="mt-4 border-t border-border/60 pt-4"><CircularAckButton circularId={circular.id} acknowledged={acknowledged.has(circular.id)} /></div>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState icon={Megaphone} title="No circulars yet" description="Published campus announcements and your own drafts will appear here." />
            )}
          </CardContent>
        </Card>

        {canPublish ? (
          <Card className="border-border/70 shadow-none">
            <CardHeader><CardTitle className="text-lg">Write a circular</CardTitle><CardDescription>Share an all-campus notice, publish now, or keep a draft for later.</CardDescription></CardHeader>
            <CardContent><CircularForm /></CardContent>
          </Card>
        ) : (
          <Card className="border-border/70 shadow-none">
            <CardHeader><CardTitle className="text-lg">Publishing access</CardTitle><CardDescription>Campus circulars are managed by a principal, administrator, or campus-wide coordinator.</CardDescription></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">You can read published notices and record your acknowledgement.</p></CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
