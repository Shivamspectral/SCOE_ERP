export type DemoAccount = {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string;
  department: string;
  description: string;
};

const password = 'Demo@1234';

/**
 * Local UI test accounts only. These credentials are for the isolated demo
 * experience, never for production identity or access to real college data.
 * Production builds do not expose the demo-login controls.
 */
export const demoAccounts: DemoAccount[] = [
  { id: 'principal', email: 'principal@astra.demo', password, name: 'Meera Kulkarni', role: 'Principal', department: 'Executive Office', description: 'Institution-wide oversight and final approvals' },
  { id: 'admin', email: 'admin@astra.demo', password, name: 'Rahul Deshmukh', role: 'Administrator', department: 'ERP Administration', description: 'Staff, departments and system configuration' },
  { id: 'coordinator', email: 'coordinator@astra.demo', password, name: 'Kavita Rao', role: 'Coordinator', department: 'Academic Coordination', description: 'Academic calendar, circulars and coordination' },
  { id: 'hod', email: 'hod.cse@astra.demo', password, name: 'Anil Joshi', role: 'HOD', department: 'Computer Engineering', description: 'Department operations and first-level approvals' },
  { id: 'faculty', email: 'faculty@astra.demo', password, name: 'Neha Sharma', role: 'Faculty', department: 'Computer Engineering', description: 'Assigned classes, attendance and assessments' },
  { id: 'staff', email: 'staff@astra.demo', password, name: 'Pooja Nair', role: 'Non-teaching Staff', department: 'Administration Office', description: 'Assigned office tasks and requests' },
  { id: 'pending', email: 'pending@astra.demo', password, name: 'Arjun Mehta', role: 'Pending member', department: 'Unassigned', description: 'Account pending institutional approval' }
];
