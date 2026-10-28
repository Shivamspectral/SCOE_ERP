# Existing Supabase schema audit

The connected Supabase project contains the core schema and 21 recorded migrations as of 2026-10-28. The repository's ordered migrations remain the intended schema source of truth; do not create a parallel model or wipe existing project data.

## Existing core domains
- Institutions, departments, profiles, responsibilities, and role assignments.
- Workflow requests and approval steps, append-only audit logs, and notifications.
- Syllabus progress, timetable entries, circulars, circular acknowledgements, and documents.
- Faculty/HOD workspace records, study plans, lecture execution, academic classes, subjects, and staff-managed student records.
- Attendance sessions, attendance records, assignment records/submissions, marks records, HOD workspace records, and attendance settings.
- Private `institution-documents` storage bucket and document-file metadata.

## Security mechanisms and changes
- Row-level security policies cover core tables, faculty/HOD workspaces, and attendance settings.
- `app_private` helpers resolve institution, department, role, scoped access, notifications and audit events.
- `submit_workflow`, `decide_workflow`, and `manage_member` validate the authenticated caller and institutional scope before privileged writes.
- Confirmed self-service accounts are provisioned as pending. Signup order and user-editable metadata must never grant Principal or administrator access.
- The first Principal is assigned through the trusted bootstrap script at `supabase/bootstrap/01_assign_initial_principal.sql` after the intended institutional email is confirmed. Review and replace its placeholder email before execution.
- The NestJS API verifies each caller token and forwards the same JWT to Supabase so RLS and `auth.uid()` remain effective. Ordinary user requests must not use a service-role client.
- Private document signed URLs must only be issued after checking the requesting user's ownership or leadership scope.

## Known operational dependencies
- Staff invitation emails and private document file operations require `SUPABASE_SERVICE_ROLE_KEY` configured only on the server. It must never be placed in a `VITE_*` variable or committed.
- The live project has a seeded institution and responsibility catalogue but no real staff, student, attendance or academic records. Do not invent production data.
- The database security advisor has reported mutable search paths on legacy range helper functions and exposed authenticated execution on three `SECURITY DEFINER` workflow functions. Review and harden those functions without breaking their required caller authorization.
- A schema/migration audit is not equivalent to end-to-end testing. Test RLS using separate accounts for Principal, administrator, HOD, faculty, and staff, including negative cross-department and cross-institution cases.

## Product boundaries
- Student records support staff-managed academic workflows; student and parent login portals remain out of scope.
- Role assignments can be department-scoped or responsibility-scoped. Never infer permissions from display labels.
- Demo accounts are local UI previews only. They do not create Supabase sessions or grant API/database access.
