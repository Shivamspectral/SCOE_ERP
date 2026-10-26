'use client'

import { useActionState } from 'react'
import { CalendarPlus, LoaderCircle } from 'lucide-react'
import { createTimetableEntryAction } from '@/app/actions'
import { ActionFeedback } from '@/components/forms/action-feedback'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { initialActionState } from '@/lib/campus/action-state'
import type { Department } from '@/lib/campus/context'

const days = [
  { value: '1', label: 'Monday' }, { value: '2', label: 'Tuesday' }, { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' }, { value: '5', label: 'Friday' }, { value: '6', label: 'Saturday' },
  { value: '7', label: 'Sunday' },
]

export function TimetableForm({ departments }: { departments: Pick<Department, 'id' | 'name'>[] }) {
  const [state, action, pending] = useActionState(createTimetableEntryAction, initialActionState)

  return (
    <form action={action} className="flex flex-col gap-4">
      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="timetable-department">Department</FieldLabel>
          <Select name="department_id" defaultValue="none">
            <SelectTrigger id="timetable-department" className="w-full"><SelectValue placeholder="Select department" /></SelectTrigger>
            <SelectContent><SelectGroup>
              <SelectItem value="none">Choose a department</SelectItem>
              {departments.map((department) => <SelectItem key={department.id} value={department.id}>{department.name}</SelectItem>)}
            </SelectGroup></SelectContent>
          </Select>
        </Field>
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="timetable-subject">Subject or activity</FieldLabel>
          <Input id="timetable-subject" name="subject" minLength={2} maxLength={120} placeholder="Data structures" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="timetable-cohort">Cohort</FieldLabel>
          <Input id="timetable-cohort" name="cohort" maxLength={80} placeholder="B.Tech · Year 2" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="timetable-room">Room</FieldLabel>
          <Input id="timetable-room" name="room" maxLength={80} placeholder="Block A · 204" />
        </Field>
        <Field>
          <FieldLabel htmlFor="timetable-day">Day</FieldLabel>
          <Select name="day_of_week" defaultValue="1">
            <SelectTrigger id="timetable-day" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent><SelectGroup>{days.map((day) => <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>)}</SelectGroup></SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="timetable-start">Starts</FieldLabel>
          <Input id="timetable-start" name="starts_at" type="time" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="timetable-end">Ends</FieldLabel>
          <Input id="timetable-end" name="ends_at" type="time" required />
        </Field>
      </FieldGroup>
      <ActionFeedback state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <CalendarPlus data-icon="inline-start" />}
        {pending ? 'Adding…' : 'Add timetable slot'}
      </Button>
    </form>
  )
}
