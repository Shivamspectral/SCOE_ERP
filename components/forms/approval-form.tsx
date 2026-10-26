'use client'

import { useActionState } from 'react'
import { Check, LoaderCircle } from 'lucide-react'
import { decideWorkflowAction } from '@/app/actions'
import { ActionFeedback } from '@/components/forms/action-feedback'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { initialActionState } from '@/lib/campus/action-state'

export function ApprovalForm({ workflowId }: { workflowId: string }) {
  const [state, action, pending] = useActionState(decideWorkflowAction, initialActionState)

  return (
    <form action={action} className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/30 p-4">
      <input type="hidden" name="workflow_id" value={workflowId} />
      <FieldGroup className="grid gap-3 sm:grid-cols-[12rem_minmax(0,1fr)]">
        <Field>
          <FieldLabel htmlFor={`decision-${workflowId}`}>Decision</FieldLabel>
          <Select name="decision" defaultValue="approve">
            <SelectTrigger id={`decision-${workflowId}`} className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent><SelectGroup>
              <SelectItem value="approve">Approve</SelectItem>
              <SelectItem value="return">Return for updates</SelectItem>
              <SelectItem value="reject">Reject</SelectItem>
            </SelectGroup></SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor={`comment-${workflowId}`}>Comment</FieldLabel>
          <Textarea id={`comment-${workflowId}`} name="comment" maxLength={1000} rows={2} placeholder="Add a note for the requester." />
        </Field>
      </FieldGroup>
      <ActionFeedback state={state} />
      <div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <Check data-icon="inline-start" />}
          {pending ? 'Recording…' : 'Record decision'}
        </Button>
      </div>
    </form>
  )
}
