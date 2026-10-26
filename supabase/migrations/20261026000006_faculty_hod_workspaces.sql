-- Astra+ Campus: additive Faculty Workbench + HOD Workspace schema.
-- This migration intentionally extends the existing Astra+ schema; it does not
-- replace profiles, role_assignments, departments, workflow_requests or other core tables.
-- Student/parent authentication is not introduced. Student records are staff-managed only.

create table if not exists public.academic_classes (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete restrict,
  name text not null,
  academic_year text,
  year_of_study smallint check (year_of_study between 1 and 6),
  division text,
  program_level text not null default 'degree' check (program_level in ('degree','diploma')),
  status text not null default 'active' check (status in ('active','archived')),
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, department_id, name, academic_year)
);
create index if not exists academic_classes_scope_idx on public.academic_classes(institution_id, department_id, status);

create table if not exists public.academic_subjects (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete restrict,
  class_id uuid references public.academic_classes(id) on delete set null,
  code text,
  name text not null,
  semester smallint check (semester between 1 and 12),
  credits numeric(4,1) not null default 0 check (credits >= 0),
  status text not null default 'active' check (status in ('active','archived')),
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists academic_subjects_scope_idx on public.academic_subjects(institution_id, department_id, class_id);

create table if not exists public.academic_students (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete restrict,
  class_id uuid references public.academic_classes(id) on delete set null,
  roll_number text not null,
  registration_number text,
  full_name text not null,
  email text,
  status text not null default 'active' check (status in ('active','inactive','graduated','transferred')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, department_id, roll_number)
);
create index if not exists academic_students_class_idx on public.academic_students(institution_id, class_id, status);

-- Flexible, versionable workspace records back tabs such as assignments, labs,
-- question banks, CO/PO mapping, mentoring, workload, tasks, evidence, reports,
-- calendar and Copilot requests without inventing a separate login system.
create table if not exists public.faculty_workspace_records (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  owner_user_id uuid not null references public.profiles(user_id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete restrict,
  resource text not null check (resource in ('teaching','study','lecture','attendance','assignments','lab','marks','questions','copo','students','risk','mentoring','timetable','workload','leave','tasks','documents','circulars','calendar','analytics','reports','copilot','profile')),
  title text not null,
  status text not null default 'draft',
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  due_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid not null references public.profiles(user_id) on delete restrict,
  updated_by uuid not null references public.profiles(user_id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists faculty_workspace_owner_idx on public.faculty_workspace_records(owner_user_id, resource, updated_at desc);
create index if not exists faculty_workspace_department_idx on public.faculty_workspace_records(institution_id, department_id, resource, status, updated_at desc);

create table if not exists public.faculty_study_plan_items (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  faculty_user_id uuid not null references public.profiles(user_id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete restrict,
  class_id uuid references public.academic_classes(id) on delete set null,
  subject_id uuid references public.academic_subjects(id) on delete set null,
  pattern text,
  unit_name text not null,
  planned_lectures integer not null default 0 check (planned_lectures >= 0),
  completed_lectures integer not null default 0 check (completed_lectures >= 0 and completed_lectures <= planned_lectures),
  status text not null default 'draft' check (status in ('draft','submitted','approved','returned')),
  reviewer_user_id uuid references public.profiles(user_id) on delete set null,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists faculty_study_plan_scope_idx on public.faculty_study_plan_items(institution_id, department_id, faculty_user_id, status);

create table if not exists public.faculty_lecture_executions (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  faculty_user_id uuid not null references public.profiles(user_id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete restrict,
  class_id uuid references public.academic_classes(id) on delete set null,
  subject_id uuid references public.academic_subjects(id) on delete set null,
  lecture_date date not null default current_date,
  topic text not null,
  duration_minutes integer not null default 60 check (duration_minutes between 1 and 600),
  status text not null default 'completed' check (status in ('planned','completed','cancelled')),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists faculty_lecture_scope_idx on public.faculty_lecture_executions(institution_id, department_id, faculty_user_id, lecture_date desc);

create table if not exists public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete restrict,
  class_id uuid not null references public.academic_classes(id) on delete cascade,
  subject_id uuid references public.academic_subjects(id) on delete set null,
  faculty_user_id uuid not null references public.profiles(user_id) on delete restrict,
  session_date date not null default current_date,
  session_label text,
  status text not null default 'draft' check (status in ('draft','submitted','verified','returned')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists attendance_sessions_scope_idx on public.attendance_sessions(institution_id, department_id, class_id, session_date desc);

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  institution_id uuid not null references public.institutions(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete restrict,
  student_id uuid not null references public.academic_students(id) on delete cascade,
  attendance_status text not null check (attendance_status in ('present','absent','late','excused')),
  note text,
  recorded_by uuid not null references public.profiles(user_id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (session_id, student_id)
);
create index if not exists attendance_records_student_idx on public.attendance_records(institution_id, department_id, student_id, session_id);

create table if not exists public.assignment_records (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete restrict,
  class_id uuid references public.academic_classes(id) on delete set null,
  subject_id uuid references public.academic_subjects(id) on delete set null,
  owner_user_id uuid not null references public.profiles(user_id) on delete restrict,
  title text not null,
  instructions text,
  due_at timestamptz,
  max_marks numeric(7,2) check (max_marks is null or max_marks >= 0),
  status text not null default 'draft' check (status in ('draft','published','closed','archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists assignment_records_scope_idx on public.assignment_records(institution_id, department_id, class_id, due_at);

create table if not exists public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignment_records(id) on delete cascade,
  student_id uuid not null references public.academic_students(id) on delete cascade,
  submitted_at timestamptz,
  submission_ref text,
  marks numeric(7,2),
  feedback text,
  status text not null default 'pending' check (status in ('pending','submitted','evaluated','returned','late')),
  evaluated_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, student_id)
);

create table if not exists public.marks_records (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete restrict,
  class_id uuid references public.academic_classes(id) on delete set null,
  subject_id uuid references public.academic_subjects(id) on delete set null,
  student_id uuid not null references public.academic_students(id) on delete cascade,
  faculty_user_id uuid not null references public.profiles(user_id) on delete restrict,
  assessment_name text not null,
  max_marks numeric(7,2) not null check (max_marks >= 0),
  marks_obtained numeric(7,2) check (marks_obtained is null or (marks_obtained >= 0 and marks_obtained <= max_marks)),
  status text not null default 'draft' check (status in ('draft','submitted','verified','returned','locked')),
  verified_by uuid references public.profiles(user_id) on delete set null,
  verified_at timestamptz,
  feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists marks_records_scope_idx on public.marks_records(institution_id, department_id, class_id, subject_id, assessment_name);

create table if not exists public.hod_workspace_records (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  hod_user_id uuid not null references public.profiles(user_id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete restrict,
  resource text not null check (resource in ('faculty','study','attendance','marks','timetable','leave','students','tasks','circulars','evidence','reports','analytics','copilot','profile','substitution','workload','risk')),
  title text not null,
  status text not null default 'open',
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  due_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid not null references public.profiles(user_id) on delete restrict,
  updated_by uuid not null references public.profiles(user_id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists hod_workspace_scope_idx on public.hod_workspace_records(hod_user_id, department_id, resource, updated_at desc);
create index if not exists hod_workspace_queue_idx on public.hod_workspace_records(institution_id, department_id, resource, status, priority, due_at);

create table if not exists public.workspace_workflow_events (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  workspace_kind text not null check (workspace_kind in ('faculty','hod')),
  department_id uuid references public.departments(id) on delete set null,
  record_id uuid not null,
  actor_user_id uuid not null references public.profiles(user_id) on delete restrict,
  action text not null,
  from_status text,
  to_status text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists workspace_workflow_events_idx on public.workspace_workflow_events(institution_id, workspace_kind, record_id, created_at desc);

-- Enable RLS on every new table. Access is staff-only and constrained by institution
-- plus assigned faculty ownership or HOD/coordinator department authority.
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['academic_classes','academic_subjects','academic_students','faculty_workspace_records','faculty_study_plan_items','faculty_lecture_executions','attendance_sessions','attendance_records','assignment_records','assignment_submissions','marks_records','hod_workspace_records','workspace_workflow_events'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- Academic reference data: staff may read within their institution; only scoped academic leaders can write.
create policy academic_classes_read on public.academic_classes for select to authenticated using (institution_id = (select app_private.current_institution()));
create policy academic_classes_write on public.academic_classes for all to authenticated using (institution_id = (select app_private.current_institution()) and (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator'], department_id))) with check (institution_id = (select app_private.current_institution()) and (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator'], department_id)));
create policy academic_subjects_read on public.academic_subjects for select to authenticated using (institution_id = (select app_private.current_institution()));
create policy academic_subjects_write on public.academic_subjects for all to authenticated using (institution_id = (select app_private.current_institution()) and (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator'], department_id))) with check (institution_id = (select app_private.current_institution()) and (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator'], department_id)));
create policy academic_students_read on public.academic_students for select to authenticated using (institution_id = (select app_private.current_institution()) and (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator','faculty'], department_id)));
create policy academic_students_write on public.academic_students for all to authenticated using (institution_id = (select app_private.current_institution()) and (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator'], department_id))) with check (institution_id = (select app_private.current_institution()) and (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator'], department_id)));

create policy faculty_workspace_read on public.faculty_workspace_records for select to authenticated using (institution_id = (select app_private.current_institution()) and (owner_user_id = (select auth.uid()) or (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator'], department_id))));
create policy faculty_workspace_insert on public.faculty_workspace_records for insert to authenticated with check (institution_id = (select app_private.current_institution()) and owner_user_id = (select auth.uid()) and created_by = (select auth.uid()) and updated_by = (select auth.uid()) and (select app_private.has_scoped_role(array['faculty','hod','coordinator','principal','administrator'], department_id)));
create policy faculty_workspace_update on public.faculty_workspace_records for update to authenticated using (institution_id = (select app_private.current_institution()) and (owner_user_id = (select auth.uid()) or (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator'], department_id)))) with check (institution_id = (select app_private.current_institution()) and updated_by = (select auth.uid()) and (owner_user_id = (select auth.uid()) or (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator'], department_id))));
create policy faculty_workspace_delete on public.faculty_workspace_records for delete to authenticated using (institution_id = (select app_private.current_institution()) and owner_user_id = (select auth.uid()) and status in ('draft','returned'));

create policy faculty_study_read on public.faculty_study_plan_items for select to authenticated using (institution_id = (select app_private.current_institution()) and (faculty_user_id = (select auth.uid()) or (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator'], department_id))));
create policy faculty_study_insert on public.faculty_study_plan_items for insert to authenticated with check (institution_id = (select app_private.current_institution()) and faculty_user_id = (select auth.uid()) and (select app_private.has_scoped_role(array['faculty','hod'], department_id)));
create policy faculty_study_update on public.faculty_study_plan_items for update to authenticated using (institution_id = (select app_private.current_institution()) and (faculty_user_id = (select auth.uid()) or (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator'], department_id)))) with check (institution_id = (select app_private.current_institution()) and (faculty_user_id = (select auth.uid()) or (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator'], department_id))));

create policy faculty_lecture_read on public.faculty_lecture_executions for select to authenticated using (institution_id = (select app_private.current_institution()) and (faculty_user_id = (select auth.uid()) or (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator'], department_id))));
create policy faculty_lecture_write on public.faculty_lecture_executions for all to authenticated using (institution_id = (select app_private.current_institution()) and faculty_user_id = (select auth.uid()) and (select app_private.has_scoped_role(array['faculty','hod'], department_id))) with check (institution_id = (select app_private.current_institution()) and faculty_user_id = (select auth.uid()) and (select app_private.has_scoped_role(array['faculty','hod'], department_id)));

create policy attendance_sessions_read on public.attendance_sessions for select to authenticated using (institution_id = (select app_private.current_institution()) and (faculty_user_id = (select auth.uid()) or (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator'], department_id))));
create policy attendance_sessions_write on public.attendance_sessions for all to authenticated using (institution_id = (select app_private.current_institution()) and (faculty_user_id = (select auth.uid()) or (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator'], department_id)))) with check (institution_id = (select app_private.current_institution()) and (faculty_user_id = (select auth.uid()) or (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator'], department_id))));
create policy attendance_records_read on public.attendance_records for select to authenticated using (institution_id = (select app_private.current_institution()) and (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator','faculty'], department_id)));
create policy attendance_records_write on public.attendance_records for all to authenticated using (institution_id = (select app_private.current_institution()) and recorded_by = (select auth.uid()) and (select app_private.has_scoped_role(array['faculty','hod','coordinator'], department_id))) with check (institution_id = (select app_private.current_institution()) and recorded_by = (select auth.uid()) and (select app_private.has_scoped_role(array['faculty','hod','coordinator'], department_id)));

create policy assignment_records_read on public.assignment_records for select to authenticated using (institution_id = (select app_private.current_institution()) and (owner_user_id = (select auth.uid()) or (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator'], department_id))));
create policy assignment_records_write on public.assignment_records for all to authenticated using (institution_id = (select app_private.current_institution()) and (owner_user_id = (select auth.uid()) or (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator'], department_id)))) with check (institution_id = (select app_private.current_institution()) and (owner_user_id = (select auth.uid()) or (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator'], department_id))));
create policy assignment_submissions_read on public.assignment_submissions for select to authenticated using (exists (select 1 from public.assignment_records a where a.id = assignment_id and a.institution_id = (select app_private.current_institution()) and (a.owner_user_id = (select auth.uid()) or (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator','faculty'], a.department_id)))));
create policy assignment_submissions_write on public.assignment_submissions for all to authenticated using (exists (select 1 from public.assignment_records a where a.id = assignment_id and a.institution_id = (select app_private.current_institution()) and (a.owner_user_id = (select auth.uid()) or (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator','faculty'], a.department_id))))) with check (exists (select 1 from public.assignment_records a where a.id = assignment_id and a.institution_id = (select app_private.current_institution()) and (a.owner_user_id = (select auth.uid()) or (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator','faculty'], a.department_id)))));

create policy marks_records_read on public.marks_records for select to authenticated using (institution_id = (select app_private.current_institution()) and (faculty_user_id = (select auth.uid()) or (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator'], department_id))));
create policy marks_records_insert on public.marks_records for insert to authenticated with check (institution_id = (select app_private.current_institution()) and faculty_user_id = (select auth.uid()) and (select app_private.has_scoped_role(array['faculty','hod'], department_id)) and status in ('draft','submitted'));
create policy marks_records_update on public.marks_records for update to authenticated using (institution_id = (select app_private.current_institution()) and (faculty_user_id = (select auth.uid()) or (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator'], department_id)))) with check (institution_id = (select app_private.current_institution()) and (faculty_user_id = (select auth.uid()) or (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator'], department_id))));

create policy hod_workspace_read on public.hod_workspace_records for select to authenticated using (institution_id = (select app_private.current_institution()) and ((hod_user_id = (select auth.uid()) and (select app_private.has_scoped_role(array['hod'], department_id))) or (select app_private.has_scoped_role(array['principal','administrator'], department_id))));
create policy hod_workspace_insert on public.hod_workspace_records for insert to authenticated with check (institution_id = (select app_private.current_institution()) and hod_user_id = (select auth.uid()) and created_by = (select auth.uid()) and updated_by = (select auth.uid()) and (select app_private.has_scoped_role(array['hod'], department_id)));
create policy hod_workspace_update on public.hod_workspace_records for update to authenticated using (institution_id = (select app_private.current_institution()) and ((hod_user_id = (select auth.uid()) and (select app_private.has_scoped_role(array['hod'], department_id))) or (select app_private.has_scoped_role(array['principal','administrator'], department_id)))) with check (institution_id = (select app_private.current_institution()) and updated_by = (select auth.uid()) and ((hod_user_id = (select auth.uid()) and (select app_private.has_scoped_role(array['hod'], department_id))) or (select app_private.has_scoped_role(array['principal','administrator'], department_id))));
create policy hod_workspace_delete on public.hod_workspace_records for delete to authenticated using (institution_id = (select app_private.current_institution()) and hod_user_id = (select auth.uid()) and status in ('draft','open'));

create policy workspace_events_read on public.workspace_workflow_events for select to authenticated using (institution_id = (select app_private.current_institution()) and (actor_user_id = (select auth.uid()) or (select app_private.has_role(array['principal','administrator'])) or (department_id is not null and (select app_private.has_scoped_role(array['hod','coordinator'], department_id)))));
create policy workspace_events_insert on public.workspace_workflow_events for insert to authenticated with check (institution_id = (select app_private.current_institution()) and actor_user_id = (select auth.uid()));

-- Explicit grants: new tables remain inaccessible to anon; authenticated access is RLS-governed.
grant select, insert, update, delete on public.academic_classes, public.academic_subjects, public.academic_students,
  public.faculty_workspace_records, public.faculty_study_plan_items, public.faculty_lecture_executions,
  public.attendance_sessions, public.attendance_records, public.assignment_records, public.assignment_submissions,
  public.marks_records, public.hod_workspace_records, public.workspace_workflow_events to authenticated;
revoke all on public.academic_classes, public.academic_subjects, public.academic_students,
  public.faculty_workspace_records, public.faculty_study_plan_items, public.faculty_lecture_executions,
  public.attendance_sessions, public.attendance_records, public.assignment_records, public.assignment_submissions,
  public.marks_records, public.hod_workspace_records, public.workspace_workflow_events from anon;
