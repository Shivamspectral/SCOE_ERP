-- Ensure updates cannot move mentoring assignments or notes outside the caller's role scope.
drop policy if exists faculty_mentoring_assignments_update on public.faculty_mentoring_assignments;
create policy faculty_mentoring_assignments_update on public.faculty_mentoring_assignments
for update to authenticated
using (
  institution_id = (select app_private.current_institution())
  and (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator'], department_id))
)
with check (
  institution_id = (select app_private.current_institution())
  and (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator'], department_id))
);

drop policy if exists faculty_mentoring_meetings_update on public.faculty_mentoring_meetings;
create policy faculty_mentoring_meetings_update on public.faculty_mentoring_meetings
for update to authenticated
using (
  institution_id = (select app_private.current_institution())
  and (
    faculty_user_id = (select auth.uid())
    or (select app_private.has_role(array['principal','administrator']))
    or (select app_private.has_scoped_role(array['hod','coordinator'], department_id))
  )
)
with check (
  institution_id = (select app_private.current_institution())
  and (
    faculty_user_id = (select auth.uid())
    or (select app_private.has_role(array['principal','administrator']))
    or (select app_private.has_scoped_role(array['hod','coordinator'], department_id))
  )
);
