import { BookOpenCheck, GraduationCap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { EmptyState, PageHeading, StatusBadge } from '@/components/campus/ui'
import { SyllabusForm } from '@/components/forms/syllabus-form'
import { getCampusContext } from '@/lib/campus/context'
import { formatDate } from '@/lib/campus/format'

export const metadata = { title: 'Syllabus progress' }

function departmentByIdName(departments: { id: string; name: string }[], id: string) {
  return departments.find((department) => department.id === id)?.name ?? 'Selected department'
}

export default async function SyllabusPage({ searchParams }: { searchParams: Promise<{ department?: string }> }) {
  const { supabase, profile } = await getCampusContext()
  const params = await searchParams
  const selectedDepartment = params.department || undefined
  let progressQuery = supabase.from('syllabus_progress').select('id, department_id, subject, unit, planned_hours, completed_hours, review_status, updated_at').order('updated_at', { ascending: false }).limit(80)
  if (selectedDepartment) progressQuery = progressQuery.eq('department_id', selectedDepartment)
  const [{ data: progressRows }, { data: departments }] = await Promise.all([
    progressQuery,
    supabase.from('departments').select('id, name').eq('status', 'active').order('name'),
  ])
  const progress = progressRows ?? []
  const departmentList = departments ?? []
  const departmentById = new Map(departmentList.map((department) => [department.id, department.name]))
  const defaultDepartmentId = departmentList.some((department) => department.id === profile.department_id) ? profile.department_id : null

  return (
    <>
      <PageHeading eyebrow={`Academic operations / Curriculum${selectedDepartment ? ' / Department filter' : ''}`} title={selectedDepartment ? `Syllabus progress · ${departmentByIdName(departmentList, selectedDepartment)}` : 'Syllabus progress'} description="Track planned teaching hours against progress recorded by faculty, with review status kept alongside each unit." action={selectedDepartment ? <a href="/syllabus" className="text-sm font-medium text-primary hover:underline">Clear department filter</a> : undefined} />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
        <Card className="border-border/70 shadow-none">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div><CardTitle className="text-lg">Progress by unit</CardTitle><CardDescription>Only records in your profile and department scope are shown.</CardDescription></div>
            <GraduationCap aria-hidden="true" className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            {progress.length ? (
              <div className="flex flex-col gap-4">
                {progress.map((item) => {
                  const percent = item.planned_hours > 0 ? Math.min(100, Math.round((item.completed_hours / item.planned_hours) * 100)) : 0
                  return (
                    <article key={item.id} className="rounded-xl border border-border/70 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0"><p className="font-medium">{item.subject}</p><p className="mt-1 text-sm text-muted-foreground">{item.unit} · {departmentById.get(item.department_id) ?? 'Department'}</p></div>
                        <StatusBadge status={item.review_status} />
                      </div>
                      <div className="mt-4 flex items-center gap-4">
                        <Progress value={percent} aria-label={`${percent}% of planned hours completed`} className="min-w-0 flex-1" />
                        <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">{item.completed_hours}/{item.planned_hours} hrs</span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">Updated {formatDate(item.updated_at)} · {percent}% complete</p>
                    </article>
                  )
                })}
              </div>
            ) : (
              <EmptyState icon={BookOpenCheck} title="No syllabus entries yet" description="Add the first subject unit and keep planned hours connected to progress." />
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-none">
          <CardHeader><CardTitle className="text-lg">Add a progress record</CardTitle><CardDescription>Record the unit and hours you have planned or completed.</CardDescription></CardHeader>
          <CardContent>
            {departmentList.length ? <SyllabusForm departments={departmentList} defaultDepartmentId={defaultDepartmentId} /> : <EmptyState icon={GraduationCap} title="Add a department first" description="Syllabus tracking is organized by department." />}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
