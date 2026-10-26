import { redirect } from 'next/navigation'
import { AttendanceWorkspace } from '@/components/campus/attendance-workspace'
import { getCampusContext } from '@/lib/campus/context'

type Row = Record<string, any>

export default async function AttendancePage() {
  const context = await getCampusContext()
  const roles = context.roles.map((role) => role.role)
  if (!roles.some((role) => ['faculty', 'hod', 'principal', 'administrator', 'coordinator'].includes(role))) redirect('/dashboard')

  const supabase = context.supabase
  const wideAccess = roles.some((role) => ['principal', 'administrator', 'coordinator'].includes(role))
  let classQuery = supabase.from('academic_classes').select('id,name,department_id,year_of_study,division,academic_year,status').eq('institution_id', context.profile.institution_id).eq('status', 'active')
  let subjectQuery = supabase.from('academic_subjects').select('id,class_id,department_id,code,name,semester,status').eq('institution_id', context.profile.institution_id).eq('status', 'active')
  let studentQuery = supabase.from('academic_students').select('id,class_id,department_id,roll_number,full_name,status').eq('institution_id', context.profile.institution_id).eq('status', 'active')
  if (!wideAccess && context.profile.department_id) {
    classQuery = classQuery.eq('department_id', context.profile.department_id)
    subjectQuery = subjectQuery.eq('department_id', context.profile.department_id)
    studentQuery = studentQuery.eq('department_id', context.profile.department_id)
  }
  const [classResult, subjectResult, studentResult, timetableResult] = await Promise.all([
    classQuery, subjectQuery, studentQuery,
    supabase.from('timetable_entries').select('faculty_id,subject,cohort,department_id,status').eq('institution_id', context.profile.institution_id).eq('status', 'active'),
  ])
  let classRows = (classResult.data ?? []) as Row[]
  let subjectRows = (subjectResult.data ?? []) as Row[]
  let studentRows = (studentResult.data ?? []) as Row[]
  const timetableRows = (timetableResult.data ?? []) as Row[]

  // Faculty are limited to class/subject pairs in their own timetable. HOD and campus roles retain their review scope.
  if (roles.includes('faculty') && !roles.some((role) => ['hod', 'principal', 'administrator', 'coordinator'].includes(role))) {
    const assigned = timetableRows.filter((row) => row.faculty_id === context.user.id)
    const cohortFor = (row: Row) => {
      const name = String(row.name ?? '')
      if (name.includes('Mechanical')) return `SE-${row.division || 'M'}`
      if (name.includes('Electronics')) return `TE-${row.division || 'E'}`
      return `SE-${row.division || 'A'}`
    }
    const allowedClasses = new Set(classRows.filter((c) => assigned.some((t) => t.cohort === cohortFor(c))).map((c) => c.id))
    const allowedSubjectNames = new Set(assigned.map((row) => String(row.subject).toLowerCase()))
    classRows = classRows.filter((row) => allowedClasses.has(row.id))
    subjectRows = subjectRows.filter((row) => allowedClasses.has(row.class_id) && allowedSubjectNames.has(String(row.name).toLowerCase()))
    const allowedClassIds = new Set(classRows.map((row) => row.id))
    studentRows = studentRows.filter((row) => allowedClassIds.has(row.class_id))
  }

  // Shared academic IDs are passed directly to attendance. No parallel class/subject/student IDs are invented here.
  const data = {
    classes: classRows.map((row) => ({
      id: row.id,
      name: row.name,
      semester: Number(row.year_of_study ?? 1) * 2 - 1,
      division: row.division ?? '',
    })),
    subjects: subjectRows.map((row) => ({
      id: row.id,
      classId: row.class_id ?? '',
      code: row.code ?? row.name,
      name: row.name,
      faculty: timetableRows.find((t) => String(t.subject).toLowerCase() === String(row.name).toLowerCase())?.faculty_id ?? 'Assigned faculty',
    })).filter((row) => row.classId),
    students: studentRows.map((row) => ({
      id: row.id,
      roll: row.roll_number,
      name: row.full_name,
      classId: row.class_id ?? '',
    })).filter((row) => row.classId),
  }

  return <AttendanceWorkspace roles={roles} displayName={context.profile.full_name || context.user.email || 'Campus member'} departmentId={context.profile.department_id ?? ''} data={data} />
}
