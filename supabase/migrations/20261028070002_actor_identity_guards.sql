-- Make actor identity immutable on insert and immutable thereafter; update actor columns must match auth.uid().
create or replace function app_private.guard_actor_identity()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  new_data jsonb := to_jsonb(new);
  old_data jsonb;
  actor_id uuid;
  column_name text := tg_argv[0];
  mutable_actor boolean := coalesce(tg_argv[1], '') = 'mutable';
begin
  if tg_op = 'UPDATE' then old_data := to_jsonb(old); end if;
  actor_id := nullif(new_data ->> column_name, '')::uuid;

  if mutable_actor then
    if tg_op = 'UPDATE' and actor_id is distinct from (select auth.uid()) then
      raise exception 'Updated-by identity must match the authenticated actor' using errcode = '42501';
    elsif tg_op = 'INSERT' and actor_id is not null and actor_id is distinct from (select auth.uid()) then
      raise exception 'Actor identity must match the authenticated user' using errcode = '42501';
    end if;
  else
    if tg_op = 'INSERT' and (select auth.uid()) is not null and actor_id is distinct from (select auth.uid()) then
      raise exception 'Creator identity must match the authenticated user' using errcode = '42501';
    elsif tg_op = 'UPDATE' and (new_data ->> column_name) is distinct from (old_data ->> column_name) then
      raise exception 'Creator identity is immutable' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

do $$
declare item text[];
begin
  foreach item slice 1 in array array[
    ['hr_employees','created_by'],
    ['hr_leave_requests','created_by'],
    ['procurement_requests','requested_by'],
    ['campus_work_orders','reported_by'],
    ['library_catalogue_items','created_by'],
    ['campus_assets','created_by'],
    ['placement_employers','created_by'],
    ['placement_drives','created_by'],
    ['research_projects','created_by'],
    ['accreditation_evidence','created_by'],
    ['institution_events','created_by'],
    ['institution_committees','created_by'],
    ['institution_clubs','created_by'],
    ['alumni_records','created_by'],
    ['lab_inventory','created_by'],
    ['sports_facilities','created_by'],
    ['visitor_register','created_by'],
    ['academic_programmes','created_by'],
    ['academic_terms','created_by'],
    ['curriculum_courses','created_by'],
    ['course_outcomes','created_by'],
    ['program_outcomes','created_by'],
    ['course_program_outcome_mappings','created_by'],
    ['outcome_attainment_cycles','created_by'],
    ['admission_campaigns','created_by'],
    ['admission_applications','created_by'],
    ['examination_sessions','created_by'],
    ['examination_timetable','created_by'],
    ['transport_routes','created_by'],
    ['finance_budgets','created_by'],
    ['vendor_registry','created_by'],
    ['staff_grievances','created_by'],
    ['expense_claims','submitted_by'],
    ['hostel_allocations','allocated_by'],
    ['student_transport_assignments','allocated_by']
  ] loop
    execute format('drop trigger if exists %I_actor_identity_guard on public.%I', item[1], item[1]);
    execute format(
      'create trigger %I_actor_identity_guard before insert or update on public.%I for each row execute function app_private.guard_actor_identity(%L)',
      item[1], item[1], item[2]
    );
  end loop;
end $$;

create trigger institution_settings_created_by_guard
before insert or update on public.institution_settings
for each row execute function app_private.guard_actor_identity('created_by');

drop trigger if exists institution_settings_actor_identity_guard on public.institution_settings;
create trigger institution_settings_actor_identity_guard
before insert or update on public.institution_settings
for each row execute function app_private.guard_actor_identity('updated_by','mutable');

revoke all on function app_private.guard_actor_identity() from public, anon, authenticated;
