-- Assignment submissions are readable within the academic scope, but write access is limited
-- to the assignment owner and scoped academic leadership.
drop policy if exists assignment_submissions_write on public.assignment_submissions;
create policy assignment_submissions_write
on public.assignment_submissions for all to authenticated
using (
  exists (
    select 1 from public.assignment_records a
    where a.id = assignment_id
      and a.institution_id = (select app_private.current_institution())
      and (
        a.owner_user_id = (select auth.uid())
        or (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator'], a.department_id))
      )
  )
)
with check (
  exists (
    select 1 from public.assignment_records a
    where a.id = assignment_id
      and a.institution_id = (select app_private.current_institution())
      and (
        a.owner_user_id = (select auth.uid())
        or (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator'], a.department_id))
      )
  )
);
