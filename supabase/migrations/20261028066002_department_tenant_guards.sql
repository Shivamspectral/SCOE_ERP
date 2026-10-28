-- Ensure department references on operational records cannot cross tenant boundaries.
create or replace function app_private.guard_department_scope()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  department_id_value uuid;
  department_institution uuid;
begin
  department_id_value := nullif(to_jsonb(new) ->> tg_argv[0], '')::uuid;
  if department_id_value is null then return new; end if;

  select institution_id into department_institution
  from public.departments where id = department_id_value;

  if department_institution is null or department_institution is distinct from new.institution_id then
    raise exception 'Department reference must belong to the same institution' using errcode = '23514';
  end if;
  return new;
end;
$$;

do $$
declare item text[];
begin
  foreach item slice 1 in array array[
    ['hr_employees','department_id'],
    ['procurement_requests','department_id'],
    ['campus_assets','department_id'],
    ['research_projects','department_id'],
    ['accreditation_evidence','owner_department_id'],
    ['institution_events','organizer_department_id'],
    ['institution_committees','department_id'],
    ['alumni_records','department_id'],
    ['lab_inventory','department_id'],
    ['visitor_register','host_department_id'],
    ['academic_programmes','department_id'],
    ['finance_budgets','department_id']
  ] loop
    execute format('drop trigger if exists %I_department_scope_guard on public.%I', item[1], item[1]);
    execute format(
      'create trigger %I_department_scope_guard before insert or update on public.%I for each row execute function app_private.guard_department_scope(%L)',
      item[1], item[1], item[2]
    );
  end loop;
end $$;

revoke all on function app_private.guard_department_scope() from public, anon, authenticated;
