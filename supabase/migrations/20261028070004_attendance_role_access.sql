-- Attendance access matrix:
-- Faculty can read their own sessions/records and maintain records only while a session is draft/returned.
-- HODs can read/review within their assigned department; Principals/Admins can read/review institution-wide.
drop policy if exists attendance_sessions_read on public.attendance_sessions;
drop policy if exists attendance_sessions_write on public.attendance_sessions;
drop policy if exists attendance_sessions_insert on public.attendance_sessions;
drop policy if exists attendance_sessions_update on public.attendance_sessions;
drop policy if exists attendance_records_read on public.attendance_records;
drop policy if exists attendance_records_write on public.attendance_records;
drop policy if exists attendance_records_insert on public.attendance_records;
drop policy if exists attendance_records_update on public.attendance_records;

create policy attendance_sessions_read
on public.attendance_sessions for select to authenticated
using (
  institution_id = (select app_private.current_institution())
  and (
    faculty_user_id = (select auth.uid())
    or (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator'], department_id))
  )
);

create policy attendance_sessions_insert
on public.attendance_sessions for insert to authenticated
with check (
  institution_id = (select app_private.current_institution())
  and faculty_user_id = (select auth.uid())
  and (select app_private.has_scoped_role(array['faculty','hod','coordinator'], department_id))
);

create policy attendance_sessions_update
on public.attendance_sessions for update to authenticated
using (
  institution_id = (select app_private.current_institution())
  and (
    faculty_user_id = (select auth.uid())
    or (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator'], department_id))
  )
)
with check (
  institution_id = (select app_private.current_institution())
  and (
    faculty_user_id = (select auth.uid())
    or (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator'], department_id))
  )
);

create policy attendance_records_read
on public.attendance_records for select to authenticated
using (
  institution_id = (select app_private.current_institution())
  and (
    recorded_by = (select auth.uid())
    or exists (
      select 1 from public.attendance_sessions s
      where s.id = attendance_records.session_id
        and s.institution_id = attendance_records.institution_id
        and s.department_id = attendance_records.department_id
        and (
          s.faculty_user_id = (select auth.uid())
          or (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator'], s.department_id))
        )
    )
  )
);

create policy attendance_records_insert
on public.attendance_records for insert to authenticated
with check (
  institution_id = (select app_private.current_institution())
  and recorded_by = (select auth.uid())
  and exists (
    select 1 from public.attendance_sessions s
    where s.id = attendance_records.session_id
      and s.institution_id = attendance_records.institution_id
      and s.department_id = attendance_records.department_id
      and s.faculty_user_id = (select auth.uid())
      and s.status in ('draft','returned')
  )
);

create policy attendance_records_update
on public.attendance_records for update to authenticated
using (
  institution_id = (select app_private.current_institution())
  and recorded_by = (select auth.uid())
  and exists (
    select 1 from public.attendance_sessions s
    where s.id = attendance_records.session_id
      and s.institution_id = attendance_records.institution_id
      and s.department_id = attendance_records.department_id
      and s.faculty_user_id = (select auth.uid())
      and s.status in ('draft','returned')
  )
)
with check (
  institution_id = (select app_private.current_institution())
  and recorded_by = (select auth.uid())
  and exists (
    select 1 from public.attendance_sessions s
    where s.id = attendance_records.session_id
      and s.institution_id = attendance_records.institution_id
      and s.department_id = attendance_records.department_id
      and s.faculty_user_id = (select auth.uid())
      and s.status in ('draft','returned')
  )
);

revoke all on public.attendance_sessions from anon;
revoke all on public.attendance_records from anon;
revoke delete on public.attendance_sessions, public.attendance_records from authenticated;
grant select, insert, update on public.attendance_sessions to authenticated;
grant select, insert, update on public.attendance_records to authenticated;
