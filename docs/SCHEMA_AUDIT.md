# Existing Supabase schema audit

Inspected the repository's seven ordered SQL migrations. The rebuild must extend this schema rather than create a parallel data model.

## Existing core domains
- Institutions, departments, profiles, responsibilities, and role assignments.
- Workflow requests and approval steps, append-only audit logs, and notifications.
- Syllabus progress, timetable entries, circulars, circular acknowledgements, and documents.
- Faculty/HOD workspace records, study plans, lecture execution, academic classes, subjects, and staff-managed student records.
- Attendance sessions, attendance records, assignment records/submissions, marks records, HOD workspace records, and attendance settings.

## Existing security mechanisms
- Row-level security policies cover core tables, faculty/HOD workspaces, and attendance settings.
- app_private helpers resolve institution, department, role, scoped access, notifications and audit events.
- The database exposes secured submit_workflow, decide_workflow, and manage_member functions for authenticated callers.
- Auth bootstrap creates a pending profile for confirmed accounts and gives the first confirmed account principal status; later accounts wait for assignment.
- The NestJS API forwards each verified caller JWT to Supabase PostgREST so RLS and auth.uid() remain effective. Ordinary user requests must not use a service-role client.

## Implementation cautions
- Student records support staff-managed academic workflows; student and parent login portals remain out of scope.
- Role assignments can be department-scoped or responsibility-scoped. Never infer permissions from display labels.
- Demo accounts are for isolated test mode only. Demo cookies must not bypass configured real Supabase authentication.
- Migration file review is not equivalent to running migrations and testing RLS against an isolated Supabase project with multiple role accounts.
