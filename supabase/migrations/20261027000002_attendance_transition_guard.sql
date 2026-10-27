-- Enforce attendance state transitions in PostgreSQL as well as in the API.
-- This prevents direct PostgREST calls from bypassing the faculty/reviewer workflow.

create or replace function app_private.enforce_attendance_session_transition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is not distinct from old.status then
    if new.submitted_at is distinct from old.submitted_at
      or new.verified_by is distinct from old.verified_by
      or new.verified_at is distinct from old.verified_at
      or new.review_note is distinct from old.review_note then
      raise exception 'Attendance review metadata can only change during a valid status transition' using errcode = '42501';
    end if;
    return new;
  end if;

  if old.status in ('draft', 'returned') and new.status = 'submitted' then
    if old.faculty_user_id <> auth.uid() then
      raise exception 'Only the faculty owner can submit this attendance session' using errcode = '42501';
    end if;

    if not exists (
      select 1 from public.academic_students s
      where s.institution_id = old.institution_id
        and s.department_id = old.department_id
        and s.class_id = old.class_id
        and s.status = 'active'
    ) then
      raise exception 'Cannot submit attendance for a class with no active students' using errcode = '23514';
    end if;

    if exists (
      select 1 from public.academic_students s
      where s.institution_id = old.institution_id
        and s.department_id = old.department_id
        and s.class_id = old.class_id
        and s.status = 'active'
        and not exists (
          select 1 from public.attendance_records r
          where r.session_id = old.id and r.student_id = s.id
        )
    ) then
      raise exception 'Attendance is incomplete for one or more active students' using errcode = '23514';
    end if;

    new.submitted_at := coalesce(new.submitted_at, now());
    new.verified_by := null;
    new.verified_at := null;
    new.review_note := null;
    return new;
  end if;

  if old.status = 'submitted' and new.status in ('verified', 'returned') then
    if not (
      (select app_private.has_role(array['principal', 'administrator']))
      or (select app_private.has_scoped_role(array['hod', 'coordinator'], old.department_id))
    ) then
      raise exception 'Only authorized department leadership can review attendance' using errcode = '42501';
    end if;

    if new.status = 'verified' then
      new.verified_by := auth.uid();
      new.verified_at := coalesce(new.verified_at, now());
      new.review_note := null;
    else
      if nullif(btrim(new.review_note), '') is null then
        raise exception 'A correction reason is required when returning attendance' using errcode = '23514';
      end if;
      new.verified_by := null;
      new.verified_at := null;
    end if;
    return new;
  end if;

  raise exception 'Invalid attendance status transition: % -> %', old.status, new.status using errcode = '23514';
end;
$$;

drop trigger if exists attendance_session_transition_guard on public.attendance_sessions;
create trigger attendance_session_transition_guard
before update on public.attendance_sessions
for each row execute function app_private.enforce_attendance_session_transition();

revoke all on function app_private.enforce_attendance_session_transition() from public, anon, authenticated;
