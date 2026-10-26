import { redirect } from 'next/navigation'
import { RoleWorkspace } from '@/components/campus/role-workspace'
import { getCampusContext } from '@/lib/campus/context'

export default async function HODWorkspacePage() {
  const context = await getCampusContext()
  const hodRole = context.roles.find((role) => role.role === 'hod')
  if (!hodRole) redirect('/dashboard')
  const departmentId = hodRole.department_id ?? context.profile.department_id
  const departmentName = departmentId
    ? (await context.supabase.from('departments').select('name').eq('id', departmentId).maybeSingle()).data?.name ?? 'Assigned department'
    : 'Assigned department'
  return <RoleWorkspace kind="hod" displayName={context.profile.full_name || context.user.email || 'Department head'} departmentName={departmentName} />
}
