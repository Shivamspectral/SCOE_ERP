export const workflowModules = [
  { value: 'task', label: 'Task' },
  { value: 'leave', label: 'Leave' },
  { value: 'department', label: 'Department' },
  { value: 'faculty', label: 'Faculty' },
  { value: 'syllabus', label: 'Syllabus' },
  { value: 'timetable', label: 'Timetable' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'examination', label: 'Examination' },
  { value: 'circular', label: 'Circular' },
  { value: 'events', label: 'Events' },
  { value: 'documents', label: 'Documents' },
  { value: 'quality', label: 'Quality assurance' },
  { value: 'policy', label: 'Policy' },
  { value: 'report', label: 'Report' },
  { value: 'other', label: 'Other' },
] as const

export type WorkflowModule = (typeof workflowModules)[number]['value']

export const priorities = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
] as const

export type WorkflowPriority = (typeof priorities)[number]['value']

export const memberRoles = [
  { value: 'administrator', label: 'Administrator' },
  { value: 'coordinator', label: 'Coordinator' },
  { value: 'hod', label: 'Department head' },
  { value: 'faculty', label: 'Faculty' },
  { value: 'staff', label: 'Staff' },
] as const

export type MemberRole = (typeof memberRoles)[number]['value']
