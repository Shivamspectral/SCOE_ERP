import Link from 'next/link'
import { ArrowUpRight, ClipboardList, Plus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { buttonVariants } from '@/components/ui/button'
import { EmptyState, PageHeading, StatusBadge } from '@/components/campus/ui'
import { WorkflowForm } from '@/components/forms/workflow-form'
import { getCampusContext } from '@/lib/campus/context'
import { formatDate, humanize } from '@/lib/campus/format'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Requests and tasks' }

const workflowModules = ['task', 'leave', 'department', 'faculty', 'syllabus', 'timetable', 'attendance', 'examination', 'circular', 'events', 'documents', 'quality', 'policy', 'report', 'other'] as const
const workflowStatuses = ['pending', 'approved', 'returned', 'rejected', 'completed', 'cancelled'] as const

export default async function WorkflowsPage({ searchParams }: { searchParams: Promise<{ module?: string; status?: string; priority?: string; department?: string; overdue?: string }> }) {
  const { supabase } = await getCampusContext()
  const params = await searchParams
  const selectedModule = workflowModules.includes(params.module as (typeof workflowModules)[number]) ? params.module : undefined
  const selectedStatus = workflowStatuses.includes(params.status as (typeof workflowStatuses)[number]) ? params.status : undefined
  const highPriorityOnly = params.priority === 'high'
  const selectedDepartment = params.department || undefined
  const overdueOnly = params.overdue === '1'
  let requestsQuery = supabase.from('workflow_requests').select('id, request_key, module, title, status, priority, created_at, due_at').order('created_at', { ascending: false }).limit(100)
  if (selectedModule) requestsQuery = requestsQuery.eq('module', selectedModule)
  if (selectedDepartment) requestsQuery = requestsQuery.eq('department_id', selectedDepartment)
  if (overdueOnly) requestsQuery = requestsQuery.lt('due_at', new Date().toISOString()).in('status', ['pending', 'returned'])
  if (highPriorityOnly) requestsQuery = requestsQuery.in('priority', ['high', 'urgent'])
  if (selectedStatus === 'pending') requestsQuery = requestsQuery.in('status', ['pending', 'returned'])
  else if (selectedStatus) requestsQuery = requestsQuery.eq('status', selectedStatus)
  const [requestsResult, departmentsResult] = await Promise.all([
    requestsQuery,
    supabase.from('departments').select('id, name').eq('status', 'active').order('name'),
  ])
  const requests = requestsResult.data ?? []
  const departments = departmentsResult.data ?? []

  return (
    <>
      <PageHeading
        eyebrow={`Operations / Workflow${selectedModule ? ` / ${humanize(selectedModule)}` : ''}`}
        title={selectedModule ? `${humanize(selectedModule)} workflows` : overdueOnly ? 'Overdue requests' : highPriorityOnly ? 'High-priority requests' : selectedStatus === 'pending' ? 'Open requests' : 'Requests & tasks'}
        description={selectedModule ? `Requests categorized under ${humanize(selectedModule)}. This prototype tracks workflow requests here; dedicated ${humanize(selectedModule).toLowerCase()} records may require a separate module.` : overdueOnly ? 'Open or returned requests whose due date has passed.' : highPriorityOnly ? 'High and urgent priority requests, across statuses and modules.' : selectedStatus === 'pending' ? 'Requests awaiting action or returned for revision.' : 'Submit a campus request, follow its approval path, and keep operational work visible in one place.'}
        action={<Link href="/approvals" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>Approvals <ArrowUpRight data-icon="inline-end" /></Link>}
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
        <Card className="min-w-0 border-border/70 shadow-none">
          <CardHeader className="flex flex-row items-end justify-between gap-4">
            <div><CardTitle className="text-lg">{selectedModule ? `${humanize(selectedModule)} requests` : overdueOnly ? 'Overdue requests' : highPriorityOnly ? 'High-priority requests' : selectedStatus === 'pending' ? 'Open requests' : 'All requests in your scope'}</CardTitle><CardDescription>Recent submissions and their current status. Counts reflect the records returned by this list.</CardDescription></div>
            <div className="flex flex-wrap items-center justify-end gap-2">{selectedModule || selectedStatus || highPriorityOnly || selectedDepartment || overdueOnly ? <Link href="/workflows" className="text-xs font-medium text-primary hover:underline">Clear filters</Link> : null}<span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">{requests.length} shown</span></div>
          </CardHeader>
          <CardContent>
            {requests.length ? (
              <Table className="min-w-[620px]">
                <TableCaption>Recent requests visible to your campus role{selectedModule ? `, filtered to ${humanize(selectedModule)}` : ''}{selectedDepartment ? ', filtered to selected department' : ''}{overdueOnly ? ', filtered to overdue open items' : ''}{selectedStatus === 'pending' ? ', filtered to pending or returned' : ''}{highPriorityOnly ? ', filtered to high or urgent priority' : ''}.</TableCaption>
                <TableHeader><TableRow><TableHead>Request</TableHead><TableHead>Module</TableHead><TableHead>Status</TableHead><TableHead>Priority</TableHead><TableHead>Opened</TableHead></TableRow></TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="max-w-64"><p className="truncate font-medium">{request.title}</p><p className="mt-1 text-xs text-muted-foreground">{request.request_key}</p></TableCell>
                      <TableCell className="text-muted-foreground">{humanize(request.module)}</TableCell>
                      <TableCell><StatusBadge status={request.status} /></TableCell>
                      <TableCell><StatusBadge status={request.priority} /></TableCell>
                      <TableCell>{formatDate(request.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState icon={ClipboardList} title="No requests in view" description="New campus tasks, approvals, and requests will appear here." action={<Link href="#new-request" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>Submit a request <Plus data-icon="inline-end" /></Link>} />
            )}
          </CardContent>
        </Card>

        <Card id="new-request" className="border-border/70 shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">Start a request</CardTitle>
            <CardDescription>Share the decision or action needed. Astra+ will route it for review when an approver is available.</CardDescription>
          </CardHeader>
          <CardContent><WorkflowForm departments={departments} /></CardContent>
        </Card>
      </div>
    </>
  )
}
