'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { memberRoles, priorities, workflowModules } from '@/lib/campus/constants'
import type { ActionState } from '@/lib/campus/action-state'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const activeStatuses = ['active', 'pending', 'suspended'] as const
const syllabusStatuses = ['draft', 'submitted'] as const
const circularCategories = ['general', 'academic', 'operations', 'event', 'urgent'] as const
const documentCategories = ['general', 'academic', 'policy', 'finance', 'student', 'staff', 'quality'] as const

function value(formData: FormData, key: string) {
  const entry = formData.get(key)
  return typeof entry === 'string' ? entry.trim() : ''
}

function optionalUuid(input: string): string | null | false {
  if (!input || input === 'none') return null
  return uuidPattern.test(input) ? input : false
}

function invalid(message: string): ActionState {
  return { status: 'error', message }
}

function ok(message: string): ActionState {
  return { status: 'success', message }
}

async function loadActionContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { ok: false as const, state: invalid('Your session has ended. Sign in again.') }

  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase
      .from('profiles')
      .select('user_id, institution_id, department_id, status')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('role_assignments')
      .select('role, department_id')
      .eq('user_id', user.id)
      .eq('status', 'active'),
  ])

  if (!profile || profile.status !== 'active') {
    return { ok: false as const, state: invalid('Your campus access is not active.') }
  }

  return { ok: true as const, supabase, user, profile, roles: roles ?? [] }
}

function hasRole(roles: { role: string; department_id: string | null }[], accepted: string[]) {
  return roles.some((assignment) => accepted.includes(assignment.role))
}

function hasDepartmentScope(
  roles: { role: string; department_id: string | null }[],
  accepted: string[],
  departmentId: string,
) {
  return roles.some((assignment) =>
    accepted.includes(assignment.role) &&
    (assignment.department_id === null || assignment.department_id === departmentId),
  )
}

export async function submitWorkflowAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const context = await loadActionContext()
  if (!context.ok) return context.state

  const module = value(formData, 'module')
  const title = value(formData, 'title')
  const description = value(formData, 'description')
  const priority = value(formData, 'priority')
  const departmentId = optionalUuid(value(formData, 'department_id'))

  if (!workflowModules.some((option) => option.value === module)) return invalid('Choose a valid request category.')
  if (title.length < 3 || title.length > 160) return invalid('Add a title between 3 and 160 characters.')
  if (description.length > 4000) return invalid('Keep the description under 4,000 characters.')
  if (!priorities.some((option) => option.value === priority)) return invalid('Choose a valid priority.')
  if (departmentId === false) return invalid('Choose a valid department.')

  const { error } = await context.supabase.rpc('submit_workflow', {
    p_module: module,
    p_title: title,
    p_description: description || null,
    p_department_id: departmentId,
    p_owner_id: null,
    p_priority: priority,
    p_due_at: null,
    p_payload: {},
    p_approver_ids: [],
  })

  if (error) return invalid('The request could not be submitted. Check your access and try again.')

  revalidatePath('/dashboard')
  revalidatePath('/workflows')
  revalidatePath('/approvals')
  return ok('Your request was submitted to the campus workflow.')
}

export async function decideWorkflowAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const context = await loadActionContext()
  if (!context.ok) return context.state

  const workflowId = value(formData, 'workflow_id')
  const decision = value(formData, 'decision')
  const comment = value(formData, 'comment')

  if (!uuidPattern.test(workflowId)) return invalid('This approval is no longer available.')
  if (!['approve', 'return', 'reject'].includes(decision)) return invalid('Choose a valid decision.')
  if (comment.length > 1000) return invalid('Keep the comment under 1,000 characters.')
  if (decision !== 'approve' && !comment) return invalid('Add a comment so the requester knows what to change.')

  const { error } = await context.supabase.rpc('decide_workflow', {
    p_workflow_id: workflowId,
    p_decision: decision,
    p_comment: comment || null,
  })

  if (error) return invalid('The decision could not be saved. Refresh the page and try again.')

  revalidatePath('/dashboard')
  revalidatePath('/workflows')
  revalidatePath('/approvals')
  revalidatePath('/notifications')
  revalidatePath('/activity')
  return ok('Your decision has been recorded.')
}

export async function createDepartmentAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const context = await loadActionContext()
  if (!context.ok) return context.state
  if (!hasRole(context.roles, ['principal', 'administrator'])) return invalid('You do not have permission to create departments.')

  const code = value(formData, 'code').toUpperCase()
  const name = value(formData, 'name')
  const description = value(formData, 'description')

  if (code.length < 2 || code.length > 16 || !/^[A-Z0-9-]+$/.test(code)) return invalid('Use 2–16 letters, numbers, or hyphens for the department code.')
  if (name.length < 2 || name.length > 120) return invalid('Add a department name between 2 and 120 characters.')
  if (description.length > 800) return invalid('Keep the description under 800 characters.')

  const { error } = await context.supabase.from('departments').insert({
    institution_id: context.profile.institution_id,
    code,
    name,
    description: description || null,
    created_by: context.user.id,
  })

  if (error?.code === '23505') return invalid('A department with that code or name already exists.')
  if (error) return invalid('The department could not be created. Check your access and try again.')

  revalidatePath('/departments')
  revalidatePath('/dashboard')
  return ok('Department added to the campus directory.')
}

