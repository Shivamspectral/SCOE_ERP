'use client'

import { useActionState } from 'react'
import { LoaderCircle, Plus } from 'lucide-react'
import { createSyllabusProgressAction } from '@/app/actions'
import { ActionFeedback } from '@/components/forms/action-feedback'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { initialActionState } from '@/lib/campus/action-state'
import type { Department } from '@/lib/campus/context'

export function SyllabusForm({
  departments,
  defaultDepartmentId,
}: {
  departments: Pick<Department, 'id' | 'name'>[]
  defaultDepartmentId: string | null
}) {
  const [state, action, pending] = useActionState(createSyllabusProgressAction, initialActionState)

  return (
    <form action={action} className="flex flex-col gap-4">
      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="syllabus-department">Department</FieldLabel>
          <Select name="department_id" defaultValue={defaultDepartmentId ?? 'none'}>
            <SelectTrigger id="syllabus-department" className="w-full"><SelectValue placeholder="Select department" /></SelectTrigger>
            <SelectContent><SelectGroup>
              {departments.map((department) => <SelectItem key={department.id} value={department.id}>{department.name}</SelectItem>)}
            </SelectGroup></SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="syllabus-subject">Subject</FieldLabel>
          <Input id="syllabus-subject" name="subject" minLength={2} maxLength={120} placeholder="Applied mathematics" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="syllabus-unit">Unit</FieldLabel>
          <Input id="syllabus-unit" name="unit" minLength={2} maxLength={120} placeholder="Unit 1 · Foundations" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="syllabus-planned">Planned hours</FieldLabel>
          <Input id="syllabus-planned" name="planned_hours" type="number" min={0} max={1000} defaultValue={12} required />
        </Field>
        <Field>
          <FieldLabel htmlFor="syllabus-completed">Completed hours</FieldLabel>
          <Input id="syllabus-completed" name="completed_hours" type="number" min={0} max={1000} defaultValue={0} required />
        </Field>
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="syllabus-review">Review status</FieldLabel>
          <Select name="review_status" defaultValue="draft">
            <SelectTrigger id="syllabus-review" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent><SelectGroup>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="submitted">Submit for review</SelectItem>
            </SelectGroup></SelectContent>
          </Select>
          <FieldDescription>Verified progress is reserved for a department review.</FieldDescription>
        </Field>
      </FieldGroup>
      <ActionFeedback state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
        {pending ? 'Saving…' : 'Add progress record'}
      </Button>
    </form>
  )
}
