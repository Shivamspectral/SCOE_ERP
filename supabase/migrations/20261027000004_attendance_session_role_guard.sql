-- Close the role gap in the original attendance session policy.
-- The prior policy allowed any active institutional user to create a session by
-- setting faculty_user_id to their own auth.uid(), even without an academic role.

drop policy if exists attendance_sessions_write on public.attendance_sessions;

create policy attendance_sessions_write on public.attendance_sessions
  for all to authenticated
  using (
    institution_id = (select app_private.current_institution())
    and (
      (
        faculty_user_id = (select auth.uid())
        and (select app_private.has_scoped_role(array['faculty','hod','coordinator'], department_id))
      )
      or (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator'], department_id))
    )
  )
  with check (
    institution_id = (select app_private.current_institution())
    and (
      (
        faculty_user_id = (select auth.uid())
        and (select app_private.has_scoped_role(array['faculty','hod','coordinator'], department_id))
      )
      or (
        faculty_user_id = (select auth.uid())
        and (select app_private.has_scoped_role(array['principal','administrator'], department_id))
      )
      or (
        faculty_user_id <> (select auth.uid())
        and (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator'], department_id))
      )
    )
  );
