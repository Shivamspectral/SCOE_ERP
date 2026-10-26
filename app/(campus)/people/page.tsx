import { Users, UserRoundCheck } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState, PageHeading, StatusBadge } from '@/components/campus/ui'
import { MemberAccessForm } from '@/components/forms/member-access-form'
import { getCampusContext } from '@/lib/campus/context'
import { humanize } from '@/lib/campus/format'

export const metadata = { title: 'People' }

export default async function PeoplePage({ searchParams }: { searchParams: Promise<{ status?: string; role?: string; department?: string }> }) {
  const { supabase, user, roles } = await getCampusContext()
  const params = await searchParams
  const selectedStatus = ['active', 'pending', 'suspended'].includes(params.status ?? '') ? params.status : undefined
  const selectedRole = ['academic', 'faculty', 'hod', 'coordinator', 'staff', 'administrator', 'principal'].includes(params.role ?? '') ? params.role : undefined
  const selectedDepartment = params.department || undefined
  let profilesQuery = supabase.from('profiles').select('user_id, full_name, title, department_id, status').order('full_name').limit(200)
  if (selectedStatus) profilesQuery = profilesQuery.eq('status', selectedStatus)
  if (selectedDepartment) profilesQuery = profilesQuery.eq('department_id', selectedDepartment)
  const [{ data: profiles }, { data: departments }] = await Promise.all([
    profilesQuery,
    supabase.from('departments').select('id, name').eq('status', 'active').order('name'),
  ])
  let people = profiles ?? []
  const ids = people.map((person) => person.user_id)
  const { data: assignments } = ids.length
    ? await supabase.from('role_assignments').select('user_id, role, department_id').in('user_id', ids).eq('status', 'active')
    : { data: [] }
  const roleByUser = new Map<string, string[]>()
  for (const assignment of assignments ?? []) {
    const existing = roleByUser.get(assignment.user_id) ?? []
    existing.push(assignment.role)
    roleByUser.set(assignment.user_id, existing)
  }
  if (selectedRole) {
    people = people.filter((person) => {
      const rolesForPerson = roleByUser.get(person.user_id) ?? []
      return selectedRole === 'academic' ? rolesForPerson.some((role) => ['faculty', 'hod', 'coordinator'].includes(role)) : rolesForPerson.includes(selectedRole)
    })
  }
  const departmentById = new Map((departments ?? []).map((department) => [department.id, department.name]))
  const canManage = roles.some((assignment) => ['principal', 'administrator'].includes(assignment.role))

  return (
    <>
      <PageHeading eyebrow={`Campus workspace / Directory${selectedStatus ? ` / ${selectedStatus}` : ''}${selectedRole ? ` / ${humanize(selectedRole)}` : ''}${selectedDepartment ? ' / Department filter' : ''}`} title={selectedStatus === 'pending' ? 'Pending staff access' : selectedRole ? `${humanize(selectedRole)} directory` : selectedStatus ? `${humanize(selectedStatus)} profiles` : 'People'} description={selectedStatus === 'pending' ? 'Review staff profiles waiting for activation. Access changes are available to authorized campus roles.' : 'A permission-aware view of campus members, their departments, and assigned roles.'} action={selectedStatus || selectedRole || selectedDepartment ? <a href="/people" className="text-sm font-medium text-primary hover:underline">Clear filters</a> : undefined} />
      <Card className="mb-5 border-border/70 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div><CardTitle className="text-lg">Campus directory</CardTitle><CardDescription>{people.length} member profiles visible to your role.</CardDescription></div>
          <UserRoundCheck aria-hidden="true" className="size-5 text-primary" />
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">Member records are scoped by campus role and department. Principals and administrators can update access without changing a member&apos;s personal profile.</p>
        </CardContent>
      </Card>

      {people.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {people.map((person) => {
            const memberRoles = roleByUser.get(person.user_id) ?? ['staff']
            const memberRole = memberRoles[0] ?? 'staff'
            return (
              <Card key={person.user_id} className="border-border/70 shadow-none">
                <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base">{person.full_name}</CardTitle>
                    <CardDescription className="mt-1 truncate">{person.title || humanize(memberRole)}{person.department_id ? ` · ${departmentById.get(person.department_id) ?? 'Department'}` : ''}</CardDescription>
                  </div>
                  <StatusBadge status={person.status} />
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex flex-wrap gap-2"><StatusBadge status={memberRole} />{person.department_id ? <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{departmentById.get(person.department_id) ?? 'Department'}</span> : null}</div>
                  {canManage && person.user_id !== user.id ? (
                    <MemberAccessForm
                      userId={person.user_id}
                      status={person.status}
                      role={memberRole}
                      departmentId={person.department_id}
                      departments={departments ?? []}
                    />
                  ) : canManage ? (
                    <p className="text-xs text-muted-foreground">Your own access is protected from changes here.</p>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState icon={Users} title="No member profiles in view" description="As your campus community is onboarded, profiles visible to your role will appear here." />
      )}
    </>
  )
}
