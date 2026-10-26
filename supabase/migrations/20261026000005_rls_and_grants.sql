-- Astra+ Campus: row level security and table privileges.
-- Default-deny: every table has RLS on, clients only get the grants listed here, and
-- workflow, role, audit and notification writes go through SECURITY DEFINER functions.

-- Nothing in public is reachable by default; grants below are explicit.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated, public;

revoke all on all tables in schema public from anon, authenticated;

grant usage on schema app_private to authenticated;
revoke all on all functions in schema app_private from public, anon;
grant execute on function
  app_private.current_institution(),
  app_private.current_department(),
  app_private.has_role(text[]),
  app_private.has_scoped_role(text[], uuid),
  app_private.is_admin(),
  app_private.can_publish_circulars(),
  app_private.is_workflow_approver(uuid)
to authenticated;

-- Range constructors are evaluated by the timetable exclusion constraints on behalf of the caller.
grant execute on function
  app_private.timerange(time, time),
  app_private.timerange(time, time, text)
to authenticated;

alter table public.institutions               enable row level security;
alter table public.departments                enable row level security;
alter table public.profiles                   enable row level security;
alter table public.responsibilities           enable row level security;
alter table public.role_assignments           enable row level security;
alter table public.workflow_requests          enable row level security;
alter table public.workflow_steps             enable row level security;
alter table public.audit_logs                 enable row level security;
alter table public.notifications              enable row level security;
alter table public.syllabus_progress          enable row level security;
alter table public.timetable_entries          enable row level security;
alter table public.circulars                  enable row level security;
alter table public.circular_acknowledgements  enable row level security;
alter table public.documents                  enable row level security;

-- ---------------------------------------------------------------- institutions
grant select on public.institutions to authenticated;
grant update (name, timezone) on public.institutions to authenticated;

create policy institutions_select on public.institutions for select to authenticated
  using (id = (select app_private.current_institution()));
create policy institutions_update on public.institutions for update to authenticated
  using (id = (select app_private.current_institution()) and (select app_private.is_admin()))
  with check (id = (select app_private.current_institution()));

-- ----------------------------------------------------------------- departments
grant select on public.departments to authenticated;
grant insert (institution_id, code, name, description, created_by) on public.departments to authenticated;
grant update (code, name, description, status) on public.departments to authenticated;

create policy departments_select on public.departments for select to authenticated
  using (institution_id = (select app_private.current_institution()));
create policy departments_insert on public.departments for insert to authenticated
  with check (
    institution_id = (select app_private.current_institution())
    and (select app_private.is_admin())
    and created_by = (select auth.uid())
  );
create policy departments_update on public.departments for update to authenticated
  using (institution_id = (select app_private.current_institution()) and (select app_private.is_admin()))
  with check (institution_id = (select app_private.current_institution()));

-- -------------------------------------------------------------------- profiles
grant select on public.profiles to authenticated;
grant update (full_name, title, phone) on public.profiles to authenticated;

create policy profiles_select on public.profiles for select to authenticated
  using (
    user_id = (select auth.uid())
    or (
      institution_id = (select app_private.current_institution())
      and (status = 'active' or (select app_private.is_admin()))
    )
  );
create policy profiles_update_self on public.profiles for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ------------------------------------------------------------- responsibilities
grant select on public.responsibilities to authenticated;
create policy responsibilities_select on public.responsibilities for select to authenticated
  using (institution_id = (select app_private.current_institution()));

-- ------------------------------------------------------------ role_assignments
grant select on public.role_assignments to authenticated;
create policy role_assignments_select on public.role_assignments for select to authenticated
  using (
    user_id = (select auth.uid())
    or institution_id = (select app_private.current_institution())
  );

-- ---------------------------------------------------------------- workflow data
grant select on public.workflow_requests to authenticated;
grant select on public.workflow_steps to authenticated;

create policy workflow_requests_select on public.workflow_requests for select to authenticated
  using (
    institution_id = (select app_private.current_institution())
    and (
      (select app_private.is_admin())
      or requester_id = (select auth.uid())
      or owner_id = (select auth.uid())
      or (select app_private.is_workflow_approver(id))
      or (department_id is not null and (select app_private.has_scoped_role(array['hod', 'coordinator'], department_id)))
    )
  );

create policy workflow_steps_select on public.workflow_steps for select to authenticated
  using (
    institution_id = (select app_private.current_institution())
    and (
      approver_id = (select auth.uid())
      or (select app_private.is_admin())
      or exists (select 1 from public.workflow_requests r where r.id = workflow_id)
    )
  );

-- ------------------------------------------------------------------- audit logs
grant select on public.audit_logs to authenticated;
create policy audit_logs_select on public.audit_logs for select to authenticated
  using (
    institution_id = (select app_private.current_institution())
    and (
      (select app_private.is_admin())
      or actor_id = (select auth.uid())
      or (related_workflow_id is not null and exists (select 1 from public.workflow_requests r where r.id = related_workflow_id))
    )
  );

-- ---------------------------------------------------------------- notifications
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
create policy notifications_select on public.notifications for select to authenticated
  using (recipient_id = (select auth.uid()));
create policy notifications_update on public.notifications for update to authenticated
  using (recipient_id = (select auth.uid()))
  with check (recipient_id = (select auth.uid()));

