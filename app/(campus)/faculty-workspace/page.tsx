import { redirect } from 'next/navigation'
import { RoleWorkspace } from '@/components/campus/role-workspace'
import { getCampusContext } from '@/lib/campus/context'

export default async function FacultyWorkspacePage() {
  const context = await getCampusContext()
  const canAccess = context.roles.some((role) => ['faculty', 'hod'].includes(role.role))
  if (!canAccess) redirect('/dashboard')
  const departmentName = context.profile.department_id
    ? (await context.supabase.from('departments').select('name').eq('id', context.profile.department_id).maybeSingle()).data?.name ?? 'Assigned department'
    : 'Assigned department'
  return <RoleWorkspace kind="faculty" displayName={context.profile.full_name || context.user.email || 'Faculty member'} departmentName={departmentName} />
}
