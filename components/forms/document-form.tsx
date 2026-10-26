'use client'

import { useActionState } from 'react'
import { FilePlus2, LoaderCircle } from 'lucide-react'
import { registerDocumentAction } from '@/app/actions'
import { ActionFeedback } from '@/components/forms/action-feedback'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { initialActionState } from '@/lib/campus/action-state'
import type { Department } from '@/lib/campus/context'

export function DocumentForm({ departments }: { departments: Pick<Department, 'id' | 'name'>[] }) {
  const [state, action, pending] = useActionState(registerDocumentAction, initialActionState)

  return (
    <form action={action} className="flex flex-col gap-4">
      <FieldGroup className="grid gap-4">
        <Field>
          <FieldLabel htmlFor="document-title">Document title</FieldLabel>
          <Input id="document-title" name="title" minLength={2} maxLength={180} placeholder="Faculty handbook, v2" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="document-category">Category</FieldLabel>
          <Select name="category" defaultValue="general">
            <SelectTrigger id="document-category" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent><SelectGroup>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="academic">Academic</SelectItem>
              <SelectItem value="policy">Policy</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="quality">Quality assurance</SelectItem>
            </SelectGroup></SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="document-department">Department</FieldLabel>
          <Select name="department_id" defaultValue="none">
            <SelectTrigger id="document-department" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent><SelectGroup>
              <SelectItem value="none">Campus-wide</SelectItem>
              {departments.map((department) => <SelectItem key={department.id} value={department.id}>{department.name}</SelectItem>)}
            </SelectGroup></SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="document-expires">Expiry date</FieldLabel>
          <Input id="document-expires" name="expires_at" type="date" />
          <FieldDescription>This register stores document metadata, not file content.</FieldDescription>
        </Field>
      </FieldGroup>
      <ActionFeedback state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <FilePlus2 data-icon="inline-start" />}
        {pending ? 'Saving…' : 'Add to register'}
      </Button>
    </form>
  )
}
