'use client'

import { useActionState } from 'react'
import { LoaderCircle, Plus } from 'lucide-react'
import { createDepartmentAction } from '@/app/actions'
import { ActionFeedback } from '@/components/forms/action-feedback'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { initialActionState } from '@/lib/campus/action-state'

export function DepartmentForm() {
  const [state, action, pending] = useActionState(createDepartmentAction, initialActionState)

  return (
    <form action={action} className="flex flex-col gap-4">
      <FieldGroup className="grid gap-4">
        <Field>
          <FieldLabel htmlFor="department-code">Department code</FieldLabel>
          <Input id="department-code" name="code" minLength={2} maxLength={16} placeholder="CSE" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="department-name">Department name</FieldLabel>
          <Input id="department-name" name="name" minLength={2} maxLength={120} placeholder="Computer Science" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="department-description">Description</FieldLabel>
          <Textarea id="department-description" name="description" maxLength={800} rows={3} placeholder="A short description of the department." />
        </Field>
      </FieldGroup>
      <ActionFeedback state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
        {pending ? 'Adding…' : 'Add department'}
      </Button>
    </form>
  )
}
