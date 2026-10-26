import { CalendarDays, CalendarPlus, Clock3 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState, PageHeading, StatusBadge } from '@/components/campus/ui'
import { TimetableForm } from '@/components/forms/timetable-form'
import { getCampusContext } from '@/lib/campus/context'
import { formatTime } from '@/lib/campus/format'

export const metadata = { title: 'Timetable' }

const weekdays = [
  { value: 1, label: 'Monday' }, { value: 2, label: 'Tuesday' }, { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' }, { value: 5, label: 'Friday' }, { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
]
const schedulingRoles = ['principal', 'administrator', 'coordinator', 'hod']

export default async function TimetablePage({ searchParams }: { searchParams: Promise<{ department?: string }> }) {
  const { supabase, roles } = await getCampusContext()
  const params = await searchParams
  const selectedDepartment = params.department || undefined
  let entriesQuery = supabase.from('timetable_entries').select('id, department_id, subject, cohort, room, day_of_week, starts_at, ends_at, status').eq('status', 'active').order('day_of_week').order('starts_at').limit(160)
  if (selectedDepartment) entriesQuery = entriesQuery.eq('department_id', selectedDepartment)
  const [{ data: entries }, { data: departments }] = await Promise.all([
    entriesQuery,
    supabase.from('departments').select('id, name').eq('status', 'active').order('name'),
  ])
  const departmentList = departments ?? []
  const globalScheduler = roles.some((assignment) => ['principal', 'administrator'].includes(assignment.role) || (schedulingRoles.includes(assignment.role) && assignment.department_id === null))
  const scopedIds = new Set(roles.filter((assignment) => schedulingRoles.includes(assignment.role) && assignment.department_id).map((assignment) => assignment.department_id))
  const formDepartments = globalScheduler ? departmentList : departmentList.filter((department) => scopedIds.has(department.id))
  const canSchedule = roles.some((assignment) => schedulingRoles.includes(assignment.role))
  const departmentById = new Map(departmentList.map((department) => [department.id, department.name]))
  const slots = entries ?? []

  return (
    <>
      <PageHeading eyebrow={`Academic operations / Scheduling${selectedDepartment ? ' / Department filter' : ''}`} title={selectedDepartment ? `Timetable · ${departmentById.get(selectedDepartment) ?? 'Selected department'}` : 'Timetable'} description="Keep active classes and campus activities organized by day, cohort, room, and department." action={selectedDepartment ? <a href="/timetable" className="text-sm font-medium text-primary hover:underline">Clear department filter</a> : undefined} />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
        <section aria-label="Weekly timetable">
          {slots.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {weekdays.map((day) => {
                const daySlots = slots.filter((slot) => slot.day_of_week === day.value)
                if (!daySlots.length) return null
                return (
                  <Card key={day.value} className="border-border/70 shadow-none">
                    <CardHeader className="pb-3"><CardTitle className="text-base">{day.label}</CardTitle><CardDescription>{daySlots.length} active {daySlots.length === 1 ? 'slot' : 'slots'}</CardDescription></CardHeader>
                    <CardContent className="flex flex-col gap-3">
                      {daySlots.map((slot) => (
                        <article key={slot.id} className="flex gap-3 rounded-xl bg-muted/45 p-3">
                          <div className="flex min-w-20 flex-col items-center justify-center rounded-lg bg-card px-2 py-2 text-xs font-semibold tabular-nums text-primary">
                            <span>{formatTime(slot.starts_at)}</span><span className="my-1 h-px w-5 bg-border" /><span>{formatTime(slot.ends_at)}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{slot.subject}</p>
                            <p className="mt-1 truncate text-xs text-muted-foreground">{slot.cohort} · {departmentById.get(slot.department_id) ?? 'Department'}</p>
                            <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 aria-hidden="true" className="size-3" />{slot.room || 'Room to be confirmed'}</p>
                          </div>
                          <StatusBadge status={slot.status} />
                        </article>
                      ))}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <EmptyState icon={CalendarDays} title="No timetable slots yet" description="Once a schedule is published, classes and campus activities will be grouped by day here." />
          )}
        </section>

        {canSchedule ? (
          <Card className="border-border/70 shadow-none">
            <CardHeader><CardTitle className="text-lg">Add a timetable slot</CardTitle><CardDescription>Schedule a class or activity in a department you can manage.</CardDescription></CardHeader>
            <CardContent>
              {formDepartments.length ? <TimetableForm departments={formDepartments} /> : <EmptyState icon={CalendarPlus} title="No department in scope" description="A campus administrator can assign your scheduling role to a department." />}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/70 shadow-none">
            <CardHeader><CardTitle className="text-lg">Scheduling access</CardTitle><CardDescription>Timetable changes are managed by campus administrators, coordinators, and department heads.</CardDescription></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">Your role can view active slots and department coverage.</p></CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
