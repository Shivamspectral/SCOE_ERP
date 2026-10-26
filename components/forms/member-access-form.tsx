'use client'

import { useActionState } from 'react'
import { LoaderCircle, Save } from 'lucide-react'
import { manageMemberAction } from '@/app/actions'
import { ActionFeedback } from '@/components/forms/action-feedback'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { initialActionState } from '@/lib/campus/action-state'
import { memberRoles } from '@/lib/campus/constants'
import type { Department } from '@/lib/campus/context'

export function MemberAccessForm({
  userId,
  status,
  role,
  departmentId,
  departments,
}: {
  userId: string
  status: string
  role: string
  departmentId: string | null
  departments: Pick<Department, 'id' | 'name'>[]
}) {
  const [state, action, pending] = useActionState(manageMemberAction, initialActionState)

  return (
    <form action={action} className="flex min-w-64 flex-col gap-3 rounded-lg border border-border/60 bg-muted/30 p-3">
      <input type="hidden" name="user_id" value={userId} />
      <FieldGroup className="grid gap-3">
        <Field>
          <FieldLabel htmlFor={`member-status-${userId}`}>Access status</FieldLabel>
          <Select name="status" defaultValue={status}>
            <SelectTrigger id={`member-status-${userId}`} className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent><SelectGroup>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectGroup></SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor={`member-role-${userId}`}>Campus role</FieldLabel>
          <Select name="role" defaultValue={memberRoles.some((item) => item.value === role) ? role : 'faculty'}>
            <SelectTrigger id={`member-role-${userId}`} className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent><SelectGroup>{memberRoles.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectGroup></SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor={`member-department-${userId}`}>Department</FieldLabel>
          <Select name="department_id" defaultValue={departmentId ?? 'none'}>
            <SelectTrigger id={`member-department-${userId}`} className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent><SelectGroup>
              <SelectItem value="none">No department</SelectItem>
              {departments.map((department) => <SelectItem key={department.id} value={department.id}>{department.name}</SelectItem>)}
            </SelectGroup></SelectContent>
          </Select>
        </Field>
      </FieldGroup>
      <ActionFeedback state={state} />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <Save data-icon="inline-start" />}
        {pending ? 'Saving…' : 'Save access'}
      </Button>
    </form>
  )
}