-- ------------------------------------------------------------ syllabus progress
grant select, insert on public.syllabus_progress to authenticated;
grant update (subject, unit, planned_hours, completed_hours, review_status, updated_by) on public.syllabus_progress to authenticated;

create policy syllabus_select on public.syllabus_progress for select to authenticated
  using (
    institution_id = (select app_private.current_institution())
    and (
      (select app_private.is_admin())
      or faculty_id = (select auth.uid())
      or department_id = (select app_private.current_department())
      or (select app_private.has_scoped_role(array['hod', 'coordinator'], department_id))
    )
  );
create policy syllabus_insert on public.syllabus_progress for insert to authenticated
  with check (
    institution_id = (select app_private.current_institution())
    and faculty_id = (select auth.uid())
    and updated_by = (select auth.uid())
    and review_status in ('draft', 'submitted')
    and (
      (select app_private.has_scoped_role(array['principal', 'administrator', 'hod', 'coordinator'], department_id))
      or department_id = (select app_private.current_department())
    )
  );
create policy syllabus_update on public.syllabus_progress for update to authenticated
  using (
    institution_id = (select app_private.current_institution())
    and (
      faculty_id = (select auth.uid())
      or (select app_private.has_scoped_role(array['principal', 'administrator', 'hod', 'coordinator'], department_id))
    )
  )
  with check (
    institution_id = (select app_private.current_institution())
    and updated_by = (select auth.uid())
    and (
      review_status in ('draft', 'submitted')
      or (select app_private.has_scoped_role(array['principal', 'administrator', 'hod', 'coordinator'], department_id))
    )
  );

-- ------------------------------------------------------------ timetable entries
grant select, insert on public.timetable_entries to authenticated;
grant update (subject, cohort, room, day_of_week, starts_at, ends_at, status) on public.timetable_entries to authenticated;

create policy timetable_select on public.timetable_entries for select to authenticated
  using (institution_id = (select app_private.current_institution()));
create policy timetable_insert on public.timetable_entries for insert to authenticated
  with check (
    institution_id = (select app_private.current_institution())
    and created_by = (select auth.uid())
    and (select app_private.has_scoped_role(array['principal', 'administrator', 'coordinator', 'hod'], department_id))
  );
create policy timetable_update on public.timetable_entries for update to authenticated
  using (
    institution_id = (select app_private.current_institution())
    and (select app_private.has_scoped_role(array['principal', 'administrator', 'coordinator', 'hod'], department_id))
  )
  with check (institution_id = (select app_private.current_institution()));

-- --------------------------------------------------------------------- circulars
grant select, insert on public.circulars to authenticated;
grant update (title, content, category, status, publish_at, acknowledge_by) on public.circulars to authenticated;

create policy circulars_select on public.circulars for select to authenticated
  using (
    institution_id = (select app_private.current_institution())
    and (
      (status = 'published' and (publish_at is null or publish_at <= now()))
      or author_id = (select auth.uid())
      or (select app_private.is_admin())
    )
  );
create policy circulars_insert on public.circulars for insert to authenticated
  with check (
    institution_id = (select app_private.current_institution())
    and author_id = (select auth.uid())
    and status in ('draft', 'published')
    and (select app_private.can_publish_circulars())
  );
create policy circulars_update on public.circulars for update to authenticated
  using (
    institution_id = (select app_private.current_institution())
    and (select app_private.can_publish_circulars())
    and (author_id = (select auth.uid()) or (select app_private.is_admin()))
  )
  with check (institution_id = (select app_private.current_institution()));

grant select, insert on public.circular_acknowledgements to authenticated;
create policy circular_ack_select on public.circular_acknowledgements for select to authenticated
  using (user_id = (select auth.uid()) or (select app_private.is_admin()));
create policy circular_ack_insert on public.circular_acknowledgements for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and institution_id = (select app_private.current_institution())
    and exists (select 1 from public.circulars c where c.id = circular_id and c.status = 'published')
  );

-- ---------------------------------------------------------------------- documents
grant select, insert on public.documents to authenticated;
grant update (title, category, status, expires_at, version) on public.documents to authenticated;

create policy documents_select on public.documents for select to authenticated
  using (
    institution_id = (select app_private.current_institution())
    and (
      (select app_private.is_admin())
      or owner_id = (select auth.uid())
      or (department_id is not null and (select app_private.has_scoped_role(array['hod', 'coordinator'], department_id)))
      or (status <> 'draft' and (department_id is null or department_id = (select app_private.current_department())))
    )
  );
create policy documents_insert on public.documents for insert to authenticated
  with check (
    institution_id = (select app_private.current_institution())
    and owner_id = (select auth.uid())
    and status = 'draft'
    and (
      (select app_private.is_admin())
      or (department_id is not null and (select app_private.has_scoped_role(array['coordinator', 'hod'], department_id)))
    )
  );
create policy documents_update on public.documents for update to authenticated
  using (
    institution_id = (select app_private.current_institution())
    and (
      (select app_private.is_admin())
      or owner_id = (select auth.uid())
      or (department_id is not null and (select app_private.has_scoped_role(array['hod', 'coordinator'], department_id)))
    )
  )
  with check (institution_id = (select app_private.current_institution()));
