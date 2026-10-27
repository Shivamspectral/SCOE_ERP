-- Workspace records are versioned resources. A row owner must not be able to
-- repurpose a task into another resource or transfer ownership/scope by PATCHing JSON/API fields.
create or replace function app_private.guard_workspace_record_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id
      or new.institution_id is distinct from old.institution_id
      or new.owner_user_id is distinct from old.owner_user_id
      or new.department_id is distinct from old.department_id
      or new.resource is distinct from old.resource
      or new.created_by is distinct from old.created_by then
      raise exception 'Workspace record identity, owner, and scope are immutable' using errcode = '42501';
    end if;
  else
    if (select auth.uid()) is not null and (
      new.owner_user_id is distinct from (select auth.uid())
      or new.created_by is distinct from (select auth.uid())
      or new.updated_by is distinct from (select auth.uid())
      or new.institution_id is distinct from (select app_private.current_institution())
    ) then
      raise exception 'Workspace records must be created for the authenticated owner in their institution' using errcode = '42501';
    end if;
  end if;

  if (select auth.uid()) is not null and new.updated_by is distinct from (select auth.uid()) then
    raise exception 'Workspace record updates must identify the authenticated actor' using errcode = '42501';
  end if;

  if new.resource = 'tasks' and new.status not in ('draft', 'completed', 'cancelled') then
    raise exception 'Unsupported staff task status' using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists workspace_record_identity_guard on public.faculty_workspace_records;
create trigger workspace_record_identity_guard
  before insert or update on public.faculty_workspace_records
  for each row execute function app_private.guard_workspace_record_identity();

revoke all on function app_private.guard_workspace_record_identity() from public, anon, authenticated;
