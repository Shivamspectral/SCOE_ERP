import { Building2, Plus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DepartmentForm } from '@/components/forms/department-form'
import { EmptyState, PageHeading, StatusBadge } from '@/components/campus/ui'
import { getCampusContext } from '@/lib/campus/context'

export const metadata = { title: 'Departments' }

export default async function DepartmentsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { supabase, roles } = await getCampusContext()
  const params = await searchParams
  const selectedStatus = ['active', 'archived'].includes(params.status ?? '') ? params.status : undefined
  let departmentsQuery = supabase.from('departments').select('id, code, name, description, status, created_at').order('name')
  if (selectedStatus) departmentsQuery = departmentsQuery.eq('status', selectedStatus)
  const { data: departments } = await departmentsQuery
  const canCreate = roles.some((assignment) => ['principal', 'administrator'].includes(assignment.role))
  const items = departments ?? []

  return (
    <>
      <PageHeading eyebrow={`Campus workspace / Directory${selectedStatus ? ` / ${selectedStatus}` : ''}`} title={selectedStatus ? `${selectedStatus === 'active' ? 'Active' : 'Archived'} departments` : 'Departments'} description="Keep academic and operational teams clearly represented across the institution." action={selectedStatus ? <a href="/departments" className="text-sm font-medium text-primary hover:underline">Clear filter</a> : undefined} />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(20rem,0.7fr)]">
        <Card className="border-border/70 shadow-none">
          <CardHeader><CardTitle className="text-lg">Campus departments</CardTitle><CardDescription>{items.length} departments visible in this workspace.</CardDescription></CardHeader>
          <CardContent>
            {items.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {items.map((department) => (
                  <article key={department.id} className="rounded-xl border border-border/70 bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary"><Building2 aria-hidden="true" className="size-4" /></span>
                        <div className="min-w-0"><p className="truncate text-sm font-semibold">{department.name}</p><p className="mt-1 text-xs text-muted-foreground">{department.code}</p></div>
                      </div>
                      <StatusBadge status={department.status} />
                    </div>
                    {department.description ? <p className="mt-4 line-clamp-2 text-sm leading-5 text-muted-foreground">{department.description}</p> : <p className="mt-4 text-sm text-muted-foreground">No department description added.</p>}
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState icon={Building2} title="Start with a department" description="Create the first department to organize people, timetable slots, and academic progress." />
            )}
          </CardContent>
        </Card>

        {canCreate ? (
          <Card className="border-border/70 shadow-none">
            <CardHeader><CardTitle className="text-lg">Add a department</CardTitle><CardDescription>Use a short code that is easy to recognize in campus workflows.</CardDescription></CardHeader>
            <CardContent><DepartmentForm /></CardContent>
          </Card>
        ) : (
          <Card className="border-border/70 shadow-none">
            <CardHeader><CardTitle className="text-lg">Department access</CardTitle><CardDescription>Department creation is managed by a principal or administrator.</CardDescription></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">You can view departments available to your campus role.</p></CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
