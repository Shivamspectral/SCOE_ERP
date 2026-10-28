-- Faculty mentor-mentee assignments and confidential counselling logs.
create table if not exists public.faculty_mentoring_assignments (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete restrict,
  faculty_user_id uuid not null references public.profiles(user_id) on delete restrict,
  student_id uuid not null references public.academic_students(id) on delete restrict,
  academic_year text not null,
  status text not null default 'active' check (status in ('active','inactive','completed')),
  notes text,
  assigned_by uuid not null references public.profiles(user_id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, faculty_user_id, student_id, academic_year)
);

create index if not exists faculty_mentoring_assignment_owner_idx
  on public.faculty_mentoring_assignments(institution_id, faculty_user_id, status, academic_year);
create index if not exists faculty_mentoring_assignment_department_idx
  on public.faculty_mentoring_assignments(institution_id, department_id, status, academic_year);

create table if not exists public.faculty_mentoring_meetings (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.faculty_mentoring_assignments(id) on delete cascade,
  institution_id uuid not null references public.institutions(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete restrict,
  faculty_user_id uuid not null references public.profiles(user_id) on delete restrict,
  student_id uuid not null references public.academic_students(id) on delete restrict,
  meeting_at timestamptz not null default now(),
  category text not null default 'academic' check (category in ('academic','attendance','career','wellbeing','discipline','other')),
  notes text not null check (length(btrim(notes)) > 0),
  action_plan text,
  follow_up_on date,
  status text not null default 'open' check (status in ('open','resolved')),
  created_by uuid not null references public.profiles(user_id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists faculty_mentoring_meetings_student_idx
  on public.faculty_mentoring_meetings(institution_id, student_id, meeting_at desc);
create index if not exists faculty_mentoring_meetings_assignment_idx
  on public.faculty_mentoring_meetings(assignment_id, meeting_at desc);

create or replace function app_private.guard_faculty_mentoring_assignment()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  student_row record;
  faculty_row record;
begin
  select institution_id, department_id, status into student_row
  from public.academic_students where id = new.student_id;
  if not found or student_row.institution_id is distinct from new.institution_id
    or student_row.department_id is distinct from new.department_id
    or student_row.status <> 'active' then
    raise exception 'Mentee must be an active student in the selected institution and department' using errcode = '23514';
  end if;

  select institution_id, department_id, status into faculty_row
  from public.profiles where user_id = new.faculty_user_id;
  if not found or faculty_row.institution_id is distinct from new.institution_id
    or faculty_row.status <> 'active' then
    raise exception 'Mentor must be an active staff profile in this institution' using errcode = '23514';
  end if;

  if not exists (
    select 1 from public.role_assignments ra
    where ra.user_id = new.faculty_user_id and ra.role = 'faculty' and ra.status = 'active'
      and ra.department_id = new.department_id
  ) then
    raise exception 'Mentor must have an active faculty role in the selected department' using errcode = '23514';
  end if;

  if new.institution_id is distinct from (select app_private.current_institution()) then
    raise exception 'Mentoring assignment must belong to the current institution' using errcode = '42501';
  end if;
  return new;
end;
$$;

create or replace function app_private.guard_faculty_mentoring_meeting()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare assignment_row record;
begin
  select institution_id, department_id, faculty_user_id, student_id, status into assignment_row
  from public.faculty_mentoring_assignments where id = new.assignment_id;
  if not found or assignment_row.status <> 'active'
    or assignment_row.institution_id is distinct from new.institution_id
    or assignment_row.department_id is distinct from new.department_id
    or assignment_row.faculty_user_id is distinct from new.faculty_user_id
    or assignment_row.student_id is distinct from new.student_id then
    raise exception 'Counselling meeting must match an active mentor assignment' using errcode = '23514';
  end if;
  if new.institution_id is distinct from (select app_private.current_institution()) then
    raise exception 'Counselling meeting must belong to the current institution' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists faculty_mentoring_assignment_scope_guard on public.faculty_mentoring_assignments;
create trigger faculty_mentoring_assignment_scope_guard
before insert or update on public.faculty_mentoring_assignments
for each row execute function app_private.guard_faculty_mentoring_assignment();
drop trigger if exists faculty_mentoring_meeting_scope_guard on public.faculty_mentoring_meetings;
create trigger faculty_mentoring_meeting_scope_guard
before insert or update on public.faculty_mentoring_meetings
for each row execute function app_private.guard_faculty_mentoring_meeting();

create trigger faculty_mentoring_assignments_touch_updated_at
before update on public.faculty_mentoring_assignments
for each row execute function app_private.touch_updated_at();
create trigger faculty_mentoring_meetings_touch_updated_at
before update on public.faculty_mentoring_meetings
for each row execute function app_private.touch_updated_at();
create trigger faculty_mentoring_assignments_audit
after insert or update or delete on public.faculty_mentoring_assignments
for each row execute function app_private.audit_row_change('faculty_mentoring_assignments');
create trigger faculty_mentoring_meetings_audit
after insert or update or delete on public.faculty_mentoring_meetings
for each row execute function app_private.audit_row_change('faculty_mentoring_meetings');

alter table public.faculty_mentoring_assignments enable row level security;
alter table public.faculty_mentoring_meetings enable row level security;
grant select, insert, update on public.faculty_mentoring_assignments to authenticated;
grant select, insert, update on public.faculty_mentoring_meetings to authenticated;
revoke delete on public.faculty_mentoring_assignments from authenticated;
revoke delete on public.faculty_mentoring_meetings from authenticated;

create policy faculty_mentoring_assignments_select on public.faculty_mentoring_assignments
for select to authenticated using (
  institution_id = (select app_private.current_institution())
  and (
    faculty_user_id = (select auth.uid())
    or (select app_private.has_role(array['principal','administrator']))
    or (select app_private.has_scoped_role(array['hod','coordinator'], department_id))
  )
);
create policy faculty_mentoring_assignments_insert on public.faculty_mentoring_assignments
for insert to authenticated with check (
  institution_id = (select app_private.current_institution())
  and assigned_by = (select auth.uid())
  and (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator'], department_id))
);
create policy faculty_mentoring_assignments_update on public.faculty_mentoring_assignments
for update to authenticated using (
  institution_id = (select app_private.current_institution())
  and (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator'], department_id))
) with check (
  institution_id = (select app_private.current_institution())
);

create policy faculty_mentoring_meetings_select on public.faculty_mentoring_meetings
for select to authenticated using (
  institution_id = (select app_private.current_institution())
  and (
    faculty_user_id = (select auth.uid())
    or (select app_private.has_role(array['principal','administrator']))
    or (select app_private.has_scoped_role(array['hod','coordinator'], department_id))
  )
);
create policy faculty_mentoring_meetings_insert on public.faculty_mentoring_meetings
for insert to authenticated with check (
  institution_id = (select app_private.current_institution())
  and created_by = (select auth.uid())
  and (
    faculty_user_id = (select auth.uid())
    or (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator'], department_id))
  )
);
create policy faculty_mentoring_meetings_update on public.faculty_mentoring_meetings
for update to authenticated using (
  institution_id = (select app_private.current_institution())
  and (
    faculty_user_id = (select auth.uid())
    or (select app_private.has_role(array['principal','administrator']))
    or (select app_private.has_scoped_role(array['hod','coordinator'], department_id))
  )
) with check (
  institution_id = (select app_private.current_institution())
);

revoke all on function app_private.guard_faculty_mentoring_assignment() from public, anon, authenticated;
revoke all on function app_private.guard_faculty_mentoring_meeting() from public, anon, authenticated;