export async function manageMemberAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const context = await loadActionContext()
  if (!context.ok) return context.state
  if (!hasRole(context.roles, ['principal', 'administrator'])) return invalid('You do not have permission to manage campus access.')

  const userId = value(formData, 'user_id')
  const status = value(formData, 'status')
  const role = value(formData, 'role')
  const departmentId = optionalUuid(value(formData, 'department_id'))

  if (!uuidPattern.test(userId)) return invalid('Choose a valid campus member.')
  if (!activeStatuses.includes(status as (typeof activeStatuses)[number])) return invalid('Choose a valid access status.')
  if (!memberRoles.some((option) => option.value === role)) return invalid('Choose a valid campus role.')
  if (departmentId === false) return invalid('Choose a valid department.')

  const { error } = await context.supabase.rpc('manage_member', {
    p_user_id: userId,
    p_status: status,
    p_role: role,
    p_department_id: departmentId,
    p_responsibility_id: null,
  })

  if (error) return invalid('Campus access could not be updated. Refresh and try again.')

  revalidatePath('/people')
  revalidatePath('/dashboard')
  return ok('Campus access updated.')
}

export async function createSyllabusProgressAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const context = await loadActionContext()
  if (!context.ok) return context.state

  const departmentId = optionalUuid(value(formData, 'department_id'))
  const subject = value(formData, 'subject')
  const unit = value(formData, 'unit')
  const plannedHours = Number(value(formData, 'planned_hours'))
  const completedHours = Number(value(formData, 'completed_hours'))
  const reviewStatus = value(formData, 'review_status')

  if (departmentId === false || departmentId === null) return invalid('Choose a valid department.')
  if (subject.length < 2 || subject.length > 120) return invalid('Add a subject between 2 and 120 characters.')
  if (unit.length < 2 || unit.length > 120) return invalid('Add a unit between 2 and 120 characters.')
  if (!Number.isInteger(plannedHours) || plannedHours < 0 || plannedHours > 1000) return invalid('Planned hours must be a whole number from 0 to 1,000.')
  if (!Number.isInteger(completedHours) || completedHours < 0 || completedHours > plannedHours) return invalid('Completed hours must be between 0 and planned hours.')
  if (!syllabusStatuses.includes(reviewStatus as (typeof syllabusStatuses)[number])) return invalid('Choose a valid review status.')

  const managerRoles = ['principal', 'administrator', 'hod', 'coordinator']
  const manager = hasDepartmentScope(context.roles, managerRoles, departmentId)
  if (!manager && context.profile.department_id !== departmentId) return invalid('You can only add progress for your assigned department.')

  const { error } = await context.supabase.from('syllabus_progress').insert({
    institution_id: context.profile.institution_id,
    department_id: departmentId,
    faculty_id: context.user.id,
    subject,
    unit,
    planned_hours: plannedHours,
    completed_hours: completedHours,
    review_status: reviewStatus,
    updated_by: context.user.id,
  })

  if (error?.code === '23505') return invalid('That subject and unit already has a progress record.')
  if (error) return invalid('Progress could not be saved. Check your department access and try again.')

  revalidatePath('/syllabus')
  revalidatePath('/dashboard')
  return ok('Syllabus progress saved.')
}

export async function createTimetableEntryAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const context = await loadActionContext()
  if (!context.ok) return context.state

  const departmentId = optionalUuid(value(formData, 'department_id'))
  const subject = value(formData, 'subject')
  const cohort = value(formData, 'cohort')
  const room = value(formData, 'room')
  const day = Number(value(formData, 'day_of_week'))
  const startsAt = value(formData, 'starts_at')
  const endsAt = value(formData, 'ends_at')

  if (departmentId === false || departmentId === null) return invalid('Choose a valid department.')
  if (subject.length < 2 || subject.length > 120) return invalid('Add a subject between 2 and 120 characters.')
  if (cohort.length < 1 || cohort.length > 80) return invalid('Add a cohort or class group.')
  if (room.length > 80) return invalid('Keep the room name under 80 characters.')
  if (!Number.isInteger(day) || day < 1 || day > 7) return invalid('Choose a valid day.')
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startsAt) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(endsAt) || startsAt >= endsAt) return invalid('Choose a valid time range.')

  const permittedRoles = ['principal', 'administrator', 'coordinator', 'hod']
  if (!hasDepartmentScope(context.roles, permittedRoles, departmentId)) return invalid('You do not have timetable access for that department.')

  const { error } = await context.supabase.from('timetable_entries').insert({
    institution_id: context.profile.institution_id,
    department_id: departmentId,
    faculty_id: context.user.id,
    subject,
    cohort,
    room: room || null,
    day_of_week: day,
    starts_at: startsAt,
    ends_at: endsAt,
    created_by: context.user.id,
  })

  if (error) return invalid('The timetable entry could not be saved. Check for a conflicting time or access issue.')

  revalidatePath('/timetable')
  revalidatePath('/dashboard')
  return ok('Class added to the timetable.')
}

