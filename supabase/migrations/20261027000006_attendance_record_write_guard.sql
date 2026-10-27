-- Attendance records are mutable only while their owning session is a draft or
-- has been returned for correction. Enforce this in PostgreSQL, not only in UI/API.

create or replace function app_private.guard_attendance_record_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_record_id uuid;
  v_institution uuid;
  v_department uuid;
  v_class uuid;
  v_faculty uuid;
  v_status text;
begin
  if tg_op = 'DELETE' then
    v_record_id := old.session_id;
  else
    v_record_id := new.session_id;
  end if;

  select s.institution_id, s.department_id, s.class_id, s.faculty_user_id, s.status
    into v_institution, v_department, v_class, v_faculty, v_status
  from public.attendance_sessions s
  where s.id = v_record_id;

  if not found then
    raise exception 'Attendance session does not exist' using errcode = '23503';
  end if;

  if tg_op = 'DELETE' then
    if v_status not in ('draft','returned')
      or v_faculty is distinct from (select auth.uid())
      or old.recorded_by is distinct from (select auth.uid())
      or not (select app_private.has_scoped_role(array['faculty','hod','coordinator'], v_department)) then
      raise exception 'Attendance records can only be deleted by the session owner before submission' using errcode = '42501';
    end if;
    return old;
  end if;

  if new.institution_id is distinct from v_institution
    or new.department_id is distinct from v_department then
    raise exception 'Attendance record scope must match its session' using errcode = '42501';
  end if;

  if v_status not in ('draft','returned')
    or v_faculty is distinct from (select auth.uid())
    or new.recorded_by is distinct from (select auth.uid())
    or not (select app_private.has_scoped_role(array['faculty','hod','coordinator'], v_department)) then
    raise exception 'Only the authorized session owner can edit attendance before submission' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.academic_students s
    where s.id = new.student_id
      and s.institution_id = v_institution
      and s.department_id = v_department
      and s.class_id = v_class
      and s.status = 'active'
  ) then
    raise exception 'Attendance records must reference an active student in the session class' using errcode = '23514';
  end if;

  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id
      or new.session_id is distinct from old.session_id
      or new.student_id is distinct from old.student_id
      or new.recorded_by is distinct from old.recorded_by then
      raise exception 'Attendance record identity cannot be changed' using errcode = '42501';
    end if;
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists attendance_record_write_guard on public.attendance_records;
create trigger attendance_record_write_guard
before insert or update or delete on public.attendance_records
for each row execute function app_private.guard_attendance_record_write();

revoke all on function app_private.guard_attendance_record_write() from public, anon, authenticated;

-- Attendance session identity and scheduling details are immutable after creation.
create or replace function app_private.guard_attendance_session_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.institution_id is distinct from old.institution_id
    or new.department_id is distinct from old.department_id
    or new.class_id is distinct from old.class_id
    or new.subject_id is distinct from old.subject_id
    or new.faculty_user_id is distinct from old.faculty_user_id
    or new.session_date is distinct from old.session_date
    or new.session_label is distinct from old.session_label
    or new.academic_year is distinct from old.academic_year
    or new.semester is distinct from old.semester
    or new.lecture_no is distinct from old.lecture_no then
    raise exception 'Attendance session identity and scheduling fields cannot be changed' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists attendance_session_identity_guard on public.attendance_sessions;
create trigger attendance_session_identity_guard
before update on public.attendance_sessions
for each row execute function app_private.guard_attendance_session_identity();

revoke all on function app_private.guard_attendance_session_identity() from public, anon, authenticated;

-- Split session writes so a teaching-role owner can create a session, while
-- department leadership can review it without being able to create arbitrary sessions.
drop policy if exists attendance_sessions_write on public.attendance_sessions;
drop policy if exists attendance_sessions_insert on public.attendance_sessions;
drop policy if exists attendance_sessions_update on public.attendance_sessions;
drop policy if exists attendance_sessions_delete on public.attendance_sessions;

create policy attendance_sessions_insert on public.attendance_sessions
  for insert to authenticated
  with check (
    institution_id = (select app_private.current_institution())
    and faculty_user_id = (select auth.uid())
    and (select app_private.has_scoped_role(array['faculty','hod','coordinator'], department_id))
  );

create policy attendance_sessions_update on public.attendance_sessions
  for update to authenticated
  using (
    institution_id = (select app_private.current_institution())
    and (
      (faculty_user_id = (select auth.uid()) and (select app_private.has_scoped_role(array['faculty','hod','coordinator'], department_id)))
      or (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator'], department_id))
    )
  )
  with check (
    institution_id = (select app_private.current_institution())
    and (
      (faculty_user_id = (select auth.uid()) and (select app_private.has_scoped_role(array['faculty','hod','coordinator'], department_id)))
      or (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator'], department_id))
    )
  );

create policy attendance_sessions_delete on public.attendance_sessions
  for delete to authenticated
  using (
    institution_id = (select app_private.current_institution())
    and faculty_user_id = (select auth.uid())
    and status in ('draft','returned')
    and (select app_private.has_scoped_role(array['faculty','hod','coordinator'], department_id))
  );
