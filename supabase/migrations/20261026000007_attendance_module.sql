-- Attendance module extension for Astra+ Campus. Apply after 20261026000006_faculty_hod_workspaces.sql.
-- Uses the existing shared academic_classes, academic_subjects, academic_students, attendance_sessions and attendance_records tables.

alter table public.attendance_sessions
  add column if not exists academic_year text,
  add column if not exists semester smallint check (semester between 1 and 12),
  add column if not exists lecture_no smallint check (lecture_no between 1 and 12),
  add column if not exists submitted_at timestamptz,
  add column if not exists verified_by uuid references public.profiles(user_id) on delete set null,
  add column if not exists verified_at timestamptz;

-- Preserve the existing session status workflow while adding a named submitted timestamp.
create index if not exists attendance_sessions_duplicate_check_idx
  on public.attendance_sessions(institution_id, class_id, subject_id, session_date, lecture_no)
  where status in ('submitted','verified');

alter table public.attendance_records drop constraint if exists attendance_records_attendance_status_check;
alter table public.attendance_records add constraint attendance_records_attendance_status_check
  check (attendance_status in ('present','absent','late','excused','on_duty'));

create table if not exists public.attendance_settings (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  department_id uuid references public.departments(id) on delete cascade,
  minimum_percentage numeric(5,2) not null default 75 check (minimum_percentage between 1 and 100),
  count_on_duty_as_present boolean not null default true,
  lectures_per_day smallint not null default 8 check (lectures_per_day between 1 and 12),
  allow_edit_after_submit boolean not null default false,
  pending_lookback_days smallint not null default 7 check (pending_lookback_days between 1 and 60),
  updated_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (institution_id, department_id)
);
create index if not exists attendance_settings_scope_idx on public.attendance_settings(institution_id, department_id);

alter table public.attendance_settings enable row level security;
drop policy if exists attendance_settings_read on public.attendance_settings;
create policy attendance_settings_read on public.attendance_settings for select to authenticated
  using (institution_id = (select app_private.current_institution()) and (department_id is null or (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator','faculty'], department_id))));
drop policy if exists attendance_settings_manage on public.attendance_settings;
create policy attendance_settings_manage on public.attendance_settings for all to authenticated
  using (institution_id = (select app_private.current_institution()) and updated_by = (select auth.uid()) and (department_id is null and (select app_private.has_role(array['principal','administrator'])) or department_id is not null and (select app_private.has_scoped_role(array['hod','principal','administrator'], department_id))))
  with check (institution_id = (select app_private.current_institution()) and updated_by = (select auth.uid()) and (department_id is null and (select app_private.has_role(array['principal','administrator'])) or department_id is not null and (select app_private.has_scoped_role(array['hod','principal','administrator'], department_id))));
grant select, insert, update, delete on public.attendance_settings to authenticated;
revoke all on public.attendance_settings from anon;
