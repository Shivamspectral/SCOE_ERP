import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import {
  Activity, ArrowUpRight, Bell, BookOpenCheck, Building2, CalendarDays,
  ClipboardCheck, FileText, GraduationCap, Megaphone, Users, Workflow,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeading } from '@/components/campus/ui'
import { getCampusContext } from '@/lib/campus/context'

type GroupKey = 'campus' | 'academic' | 'communications'
type Metric = { label: string; description: string; href: string; value: number; icon: LucideIcon; note?: string }

const groupInfo: Record<GroupKey, { title: string; eyebrow: string; description: string }> = {
  campus: { title: 'Campus workspace', eyebrow: 'Workspace / Campus operations', description: 'Institution-wide administration. Select any metric to open the matching list or decision queue.' },
  academic: { title: 'Academic operations', eyebrow: 'Workspace / Academic operations', description: 'Academic planning and workflow visibility. Attendance and examination figures currently count related workflow requests, not student registers or exam marks.' },
  communications: { title: 'Campus communications', eyebrow: 'Workspace / Communications', description: 'Track published notices, registered documents, and unread notifications. Select a metric to inspect its underlying records.' },
}

export async function ModuleGroupOverview({ group }: { group: GroupKey }) {
  const { supabase, user } = await getCampusContext()
  const [departments, activePeople, pendingPeople, requests, openRequests, approvals, audit, syllabus, timetable, attendance, exams, circulars, documents, unread] = await Promise.all([
    supabase.from('departments').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('profiles').select('user_id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('profiles').select('user_id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('workflow_requests').select('id', { count: 'exact', head: true }),
    supabase.from('workflow_requests').select('id', { count: 'exact', head: true }).in('status', ['pending', 'returned']),
    supabase.from('workflow_steps').select('id', { count: 'exact', head: true }).eq('approver_id', user.id).eq('status', 'pending'),
    supabase.from('audit_logs').select('id', { count: 'exact', head: true }),
    supabase.from('syllabus_progress').select('id', { count: 'exact', head: true }),
    supabase.from('timetable_entries').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('workflow_requests').select('id', { count: 'exact', head: true }).eq('module', 'attendance'),
    supabase.from('workflow_requests').select('id', { count: 'exact', head: true }).eq('module', 'examination'),
    supabase.from('circulars').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('documents').select('id', { count: 'exact', head: true }),
    supabase.from('notifications').select('id', { count: 'exact', head: true }).is('read_at', null),
  ])

  const metricSets: Record<GroupKey, Metric[]> = {
    campus: [
      { label: 'Active departments', description: 'Open department directory', href: '/departments?status=active', value: departments.count ?? 0, icon: Building2 },
      { label: 'Active staff', description: 'Browse active staff profiles', href: '/people?status=active', value: activePeople.count ?? 0, icon: Users },
      { label: 'Pending staff access', description: 'Review access requests', href: '/people?status=pending', value: pendingPeople.count ?? 0, icon: Users },
      { label: 'All requests', description: 'Open the request register', href: '/workflows', value: requests.count ?? 0, icon: Workflow },
      { label: 'Open requests', description: 'Pending or returned requests', href: '/workflows?status=pending', value: openRequests.count ?? 0, icon: ClipboardCheck },
      { label: 'Awaiting your review', description: 'Open your approval queue', href: '/approvals', value: approvals.count ?? 0, icon: ClipboardCheck },
      { label: 'Audit events', description: 'Review recorded activity', href: '/activity', value: audit.count ?? 0, icon: Activity },
    ],
    academic: [
      { label: 'Syllabus records', description: 'Open syllabus progress records', href: '/syllabus', value: syllabus.count ?? 0, icon: BookOpenCheck },
      { label: 'Active timetable slots', description: 'Browse scheduled slots', href: '/timetable', value: timetable.count ?? 0, icon: CalendarDays },
      { label: 'Attendance workflows', description: 'Attendance-related requests only', href: '/attendance', value: attendance.count ?? 0, icon: ClipboardCheck, note: 'Not an attendance register' },
      { label: 'Examination workflows', description: 'Examination-related requests only', href: '/examinations', value: exams.count ?? 0, icon: GraduationCap, note: 'Not exam results' },
    ],
    communications: [
      { label: 'Published circulars', description: 'Browse published campus notices', href: '/circulars?status=published', value: circulars.count ?? 0, icon: Megaphone },
      { label: 'Document records', description: 'Open the document register', href: '/documents', value: documents.count ?? 0, icon: FileText },
      { label: 'Unread notifications', description: 'Review unread inbox items', href: '/notifications?unread=1', value: unread.count ?? 0, icon: Bell },
    ],
  }
  const info = groupInfo[group]
  const metrics = metricSets[group]

  return (
    <>
      <PageHeading eyebrow={info.eyebrow} title={info.title} description={info.description} action={<Link href="/dashboard" className="text-sm font-medium text-primary hover:underline">All workspaces</Link>} />
      <section aria-label={`${info.title} metrics`} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Link key={metric.label} href={metric.href} className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <Card className="h-full border-border/70 shadow-none transition-colors group-hover:border-primary/40 group-hover:bg-accent/20">
                <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
                  <div className="min-w-0"><CardTitle className="text-sm font-medium">{metric.label}</CardTitle><CardDescription className="mt-1 text-xs leading-5">{metric.description}</CardDescription></div>
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary"><Icon aria-hidden="true" className="size-4" /></span>
                </CardHeader>
                <CardContent className="flex items-end justify-between gap-2">
                  <div><p className="text-3xl font-semibold tabular-nums tracking-tight">{metric.value}</p>{metric.note ? <p className="mt-1 text-xs text-muted-foreground">{metric.note}</p> : null}</div>
                  <span className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-primary">View <ArrowUpRight aria-hidden="true" className="size-3.5" /></span>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </section>
    </>
  )
}