export async function createCircularAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const context = await loadActionContext()
  if (!context.ok) return context.state

  const canPublish = context.roles.some((assignment) =>
    ['principal', 'administrator'].includes(assignment.role) ||
    (assignment.role === 'coordinator' && assignment.department_id === null),
  )
  if (!canPublish) return invalid('You do not have permission to publish campus circulars.')

  const title = value(formData, 'title')
  const content = value(formData, 'content')
  const category = value(formData, 'category')
  const status = value(formData, 'status')

  if (title.length < 3 || title.length > 160) return invalid('Add a title between 3 and 160 characters.')
  if (content.length < 3 || content.length > 10000) return invalid('Add circular content under 10,000 characters.')
  if (!circularCategories.includes(category as (typeof circularCategories)[number])) return invalid('Choose a valid circular category.')
  if (!['draft', 'published'].includes(status)) return invalid('Choose draft or publish now.')

  const { error } = await context.supabase.from('circulars').insert({
    institution_id: context.profile.institution_id,
    author_id: context.user.id,
    title,
    content,
    category,
    audience: 'all',
    status,
    publish_at: status === 'published' ? new Date().toISOString() : null,
  })

  if (error) return invalid('The circular could not be saved. Check your access and try again.')

  revalidatePath('/circulars')
  revalidatePath('/dashboard')
  return ok(status === 'published' ? 'Circular published to the campus.' : 'Draft saved.')
}

export async function acknowledgeCircularAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const context = await loadActionContext()
  if (!context.ok) return context.state

  const circularId = value(formData, 'circular_id')
  if (!uuidPattern.test(circularId)) return invalid('This circular is no longer available.')

  const { error } = await context.supabase.from('circular_acknowledgements').insert({
    circular_id: circularId,
    institution_id: context.profile.institution_id,
    user_id: context.user.id,
  })

  if (error?.code === '23505') return ok('Acknowledgement already recorded.')
  if (error) return invalid('Acknowledgement could not be recorded. Refresh and try again.')

  revalidatePath('/circulars')
  return ok('Acknowledgement recorded.')
}

export async function registerDocumentAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const context = await loadActionContext()
  if (!context.ok) return context.state

  const departmentId = optionalUuid(value(formData, 'department_id'))
  const title = value(formData, 'title')
  const category = value(formData, 'category')
  const managerRoles = ['principal', 'administrator', 'coordinator', 'hod']

  if (departmentId === false) return invalid('Choose a valid department.')
  if (title.length < 2 || title.length > 180) return invalid('Add a document title between 2 and 180 characters.')
  if (!documentCategories.includes(category as (typeof documentCategories)[number])) return invalid('Choose a valid document category.')

  const hasGlobalAccess = hasRole(context.roles, ['principal', 'administrator'])
  if (!hasGlobalAccess) {
    if (!departmentId || !hasDepartmentScope(context.roles, managerRoles, departmentId)) {
      return invalid('Choose a department within your access scope.')
    }
  }

  const expiresAt = value(formData, 'expires_at')
  if (expiresAt) {
    const parsedExpiry = new Date(`${expiresAt}T00:00:00.000Z`)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expiresAt) || Number.isNaN(parsedExpiry.getTime()) || parsedExpiry.toISOString().slice(0, 10) !== expiresAt) {
      return invalid('Choose a valid expiry date.')
    }
  }

  const { error } = await context.supabase.from('documents').insert({
    institution_id: context.profile.institution_id,
    owner_id: context.user.id,
    department_id: departmentId,
    title,
    category,
    status: 'draft',
    expires_at: expiresAt || null,
  })

  if (error) return invalid('The document record could not be saved. Check your access and try again.')

  revalidatePath('/documents')
  revalidatePath('/dashboard')
  return ok('Document metadata added to the register.')
}

export async function markNotificationReadAction(formData: FormData) {
  const context = await loadActionContext()
  if (!context.ok) return

  const notificationId = value(formData, 'notification_id')
  if (!uuidPattern.test(notificationId)) return

  await context.supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('recipient_id', context.user.id)

  revalidatePath('/notifications')
  revalidatePath('/dashboard')
}
