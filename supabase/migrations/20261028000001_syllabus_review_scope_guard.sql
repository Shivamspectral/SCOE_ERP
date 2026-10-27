-- Restrict syllabus creation and edits to teaching roles and protect submitted work.
-- RLS is the final authorization boundary, including requests made directly through PostgREST.

drop policy if exists syllabus_insert on public.syllabus_progress;
create policy syllabus_insert on public.syllabus_progress
  for insert to authenticated
  with check (
    institution_id = (select app_private.current_institution())
    and faculty_id = (select auth.uid())
    and updated_by = (select auth.uid())
    and review_status = 'draft'
    and (select app_private.has_scoped_role(array['faculty','hod'], department_id))
  );

drop policy if exists syllabus_update on public.syllabus_progress;
create policy syllabus_update on public.syllabus_progress
  for update to authenticated
  using (
    institution_id = (select app_private.current_institution())
    and (
      (
        faculty_id = (select auth.uid())
        and review_status in ('draft','returned')
        and (select app_private.has_scoped_role(array['faculty','hod'], department_id))
      )
      or (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator'], department_id))
    )
  )
  with check (
    institution_id = (select app_private.current_institution())
    and updated_by = (select auth.uid())
    and (
      (
        faculty_id = (select auth.uid())
        and review_status in ('draft','submitted','returned')
        and (select app_private.has_scoped_role(array['faculty','hod'], department_id))
      )
      or (
        (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator'], department_id))
        and review_status in ('draft','submitted','reviewed','returned')
      )
    )
  );
