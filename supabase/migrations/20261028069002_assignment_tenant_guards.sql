-- Enforce tenant scope for user assignments across operational records.
create or replace function app_private.guard_profile_scope()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  profile_id_value uuid;
  profile_institution uuid;
begin
  profile_id_value := nullif(to_jsonb(new) ->> tg_argv[0], '')::uuid;
  if profile_id_value is null then return new; end if;

  select institution_id into profile_institution
  from public.profiles
  where user_id = profile_id_value and status = 'active';

  if profile_institution is null or profile_institution is distinct from new.institution_id then
    raise exception 'Assigned user must have an active profile in the same institution' using errcode = '23514';
  end if;
  return new;
end;
$$;

do $$
declare item text[];
begin
  foreach item slice 1 in array array[
    ['hr_employees','profile_user_id'],
    ['hr_leave_requests','reviewer_id'],
    ['procurement_requests','reviewed_by'],
    ['campus_work_orders','assigned_to'],
    ['campus_assets','created_by'],
    ['transport_vehicles','driver_name'],
    ['placement_drives','created_by'],
    ['research_projects','principal_investigator'],
    ['accreditation_evidence','owner_user_id'],
    ['accreditation_evidence','reviewed_by'],
    ['institution_events','coordinator_id'],
    ['institution_committees','chairperson_id'],
    ['institution_committee_members','user_id'],
    ['institution_clubs','faculty_coordinator_id'],
    ['lab_inventory','assigned_to'],
    ['sports_facilities','supervisor_id'],
    ['visitor_register','host_user_id'],
    ['outcome_attainment_cycles','approved_by'],
    ['examination_timetable','invigilator_id'],
    ['admission_applications','assigned_reviewer'],
    ['finance_budgets','approved_by'],
    ['vendor_registry','reviewed_by'],
    ['expense_claims','reviewed_by']
  ] loop
    execute format('drop trigger if exists %I_profile_scope_guard on public.%I', item[1], item[1]);
    execute format(
      'create trigger %I_profile_scope_guard before insert or update on public.%I for each row execute function app_private.guard_profile_scope(%L)',
      item[1], item[1], item[2]
    );
  end loop;
end $$;

revoke all on function app_private.guard_profile_scope() from public, anon, authenticated;
