-- Astra+ Campus: access helpers, notification + audit plumbing.
-- All helpers are SECURITY DEFINER with an empty search_path so they can be used inside RLS policies
-- without recursion and without being hijacked through search_path.

-- ------------------------------------------------------------------ identity
create or replace function app_private.current_institution()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select p.institution_id
  from public.profiles p
  where p.user_id = (select auth.uid()) and p.status = 'active'
$$;

create or replace function app_private.current_department()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select p.department_id
  from public.profiles p
  where p.user_id = (select auth.uid()) and p.status = 'active'
$$;

-- True when the caller holds any of the roles, regardless of department scope.
create or replace function app_private.has_role(p_roles text[])
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.role_assignments ra
    join public.profiles p on p.user_id = ra.user_id and p.status = 'active'
    where ra.user_id = (select auth.uid())
      and ra.status = 'active'
      and ra.role = any (p_roles)
  )
$$;

-- True when the caller holds one of the roles campus-wide, or for the given department.
create or replace function app_private.has_scoped_role(p_roles text[], p_department uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.role_assignments ra
    join public.profiles p on p.user_id = ra.user_id and p.status = 'active'
    where ra.user_id = (select auth.uid())
      and ra.status = 'active'
      and ra.role = any (p_roles)
      and (ra.department_id is null or ra.department_id = p_department)
  )
$$;

create or replace function app_private.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select app_private.has_role(array['principal', 'administrator'])
$$;

create or replace function app_private.can_publish_circulars()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.role_assignments ra
    join public.profiles p on p.user_id = ra.user_id and p.status = 'active'
    where ra.user_id = (select auth.uid())
      and ra.status = 'active'
      and (ra.role in ('principal', 'administrator') or (ra.role = 'coordinator' and ra.department_id is null))
  )
$$;

-- True when the caller is an approver on any step of the workflow (bypasses RLS on steps).
create or replace function app_private.is_workflow_approver(p_workflow uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.workflow_steps s
    where s.workflow_id = p_workflow and s.approver_id = (select auth.uid())
  )
$$;

-- --------------------------------------------------------- notifications + audit
create or replace function app_private.notify(
  p_institution uuid, p_recipient uuid, p_title text, p_body text, p_kind text, p_href text
) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if p_recipient is null then return; end if;
  insert into public.notifications (institution_id, recipient_id, title, body, kind, href)
  values (p_institution, p_recipient, left(p_title, 200), left(p_body, 1000), p_kind, p_href);
end;
$$;

create or replace function app_private.log_audit(
  p_institution uuid, p_action text, p_entity_type text, p_entity_id uuid,
  p_workflow uuid default null, p_metadata jsonb default '{}'::jsonb
) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.audit_logs (institution_id, actor_id, action, entity_type, entity_id, related_workflow_id, metadata)
  values (p_institution, (select auth.uid()), p_action, p_entity_type, p_entity_id, p_workflow, coalesce(p_metadata, '{}'::jsonb));
end;
$$;

-- Generic row-level audit trigger. Usage: execute function app_private.audit_row_change('department')
create or replace function app_private.audit_row_change()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_entity text := tg_argv[0];
  v_verb   text := case tg_op when 'INSERT' then 'created' else 'updated' end;
begin
  perform app_private.log_audit(new.institution_id, v_entity || '_' || v_verb, v_entity, new.id);
  return new;
end;
$$;

-- The audit trail is append-only, even for privileged database roles.
create or replace function app_private.block_audit_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'audit_logs is append-only' using errcode = '42501';
end;
$$;

create trigger audit_logs_append_only
  before update or delete on public.audit_logs
  for each row execute function app_private.block_audit_mutation();

create trigger audit_departments        after insert or update on public.departments        for each row execute function app_private.audit_row_change('department');
create trigger audit_circulars          after insert or update on public.circulars          for each row execute function app_private.audit_row_change('circular');
create trigger audit_documents          after insert or update on public.documents          for each row execute function app_private.audit_row_change('document');
create trigger audit_syllabus_progress  after insert or update on public.syllabus_progress  for each row execute function app_private.audit_row_change('syllabus_progress');
create trigger audit_timetable_entries  after insert or update on public.timetable_entries  for each row execute function app_private.audit_row_change('timetable_entry');

-- ------------------------------------------------------------ circular publishing
create or replace function app_private.circular_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and new.publish_at is null then
    new.publish_at = now();
  end if;
  return new;
end;
$$;

create or replace function app_private.circular_notify_published()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    insert into public.notifications (institution_id, recipient_id, title, body, kind, href)
    select new.institution_id, p.user_id, left('New circular: ' || new.title, 200), null, 'circular', '/circulars'
    from public.profiles p
    where p.institution_id = new.institution_id
      and p.status = 'active'
      and p.user_id is distinct from new.author_id;
  end if;
  return new;
end;
$$;

create trigger circular_before_write before insert or update on public.circulars
  for each row execute function app_private.circular_before_write();
create trigger circular_notify_published after insert or update of status on public.circulars
  for each row execute function app_private.circular_notify_published();

-- ------------------------------------------------------------ responsibilities seed
create or replace function app_private.seed_responsibilities(p_institution uuid)
returns void
language sql security definer set search_path = ''
as $$
  insert into public.responsibilities (institution_id, key, name)
  select p_institution, v.key, v.name
  from (values
    ('examination',      'Examination Coordinator'),
    ('iqac',             'IQAC Coordinator'),
    ('academic',         'Academic Coordinator'),
    ('research',         'Research Coordinator'),
    ('avishkar',         'Avishkar Coordinator'),
    ('training_placement','Training & Placement Coordinator'),
    ('nss',              'NSS Coordinator'),
    ('sports',           'Sports Coordinator'),
    ('cultural',         'Cultural Coordinator'),
    ('internship',       'Internship Coordinator'),
    ('industrial_visit', 'Industrial Visit Coordinator'),
    ('timetable',        'Timetable Coordinator'),
    ('library',          'Library Coordinator')
  ) as v(key, name)
  on conflict (institution_id, key) do nothing
$$;
