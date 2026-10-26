'use client'

import { useActionState } from 'react'
import { LoaderCircle, Megaphone } from 'lucide-react'
import { createCircularAction } from '@/app/actions'
import { ActionFeedback } from '@/components/forms/action-feedback'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { initialActionState } from '@/lib/campus/action-state'

export function CircularForm() {
  const [state, action, pending] = useActionState(createCircularAction, initialActionState)

  return (
    <form action={action} className="flex flex-col gap-4">
      <FieldGroup className="grid gap-4">
        <Field>
          <FieldLabel htmlFor="circular-title">Title</FieldLabel>
          <Input id="circular-title" name="title" minLength={3} maxLength={160} placeholder="Academic calendar update" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="circular-category">Category</FieldLabel>
          <Select name="category" defaultValue="general">
            <SelectTrigger id="circular-category" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent><SelectGroup>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="academic">Academic</SelectItem>
              <SelectItem value="operations">Operations</SelectItem>
              <SelectItem value="event">Event</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectGroup></SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="circular-content">Message</FieldLabel>
          <Textarea id="circular-content" name="content" minLength={3} maxLength={10000} rows={5} placeholder="Share the details your campus community needs to know." required />
          <FieldDescription>Campus circulars are visible to all active members.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="circular-status">Publication</FieldLabel>
          <Select name="status" defaultValue="published">
            <SelectTrigger id="circular-status" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent><SelectGroup>
              <SelectItem value="published">Publish now</SelectItem>
              <SelectItem value="draft">Save as draft</SelectItem>
            </SelectGroup></SelectContent>
          </Select>
        </Field>
      </FieldGroup>
      <ActionFeedback state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <Megaphone data-icon="inline-start" />}
        {pending ? 'Saving…' : 'Publish circular'}
      </Button>
    </form>
  )
}
