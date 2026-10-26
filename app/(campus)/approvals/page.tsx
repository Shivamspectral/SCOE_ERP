import { ArrowUpRight, ClipboardCheck, Inbox } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { EmptyState, PageHeading, StatusBadge } from '@/components/campus/ui'
import { ApprovalForm } from '@/components/forms/approval-form'
import { getCampusContext } from '@/lib/campus/context'
import { formatDate, humanize } from '@/lib/campus/format'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Approvals' }

export default async function ApprovalsPage() {
  const { supabase, user } = await getCampusContext()
  const { data: steps } = await supabase
    .from('workflow_steps')
    .select('id, workflow_id, step_order, label, created_at')
    .eq('approver_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  const workflowIds = [...new Set((steps ?? []).map((step) => step.workflow_id))]
  const { data: requests } = workflowIds.length
    ? await supabase
      .from('workflow_requests')
      .select('id, request_key, module, title, description, priority, status, created_at, department_id')
      .in('id', workflowIds)
      .order('created_at', { ascending: true })
    : { data: [] }
  const requestById = new Map((requests ?? []).map((request) => [request.id, request]))
  const queue = (steps ?? []).flatMap((step) => {
    const request = requestById.get(step.workflow_id)
    return request ? [{ step, request }] : []
  })

  return (
    <>
      <PageHeading
        eyebrow="Operations / Approvals"
        title="Your review queue"
        description="Make a clear decision, leave context for the requester, and keep the approval trail connected."
        action={<Link href="/workflows" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>View requests <ArrowUpRight data-icon="inline-end" /></Link>}
      />

      {queue.length ? (
        <div className="flex flex-col gap-4">
          {queue.map(({ step, request }) => (
            <Card key={step.id} className="border-border/70 shadow-none">
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{request.request_key} · {step.label}</p>
                  <CardTitle className="mt-2 text-xl">{request.title}</CardTitle>
                  <CardDescription className="mt-2">{request.description || 'No additional details were included.'}</CardDescription>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2"><StatusBadge status={request.status} /><StatusBadge status={request.priority} /></div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                  <span>{humanize(request.module)}</span>
                  <span>Submitted {formatDate(request.created_at)}</span>
                  <span>Approval step {step.step_order}</span>
                </div>
                <ApprovalForm workflowId={request.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={Inbox} title="Your queue is clear" description="Approvals assigned to you will appear here when a campus request is ready for review." action={<Link href="/workflows" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}><ClipboardCheck data-icon="inline-start" /> Browse requests</Link>} />
      )}
    </>
  )
}
