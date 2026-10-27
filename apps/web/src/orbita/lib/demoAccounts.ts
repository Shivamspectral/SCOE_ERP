// Demo mode: shared (client + server) account list. No Supabase project required.
// Demo mode is ON when NEXT_PUBLIC_SUPABASE_URL is not set, or when NEXT_PUBLIC_DEMO_MODE=true.

export const DEMO_COOKIE = 'astra_demo_uid'
export const DEMO_PASSWORD = 'Demo@1234'

/** Deterministic, UUID-shaped ids so the app's UUID validation passes. */
export function demoId(group: number, n: number) {
  return `00000000-0000-4000-8000-${group.toString(16)}${String(n).padStart(11, '0')}`
}

export const DEMO_INSTITUTION_ID = demoId(1, 1)

export type DemoAccount = {
  id: string
  email: string
  password: string
  name: string
  label: string
  blurb: string
}

export const demoAccounts: DemoAccount[] = [
  { id: demoId(2, 1), email: 'principal@astra.demo', password: DEMO_PASSWORD, name: 'Meera Kulkarni', label: 'Principal', blurb: 'Sees everything, final approvals' },
  { id: demoId(2, 2), email: 'admin@astra.demo', password: DEMO_PASSWORD, name: 'Rahul Deshmukh', label: 'Administrator', blurb: 'Manages people & departments' },
  { id: demoId(2, 5), email: 'coordinator@astra.demo', password: DEMO_PASSWORD, name: 'Kavita Rao', label: 'Coordinator', blurb: 'Publishes circulars, timetable' },
  { id: demoId(2, 3), email: 'hod.cse@astra.demo', password: DEMO_PASSWORD, name: 'Anil Joshi', label: 'HOD (Computer Eng.)', blurb: 'First-level approver for CSE' },
  { id: demoId(2, 6), email: 'faculty@astra.demo', password: DEMO_PASSWORD, name: 'Neha Sharma', label: 'Faculty', blurb: 'Submits requests, syllabus progress' },
  { id: demoId(2, 8), email: 'staff@astra.demo', password: DEMO_PASSWORD, name: 'Pooja Nair', label: 'Staff', blurb: 'Office staff, limited access' },
  { id: demoId(2, 10), email: 'pending@astra.demo', password: DEMO_PASSWORD, name: 'Arjun Mehta', label: 'New member (pending)', blurb: 'Shows the access-review screen' },
]
