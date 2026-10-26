import Link from 'next/link'
import { ArrowRight, ArrowUpRight, ClipboardList, Clock3, CheckCircle2, AlertTriangle, type LucideIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState, PageHeading, StatusBadge } from '@/components/campus/ui'
import { getCampusContext } from '@/lib/campus/context'
import { formatDate, humanize } from '@/lib/campus/format'

const moduleLabels = {
  attendance: { title: 'Attendance operations', description: 'Track attendance-related requests, approvals, and operational follow-ups in one place.', note: 'Attendance registers, class-wise attendance percentages, and student absence reports are not implemented in this prototype yet.' },
  examination: { title: 'Examination operations', description: 'Track examination-related requests and their workflow status across the campus.', note: 'Exam timetables, marks entry, result analysis, and student performance reports are not implemented in this prototype yet.' },
} as const

type ModuleKey = keyof typeof moduleLabels

function MetricLink({ href, label, value, detail, icon: Icon }: { href: string; label: string; value: number; detail: string; icon: LucideIcon }) {
  return <Link href={href} className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Card className="h-full border-border/70 shadow-none transition-colors group-hover:border-primary/40 group-hover:bg-accent/25"><CardHeader className="flex flex-row items-start justify-between gap-3 pb-3"><div><CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle><CardDescription className="mt-1 text-xs">{detail}</CardDescription></div><span className="flex size-9 items-center justify-center rounded-lg bg-accent text-primary"><Icon aria-hidden="true" className="size-4" /></span></CardHeader><CardContent className="flex items-end justify-between"><span className="text-3xl font-semibold tabular-nums">{value}</span><ArrowUpRight aria-hidden="true" className="size-4 text-muted-foreground group-hover:text-primary" /></CardContent></Card></Link>
}

export async function WorkflowModuleOverview({ module }: { module: ModuleKey }) {
  const { supabase } = await getCampusContext()
  const [totalResult, openResult, approvedResult, completedResult, urgentResult, recentResult] = await Promise.all([
    supabase.from('workflow_requests').select('id', { count: 'exact', head: true }).eq('module', module),
    supabase.from('workflow_requests').select('id', { count: 'exact', head: true }).eq('module', module).in('status', ['pending', 'returned']),
    supabase.from('workflow_requests').select('id', { count: 'exact', head: true }).eq('module', module).eq('status', 'approved'),
    supabase.from('workflow_requests').select('id', { count: 'exact', head: true }).eq('module', module).eq('status', 'completed'),
    supabase.from('workflow_requests').select('id', { count: 'exact', head: true }).eq('module', module).in('priority', ['high', 'urgent']).in('status', ['pending', 'returned']),
    supabase.from('workflow_requests').select('id, request_key, title, status, priority, created_at').eq('module', module).order('created_at', { ascending: false }).limit(8),
  ])
  const labels = moduleLabels[module]
  const base = `/workflows?module=${module}`
  const recent = recentResult.data ?? []

  return <>
    <PageHeading eyebrow={`Academic operations / ${humanize(module)}`} title={labels.title} description={labels.description} action={<Link href={`${base}#new-request`} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Create request <ArrowUpRight aria-hidden="true" className="size-4" /></Link>} />
    <section aria-label={`${humanize(module)} workflow metrics`} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <MetricLink href={base} label="Total requests" value={totalResult.count ?? 0} detail="All statuses" icon={ClipboardList} />
      <MetricLink href={`${base}&status=pending`} label="Open items" value={openResult.count ?? 0} detail="Pending or returned" icon={Clock3} />
      <MetricLink href={`${base}&status=approved`} label="Approved" value={approvedResult.count ?? 0} detail="Approved requests" icon={CheckCircle2} />
      <MetricLink href={`${base}&status=completed`} label="Completed" value={completedResult.count ?? 0} detail="Completed requests" icon={CheckCircle2} />
      <MetricLink href={`${base}&priority=high&status=pending`} label="High priority open" value={urgentResult.count ?? 0} detail="High or urgent priority" icon={AlertTriangle} />
    </section>

    <Card className="mt-6 border-border/70 shadow-none">
      <CardHeader className="flex flex-row items-end justify-between gap-4"><div><CardTitle className="text-lg">Recent {humanize(module).toLowerCase()} requests</CardTitle><CardDescription>Open any item group above to see its filtered request list.</CardDescription></div><Link href={base} className="shrink-0 text-sm font-medium text-primary hover:underline">View all <ArrowRight aria-hidden="true" className="ml-1 inline size-4" /></Link></CardHeader>
      <CardContent>{recent.length ? <div className="flex flex-col divide-y divide-border/70">{recent.map((item) => <Link key={item.id} href={base} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-medium hover:text-primary">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.request_key} · {formatDate(item.created_at)}</p></div><div className="flex flex-wrap gap-2"><StatusBadge status={item.status} /><StatusBadge status={item.priority} /></div></Link>)}</div> : <EmptyState icon={ClipboardList} title={`No ${module} requests yet`} description="When staff submit a request in this category, it will appear here." action={<Link href={`${base}#new-request`} className="text-sm font-medium text-primary hover:underline">Create the first request</Link>} />}</CardContent>
    </Card>

    <div className="mt-5 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4"><p className="text-sm font-semibold">Prototype limitation</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{labels.note} The figures above describe workflow requests only, not student attendance or examination outcomes.</p></div>
  </>
}
