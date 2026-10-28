-- Institutional governance, labs, alumni, sports and campus security records.
-- Additive, institution-scoped tables; no student or parent login accounts are created.

create table if not exists public.institution_committees (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  committee_code text not null,
  name text not null,
  committee_type text not null default 'administrative',
  purpose text,
  chairperson_id uuid,
  department_id uuid references public.departments(id) on delete set null,
  starts_on date,
  ends_on date,
  status text not null default 'active' check (status in ('draft','active','inactive','archived')),
  meeting_frequency text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, committee_code),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create table if not exists public.institution_committee_members (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  committee_id uuid not null references public.institution_committees(id) on delete cascade,
  user_id uuid,
  member_name text not null,
  designation text,
  member_role text not null default 'member',
  appointed_on date,
  ends_on date,
  status text not null default 'active' check (status in ('active','inactive','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on is null or appointed_on is null or ends_on >= appointed_on)
);

create table if not exists public.institution_clubs (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  club_code text not null,
  name text not null,
  category text not null default 'general',
  description text,
  faculty_coordinator_id uuid,
  annual_budget numeric(14,2) not null default 0 check (annual_budget >= 0),
  founded_on date,
  status text not null default 'active' check (status in ('proposed','active','inactive','archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, club_code),
  unique (institution_id, name)
);

create table if not exists public.alumni_records (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  alumni_code text not null,
  full_name text not null,
  graduation_year integer check (graduation_year is null or graduation_year between 1950 and 2200),
  programme text,
  department_id uuid references public.departments(id) on delete set null,
  current_employer text,
  current_designation text,
  work_email text,
  contact_phone text,
  linkedin_url text,
  mentorship_available boolean not null default false,
  donation_total numeric(14,2) not null default 0 check (donation_total >= 0),
  notes text,
  status text not null default 'active' check (status in ('active','inactive','do_not_contact')),
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, alumni_code)
);

create table if not exists public.lab_inventory (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  asset_tag text not null,
  name text not null,
  department_id uuid references public.departments(id) on delete set null,
  laboratory text not null,
  category text not null default 'equipment',
  quantity integer not null default 1 check (quantity > 0),
  condition text not null default 'good' check (condition in ('new','good','fair','poor','unserviceable')),
  calibration_due_on date,
  last_service_on date,
  assigned_to uuid,
  purchase_cost numeric(14,2) check (purchase_cost is null or purchase_cost >= 0),
  status text not null default 'available' check (status in ('available','in_use','maintenance','retired','disposed')),
  notes text,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, asset_tag)
);

create table if not exists public.sports_facilities (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  facility_code text not null,
  name text not null,
  facility_type text not null,
  location text,
  capacity integer check (capacity is null or capacity > 0),
  opening_time time,
  closing_time time,
  supervisor_id uuid,
  status text not null default 'available' check (status in ('available','booked','maintenance','closed')),
  notes text,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, facility_code)
);

create table if not exists public.visitor_register (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  visitor_name text not null,
  organisation text,
  phone text,
  email text,
  purpose text not null,
  host_user_id uuid,
  host_department_id uuid references public.departments(id) on delete set null,
  badge_number text,
  checked_in_at timestamptz not null default now(),
  checked_out_at timestamptz,
  status text not null default 'checked_in' check (status in ('expected','checked_in','checked_out','denied')),
  notes text,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (checked_out_at is null or checked_out_at >= checked_in_at)
);

create index if not exists committees_institution_status_idx on public.institution_committees(institution_id, status, name);
create index if not exists committee_members_committee_idx on public.institution_committee_members(institution_id, committee_id, status);
create index if not exists clubs_institution_status_idx on public.institution_clubs(institution_id, status, name);
create index if not exists alumni_institution_year_idx on public.alumni_records(institution_id, graduation_year desc, full_name);
create index if not exists lab_inventory_location_idx on public.lab_inventory(institution_id, department_id, laboratory, status);
create index if not exists sports_facilities_status_idx on public.sports_facilities(institution_id, status, facility_type);
create index if not exists visitor_register_recent_idx on public.visitor_register(institution_id, checked_in_at desc, status);

do $$
declare t text;
begin
  foreach t in array array[
    'institution_committees','institution_committee_members','institution_clubs',
    'alumni_records','lab_inventory','sports_facilities','visitor_register'
  ] loop
    execute format('drop trigger if exists %I_touch_updated_at on public.%I', t, t);
    execute format('create trigger %I_touch_updated_at before update on public.%I for each row execute function app_private.touch_updated_at()', t, t);
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('drop policy if exists %I on public.%I', t || '_institution_select', t);
    execute format('drop policy if exists %I on public.%I', t || '_institution_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_institution_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_institution_delete', t);
    execute format('create policy %I on public.%I for select to authenticated using (institution_id = (select app_private.current_institution()))', t || '_institution_select', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (institution_id = (select app_private.current_institution()) and (select app_private.has_role(array[''principal'',''administrator'',''coordinator'',''hod'',''faculty'',''staff'',''librarian'',''finance'',''hr'',''placement_officer'',''exam_cell'',''iqac_coordinator''])))', t || '_institution_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (institution_id = (select app_private.current_institution()) and (select app_private.has_role(array[''principal'',''administrator'',''coordinator'',''hod'',''faculty'',''staff'',''librarian'',''finance'',''hr'',''placement_officer'',''exam_cell'',''iqac_coordinator'']))) with check (institution_id = (select app_private.current_institution()))', t || '_institution_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using (institution_id = (select app_private.current_institution()) and (select app_private.is_admin()))', t || '_institution_delete', t);
    execute format('drop trigger if exists %I_audit on public.%I', t, t);
    execute format('create trigger %I_audit after insert or update on public.%I for each row execute function app_private.audit_row_change(%L)', t, t, t);
  end loop;
end $$;


-- Enforce institution consistency for committee rosters.
create or replace function app_private.guard_committee_member_institution()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare committee_institution uuid;
begin
  select c.institution_id into committee_institution
  from public.institution_committees c where c.id = new.committee_id;
  if committee_institution is null or committee_institution <> new.institution_id then
    raise exception 'Committee member and committee must belong to the same institution' using errcode = '23514';
  end if;
  return new;
end;
$$;
drop trigger if exists committee_member_institution_guard on public.institution_committee_members;
create trigger committee_member_institution_guard
before insert or update on public.institution_committee_members
for each row execute function app_private.guard_committee_member_institution();

-- Visitor records are limited to institutional leadership, coordinators and office staff.
drop policy if exists visitor_register_institution_select on public.visitor_register;
drop policy if exists visitor_register_institution_insert on public.visitor_register;
drop policy if exists visitor_register_institution_update on public.visitor_register;
create policy visitor_register_institution_select on public.visitor_register
for select to authenticated
using (institution_id = (select app_private.current_institution())
  and (select app_private.has_role(array['principal','administrator','coordinator','staff'])));
create policy visitor_register_institution_insert on public.visitor_register
for insert to authenticated
with check (institution_id = (select app_private.current_institution())
  and (select app_private.has_role(array['principal','administrator','coordinator','staff'])));
create policy visitor_register_institution_update on public.visitor_register
for update to authenticated
using (institution_id = (select app_private.current_institution())
  and (select app_private.has_role(array['principal','administrator','coordinator','staff'])))
with check (institution_id = (select app_private.current_institution())
  and (select app_private.has_role(array['principal','administrator','coordinator','staff'])));


-- Include deletions in the audit trail for all operational workspaces.
do $$
declare t text;
begin
  foreach t in array array[
    'hr_employees','hr_leave_requests','procurement_requests','library_catalogue_items',
    'campus_work_orders','campus_assets','hostel_rooms','transport_vehicles',
    'placement_employers','placement_drives','research_projects','accreditation_evidence',
    'institution_events','institution_committees','institution_committee_members',
    'institution_clubs','alumni_records','lab_inventory','sports_facilities','visitor_register'
  ] loop
    execute format('drop trigger if exists %I_audit on public.%I', t, t);
    execute format(
      'create trigger %I_audit after insert or update or delete on public.%I for each row execute function app_private.audit_row_change(%L)',
      t, t, t
    );
  end loop;
end $$;
