import Link from 'next/link'
import {
  Activity, ArrowRight, Bell, BookOpenCheck, Building2, CalendarCheck,
  ClipboardCheck, GraduationCap, Landmark, Megaphone, Users, Wallet,
  BriefcaseBusiness, Wrench, ShieldAlert,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { PageHeading } from '@/components/campus/ui'
import { PrincipalDashboardTools } from '@/components/campus/principal-dashboard-tools'
import { getCampusContext } from '@/lib/campus/context'
import { isDemoMode } from '@/lib/supabase/config'
import { formatDateTime, humanize } from '@/lib/campus/format'

export const metadata = { title: 'Principal dashboard' }

type MetricValue = number | null
function display(value: MetricValue) { return value === null ? 'Not connected' : value.toLocaleString('en-IN') }
function Metric({ label, value, detail, icon: Icon, href }: { label: string; value: MetricValue; detail: string; icon: typeof Users; href: string }) {
  return <Link href={href} className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
    <Card className="h-full border-border/70 shadow-none transition-colors group-hover:border-primary/40 group-hover:bg-accent/20">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2"><div className="min-w-0"><CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle><CardDescription className="mt-1 text-xs">{detail}</CardDescription></div><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary"><Icon aria-hidden="true" className="size-4" /></span></CardHeader>
      <CardContent className="flex items-end justify-between gap-3"><p className="text-2xl font-semibold tracking-tight">{display(value)}</p><ArrowRight aria-hidden="true" className="mb-1 size-4 text-muted-foreground transition-transform group-hover:translate-x-1" /></CardContent>
    </Card>
  </Link>
}
function ModuleCard({ title, description, href, icon: Icon, status }: { title: string; description: string; href: string; icon: typeof Users; status?: string }) {
  return <Link href={href} className="group rounded-xl border border-border/70 p-4 transition-colors hover:border-primary/40 hover:bg-accent/20"><div className="flex items-start justify-between gap-3"><span className="flex size-10 items-center justify-center rounded-lg bg-muted text-primary"><Icon aria-hidden="true" className="size-5" /></span><ArrowRight aria-hidden="true" className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" /></div><h3 className="mt-4 text-sm font-semibold">{title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>{status ? <p className="mt-3 text-[11px] font-medium text-muted-foreground">{status}</p> : null}</Link>
}

export default async function DashboardPage() {
  const { supabase, user, profile, institution } = await getCampusContext()
  const demoMode = isDemoMode()
  const today = new Date().toISOString().slice(0, 10)
  const [departments, activePeople, pendingPeople, students, sessionsToday, marksPending, openWork, overdueWork, approvals, unread, notices, audit, syllabus, facultyAssignments, admissionsData, financeData, placementsData, facilitiesData] = await Promise.all([
    supabase.from('departments').select('id, name, code, status').eq('status', 'active').order('name'),
    supabase.from('profiles').select('user_id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('profiles').select('user_id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('academic_students').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('attendance_sessions').select('id, status, session_date', { count: 'exact' }).eq('session_date', today),
    supabase.from('marks_records').select('id', { count: 'exact', head: true }).in('status', ['draft', 'submitted', 'returned']),
    supabase.from('workflow_requests').select('id, request_key, title, module, status, priority, due_at, created_at').in('status', ['pending', 'returned']).order('created_at', { ascending: false }).limit(8),
    supabase.from('workflow_requests').select('id, request_key, title, module, priority, due_at').in('status', ['pending', 'returned']).lt('due_at', new Date().toISOString()).order('due_at', { ascending: true }).limit(5),
    supabase.from('workflow_steps').select('id, workflow_id, status, created_at').eq('approver_id', user.id).eq('status', 'pending').order('created_at', { ascending: true }).limit(8),
    supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('recipient_id', user.id).is('read_at', null),
    supabase.from('circulars').select('id, title, status, created_at').eq('status', 'published').order('created_at', { ascending: false }).limit(5),
    supabase.from('audit_logs').select('id, actor_id, action, entity_type, created_at').order('created_at', { ascending: false }).limit(6),
    supabase.from('syllabus_progress').select('department_id, planned_hours, completed_hours'),
    supabase.from('role_assignments').select('id', { count: 'exact', head: true }).eq('status', 'active').in('role', ['faculty', 'hod', 'coordinator']),
    supabase.from('admission_applications').select('id', { count: 'exact', head: true }),
    supabase.from('fee_payments').select('id', { count: 'exact', head: true }),
    supabase.from('placement_records').select('id', { count: 'exact', head: true }),
    supabase.from('maintenance_requests').select('id', { count: 'exact', head: true }),
  ])
  const activeDepartments = departments.data ?? []
  const openRequests = openWork.data ?? []
  const overdueRequests = overdueWork.data ?? []
  const pendingSteps = approvals.data ?? []
  const pendingWorkflowIds = [...new Set(pendingSteps.map((step: any) => step.workflow_id))]
  const approvalRequests = pendingWorkflowIds.length ? await supabase.from('workflow_requests').select('id, request_key, title, module, priority, created_at').in('id', pendingWorkflowIds).order('created_at', { ascending: true }) : { data: [] as any[] }
  const plannedHours = (syllabus.data ?? []).reduce((sum: number, row: any) => sum + Number(row.planned_hours || 0), 0)
  const completedHours = (syllabus.data ?? []).reduce((sum: number, row: any) => sum + Number(row.completed_hours || 0), 0)
  const syllabusPercent = plannedHours ? Math.round(completedHours / plannedHours * 100) : null
  const firstName = profile.full_name?.trim().split(/\s+/)[0] || 'Principal'
  const connectedCount = (result: any) => result?.error ? null : (result?.count ?? (result?.data?.length ?? 0))
  const sessionCount = demoMode || sessionsToday.error ? null : (sessionsToday.count ?? sessionsToday.data?.length ?? 0)
  const studentCount = demoMode || students.error ? null : (students.count ?? 0)
  const activePeopleCount = demoMode ? null : connectedCount(activePeople)
  const departmentCount = demoMode || departments.error ? null : activeDepartments.length
  const pendingPeopleCount = demoMode ? null : connectedCount(pendingPeople)
  const marksPendingCount = demoMode ? null : connectedCount(marksPending)
  const openWorkCount = demoMode || openWork.error ? null : openRequests.length
  const approvalCount = demoMode || approvals.error ? null : pendingSteps.length
  const unreadCount = demoMode ? null : connectedCount(unread)
  const moduleCount = (result: any) => demoMode || result?.error ? null : (result?.count ?? 0)
  const demoStatus = demoMode ? 'Demo sign-in only · connect Supabase to load institutional records' : 'Live records from connected data sources'
  const exportRows = [
    { section: 'Institution overview', item: 'Institution', value: institution?.name ?? 'Institution not connected' },
    { section: 'Institution overview', item: 'Active departments', value: display(departmentCount) },
    { section: 'Institution overview', item: 'Active people', value: display(activePeopleCount) },
    { section: 'Institution overview', item: 'Active students', value: display(studentCount) },
    { section: 'Academic operations', item: 'Attendance sessions today', value: display(sessionCount) },
    { section: 'Academic operations', item: 'Marks requiring attention', value: display(marksPendingCount) },
    { section: 'Approvals', item: 'Pending approvals', value: display(approvalCount) },
    { section: 'Approvals', item: 'Open requests', value: display(openWorkCount) },
  ]
  const summaryRows = [{ item: 'Generated at', value: new Date().toISOString() }, ...exportRows.map((row) => ({ item: `${row.section}: ${row.item}`, value: row.value }))]
  const facultyRoles = demoMode || facultyAssignments.error ? null : (facultyAssignments.count ?? 0)

  return <div className="space-y-7">
    <PageHeading eyebrow="Principal console / Institutional overview" title={`Good day, ${firstName}.`} description={`${institution?.name ?? 'Your institution'} · One place to monitor academics, people, approvals and campus operations.`} action={<PrincipalDashboardTools reportRows={exportRows} summaryRows={summaryRows} />} />
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-4 py-3"><div><p className="text-sm font-medium">Institutional overview</p><p className="mt-1 text-xs text-muted-foreground">Metrics show connected records only. Missing integrations are labelled instead of being filled with sample figures.</p></div><span className="rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">{demoStatus}</span></div>

    <section className="space-y-3"><div><h2 className="text-lg font-semibold tracking-tight">At a glance</h2><p className="text-sm text-muted-foreground">Select a metric to open its management area.</p></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Active students" value={studentCount} detail="Enrolled student records" icon={GraduationCap} href="/students" />
      <Metric label="Faculty & staff" value={activePeopleCount} detail="Active institutional profiles" icon={Users} href="/people?status=active" />
      <Metric label="Departments" value={departmentCount} detail="Active academic departments" icon={Building2} href="/departments?status=active" />
      <Metric label="Pending approvals" value={approvalCount} detail="Assigned to your decision queue" icon={ClipboardCheck} href="/approvals" />
      <Metric label="Attendance sessions today" value={sessionCount} detail="Sessions recorded for today" icon={CalendarCheck} href="/attendance" />
      <Metric label="Marks needing review" value={marksPendingCount} detail="Draft, submitted or returned marks" icon={BookOpenCheck} href="/examinations" />
      <Metric label="Open requests" value={openWorkCount} detail="Pending or returned workflows" icon={Activity} href="/workflows?status=pending" />
      <Metric label="Unread notifications" value={unreadCount} detail="Alerts for your account" icon={Bell} href="/notifications?unread=1" />
      <Metric label="Pending access" value={pendingPeopleCount} detail="Accounts awaiting activation" icon={Users} href="/people?status=pending" />
    </div></section>

    <section className="space-y-3"><div><h2 className="text-lg font-semibold tracking-tight">Institution management</h2><p className="text-sm text-muted-foreground">Principal-level areas. Integrations not present in the current prototype can be connected without changing this dashboard layout.</p></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <ModuleCard title="Students" description="Enrollment, student records, attendance risk and student requests." href="/students" icon={GraduationCap} status={studentCount === null ? 'Data source not connected' : `${display(studentCount)} active records`} />
      <ModuleCard title="Admissions" description="Application pipeline, admission decisions and enrollment conversion." href="/admissions" icon={Users} status={moduleCount(admissionsData) === null ? 'Connect admissions data' : `${display(moduleCount(admissionsData))} applications`} />
      <ModuleCard title="Fees & finance" description="Fee collection, outstanding dues, budgets and approval oversight." href="/finance" icon={Wallet} status={moduleCount(financeData) === null ? 'Connect finance data' : `${display(moduleCount(financeData))} payment records`} />
      <ModuleCard title="Examinations" description="Exam calendar, marks verification, results and unresolved exam tasks." href="/examinations" icon={BookOpenCheck} status={marksPendingCount === null ? 'Data source not connected' : `${display(marksPendingCount)} marks records to review`} />
      <ModuleCard title="Faculty & workload" description="Staffing, leave decisions, teaching workload and departmental coverage." href="/people" icon={BriefcaseBusiness} status={facultyRoles === null ? 'Data source not connected' : `${display(facultyRoles)} academic role assignments`} />
      <ModuleCard title="Placements" description="Placement activity, internships, employer visits and student outcomes." href="/placements" icon={Landmark} status={moduleCount(placementsData) === null ? 'Connect placement data' : `${display(moduleCount(placementsData))} placement records`} />
      <ModuleCard title="Facilities & assets" description="Maintenance requests, classroom readiness, labs and campus assets." href="/facilities" icon={Wrench} status={moduleCount(facilitiesData) === null ? 'Connect facilities data' : `${display(moduleCount(facilitiesData))} maintenance records`} />
      <ModuleCard title="Notices & documents" description="College announcements, policy documents, expiry dates and acknowledgements." href="/communications" icon={Megaphone} status={`${demoMode || notices.error ? 'Not connected' : (notices.data?.length ?? 0)} recent published notices`} />
    </div></section>

    <section className="grid gap-5 xl:grid-cols-2">
      <Card className="border-border/70 shadow-none"><CardHeader className="flex flex-row items-start justify-between gap-3"><div><CardTitle className="text-base">Needs your attention</CardTitle><CardDescription>Overdue work and approvals waiting for a decision.</CardDescription></div><ShieldAlert className="size-5 text-amber-700" /></CardHeader><CardContent className="space-y-3">
        {!demoMode && overdueRequests.length ? overdueRequests.slice(0,4).map((item: any) => <Link key={item.id} href="/workflows?overdue=1" className="flex items-start justify-between gap-3 rounded-lg border border-amber-200 p-3 hover:bg-amber-50/60 dark:border-amber-900 dark:hover:bg-amber-950/20"><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.request_key} · {humanize(item.module)} · Due {item.due_at ? new Date(item.due_at).toLocaleDateString('en-IN') : 'date not set'}</p></div><span className="text-xs font-medium capitalize">{item.priority}</span></Link>) : <p className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">{demoMode || overdueWork.error ? 'Connect workflow data to see overdue items.' : 'No overdue requests in the connected records.'}</p>}
        {demoMode || approvals.error ? <p className="text-sm text-muted-foreground">Approval queue is not connected.</p> : (approvalRequests.data ?? []).slice(0,4).map((item: any) => <Link key={item.id} href="/approvals" className="flex items-center justify-between gap-3 border-b border-border/60 py-2 last:border-0"><div className="min-w-0"><p className="truncate text-sm font-medium">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.request_key} · {humanize(item.module)}</p></div><span className="text-xs text-muted-foreground">Review</span></Link>)}
        <Link href="/approvals" className="inline-flex items-center gap-1 pt-1 text-sm font-medium text-primary hover:underline">Open decision queue <ArrowRight className="size-4" /></Link>
      </CardContent></Card>
      <Card className="border-border/70 shadow-none"><CardHeader><CardTitle className="text-base">Academic progress</CardTitle><CardDescription>Syllabus progress and upcoming institutional activity from available records.</CardDescription></CardHeader><CardContent className="space-y-5">
        <div><div className="mb-2 flex items-center justify-between gap-3"><span className="text-sm font-medium">Syllabus completion</span><span className="text-sm tabular-nums text-muted-foreground">{demoMode || syllabus.error ? 'Not connected' : syllabusPercent === null ? 'No records' : `${syllabusPercent}%`}</span></div><Progress value={syllabusPercent ?? 0} aria-label="Syllabus completion" /><p className="mt-2 text-xs text-muted-foreground">{demoMode || syllabus.error ? 'Connect syllabus data to see planned and completed hours.' : `${plannedHours.toLocaleString('en-IN')} planned hours · ${completedHours.toLocaleString('en-IN')} completed hours`}</p></div>
        <div className="border-t border-border/70 pt-4"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold">Recent notices</h3><Link href="/circulars?status=published" className="text-xs font-medium text-primary hover:underline">View notices</Link></div>{notices.error ? <p className="text-sm text-muted-foreground">Notice data is not connected.</p> : notices.data?.length ? <div className="space-y-3">{notices.data.slice(0,4).map((item: any) => <div key={item.id} className="flex items-start gap-3"><Megaphone className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><div className="min-w-0"><p className="truncate text-sm font-medium">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">Published {new Date(item.created_at).toLocaleDateString('en-IN')}</p></div></div>)}</div> : <p className="text-sm text-muted-foreground">No published notices yet.</p>}</div>
      </CardContent></Card>
    </section>

    <section className="grid gap-5 xl:grid-cols-2">
      <Card className="border-border/70 shadow-none"><CardHeader><CardTitle className="text-base">Departments</CardTitle><CardDescription>Active academic units and their current syllabus progress.</CardDescription></CardHeader><CardContent>{demoMode || departments.error ? <p className="text-sm text-muted-foreground">Department data is not connected.</p> : activeDepartments.length ? <div className="space-y-4">{activeDepartments.slice(0,6).map((department: any) => { const rows = (syllabus.data ?? []).filter((row: any) => row.department_id === department.id); const planned = rows.reduce((sum: number, row: any) => sum + Number(row.planned_hours || 0), 0); const completed = rows.reduce((sum: number, row: any) => sum + Number(row.completed_hours || 0), 0); const pct = planned ? Math.round(completed / planned * 100) : null; return <div key={department.id}><div className="mb-2 flex items-center justify-between gap-3"><Link href={`/syllabus?department=${department.id}`} className="text-sm font-medium hover:text-primary hover:underline">{department.name}</Link><span className="text-xs text-muted-foreground">{pct === null ? 'No syllabus data' : `${pct}%`}</span></div><Progress value={pct ?? 0} aria-label={`${department.name} syllabus completion`} /></div>})}</div> : <p className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">No active departments have been added.</p>}<Link href="/departments" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">Manage departments <ArrowRight className="size-4" /></Link></CardContent></Card>
      <Card className="border-border/70 shadow-none"><CardHeader className="flex flex-row items-start justify-between gap-3"><div><CardTitle className="text-base">Recent institutional activity</CardTitle><CardDescription>Audit trail for important administrative changes.</CardDescription></div><Activity className="size-5 text-primary" /></CardHeader><CardContent>{demoMode || audit.error ? <p className="text-sm text-muted-foreground">Audit log is not connected.</p> : audit.data?.length ? <div className="space-y-4">{audit.data.slice(0,5).map((item: any) => <div key={item.id} className="flex items-start gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted"><Activity className="size-4" /></span><div className="min-w-0"><p className="text-sm font-medium">{humanize(item.action)} · {humanize(item.entity_type)}</p><p className="mt-1 text-xs text-muted-foreground">{item.actor_id === user.id ? 'You' : 'Institution member'} · {formatDateTime(item.created_at)}</p></div></div>)}</div> : <p className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">No activity has been recorded yet.</p>}<Link href="/activity" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">View activity log <ArrowRight className="size-4" /></Link></CardContent></Card>
    </section>
    <p className="text-xs leading-5 text-muted-foreground">Dashboard data is sourced from connected Supabase tables. Student, attendance, examination, finance, admissions, placement and facilities indicators remain empty or unconnected until those records exist; no sample institutional figures are generated.</p>
  </div>
}
