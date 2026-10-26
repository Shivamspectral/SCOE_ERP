'use client'

import { useActionState } from 'react'
import { LoaderCircle, Send } from 'lucide-react'
import { submitWorkflowAction } from '@/app/actions'
import { ActionFeedback } from '@/components/forms/action-feedback'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { initialActionState } from '@/lib/campus/action-state'
import { priorities, workflowModules } from '@/lib/campus/constants'
import type { Department } from '@/lib/campus/context'

export function WorkflowForm({ departments }: { departments: Pick<Department, 'id' | 'name'>[] }) {
  const [state, action, pending] = useActionState(submitWorkflowAction, initialActionState)

  return (
    <form action={action} className="flex flex-col gap-4">
      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="workflow-module">Request type</FieldLabel>
          <Select name="module" defaultValue="task">
            <SelectTrigger id="workflow-module" className="w-full"><SelectValue placeholder="Choose a type" /></SelectTrigger>
            <SelectContent><SelectGroup>{workflowModules.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectGroup></SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="workflow-priority">Priority</FieldLabel>
          <Select name="priority" defaultValue="normal">
            <SelectTrigger id="workflow-priority" className="w-full"><SelectValue placeholder="Choose priority" /></SelectTrigger>
            <SelectContent><SelectGroup>{priorities.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectGroup></SelectContent>
          </Select>
        </Field>
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="workflow-title">Title</FieldLabel>
          <Input id="workflow-title" name="title" minLength={3} maxLength={160} placeholder="What needs to move forward?" required />
        </Field>
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="workflow-description">Details</FieldLabel>
          <Textarea id="workflow-description" name="description" maxLength={4000} rows={3} placeholder="Add context, dates, or the decision needed." />
          <FieldDescription>Requests are routed to the appropriate campus approver when available.</FieldDescription>
        </Field>
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="workflow-department">Department</FieldLabel>
          <Select name="department_id" defaultValue="none">
            <SelectTrigger id="workflow-department" className="w-full"><SelectValue placeholder="Campus-wide" /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="none">Campus-wide</SelectItem>
                {departments.map((department) => <SelectItem key={department.id} value={department.id}>{department.name}</SelectItem>)}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>
      <ActionFeedback state={state} />
      <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <Send data-icon="inline-start" />}
        {pending ? 'Submitting…' : 'Submit request'}
      </Button>
    </form>
  )
}
