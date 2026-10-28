-- Astra+ Campus ERP: operational modules expansion.
-- Additive migration: preserves existing data and uses institution-scoped RLS.
-- This migration creates staff-operated records only; it does not create student/parent accounts.

create table if not exists public.hr_employees (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  profile_user_id uuid,
  employee_code text not null,
  full_name text not null,
  department_id uuid references public.departments(id) on delete set null,
  designation text,
  employment_type text not null default 'full_time' check (employment_type in ('full_time','part_time','contract','visiting','temporary')),
  joining_date date,
  employment_status text not null default 'active' check (employment_status in ('active','on_leave','notice_period','separated')),
  work_email text,
  phone text,
  qualifications jsonb not null default '[]'::jsonb,
  service_metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, employee_code)
);

create table if not exists public.hr_leave_requests (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  employee_id uuid not null references public.hr_employees(id) on delete cascade,
  leave_type text not null,
  starts_on date not null,
  ends_on date not null,
  days numeric(5,2) not null check (days > 0),
  reason text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  reviewer_id uuid,
  reviewed_at timestamptz,
  review_note text,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create table if not exists public.procurement_requests (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  request_number text not null,
  title text not null,
  description text,
  vendor_name text,
  estimated_amount numeric(14,2) not null default 0 check (estimated_amount >= 0),
  currency char(3) not null default 'INR',
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  status text not null default 'draft' check (status in ('draft','submitted','approved','rejected','ordered','received','cancelled')),
  requested_by uuid not null default auth.uid(),
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_note text,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, request_number)
);

create table if not exists public.library_catalogue_items (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  accession_number text not null,
  isbn text,
  title text not null,
  authors text[] not null default '{}',
  publisher text,
  publication_year integer,
  category text,
  shelf_location text,
  total_copies integer not null default 1 check (total_copies >= 0),
  available_copies integer not null default 1 check (available_copies >= 0 and available_copies <= total_copies),
  item_type text not null default 'book' check (item_type in ('book','journal','thesis','media','digital')),
  status text not null default 'active' check (status in ('active','withdrawn','processing')),
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, accession_number)
);

create table if not exists public.campus_work_orders (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  ticket_number text not null,
  category text not null check (category in ('facility','electrical','plumbing','network','lab_equipment','safety','cleaning','other')),
  location text not null,
  title text not null,
  description text,
  priority text not null default 'normal' check (priority in ('low','normal','high','critical')),
  status text not null default 'open' check (status in ('open','assigned','in_progress','blocked','resolved','closed','cancelled')),
  assigned_to uuid,
  reported_by uuid not null default auth.uid(),
  due_at timestamptz,
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, ticket_number)
);

create table if not exists public.campus_assets (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  asset_tag text not null,
  name text not null,
  category text not null,
  department_id uuid references public.departments(id) on delete set null,
  location text,
  serial_number text,
  purchase_date date,
  purchase_cost numeric(14,2) check (purchase_cost is null or purchase_cost >= 0),
  warranty_until date,
  condition text not null default 'good' check (condition in ('new','good','fair','poor','retired')),
  status text not null default 'active' check (status in ('active','under_maintenance','lost','disposed')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, asset_tag)
);

create table if not exists public.hostel_rooms (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  building text not null,
  room_number text not null,
  floor_label text,
  capacity integer not null default 1 check (capacity > 0),
  occupied_beds integer not null default 0 check (occupied_beds >= 0 and occupied_beds <= capacity),
  room_type text not null default 'standard',
  status text not null default 'available' check (status in ('available','full','maintenance','inactive')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, building, room_number)
);

create table if not exists public.transport_vehicles (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  vehicle_code text not null,
  registration_number text not null,
  vehicle_type text not null default 'bus',
  capacity integer not null check (capacity > 0),
  driver_name text,
  driver_phone text,
  permit_expires_on date,
  insurance_expires_on date,
  last_service_on date,
  next_service_on date,
  status text not null default 'active' check (status in ('active','maintenance','retired')),
  route_details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, vehicle_code),
  unique (institution_id, registration_number)
);

create table if not exists public.placement_employers (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name text not null,
  industry text,
  website text,
  contact_name text,
  contact_email text,
  contact_phone text,
  relationship_status text not null default 'prospect' check (relationship_status in ('prospect','active','inactive','blacklisted')),
  notes text,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, name)
);

create table if not exists public.placement_drives (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  employer_id uuid not null references public.placement_employers(id) on delete restrict,
  title text not null,
  job_role text,
  eligible_programmes text[] not null default '{}',
  minimum_cgpa numeric(4,2),
  package_min_lpa numeric(8,2),
  package_max_lpa numeric(8,2),
  drive_date date,
  registration_deadline timestamptz,
  vacancies integer,
  status text not null default 'planned' check (status in ('planned','open','in_progress','completed','cancelled')),
  outcome_summary jsonb not null default '{}'::jsonb,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (minimum_cgpa is null or (minimum_cgpa >= 0 and minimum_cgpa <= 10)),
  check (package_min_lpa is null or package_min_lpa >= 0),
  check (package_max_lpa is null or package_max_lpa >= coalesce(package_min_lpa, 0))
);

create table if not exists public.research_projects (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  project_code text not null,
  title text not null,
  principal_investigator uuid,
  funding_agency text,
  grant_amount numeric(14,2) check (grant_amount is null or grant_amount >= 0),
  currency char(3) not null default 'INR',
  starts_on date,
  ends_on date,
  status text not null default 'proposed' check (status in ('proposed','submitted','active','completed','on_hold','rejected')),
  outputs jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, project_code),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create table if not exists public.accreditation_evidence (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  framework text not null check (framework in ('NAAC','NBA','IQAC','NIRF','AISHE','AICTE','UGC','OTHER')),
  cycle_label text,
  criterion_code text not null,
  title text not null,
  description text,
  owner_department_id uuid references public.departments(id) on delete set null,
  owner_user_id uuid,
  evidence_document_id uuid references public.documents(id) on delete set null,
  reporting_period text,
  status text not null default 'draft' check (status in ('draft','in_progress','submitted_for_review','approved','needs_revision','archived')),
  metrics jsonb not null default '{}'::jsonb,
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_note text,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.institution_events (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  title text not null,
  event_type text not null default 'academic',
  description text,
  venue text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  organizer_department_id uuid references public.departments(id) on delete set null,
  coordinator_id uuid,
  capacity integer check (capacity is null or capacity > 0),
  status text not null default 'planned' check (status in ('draft','planned','published','completed','cancelled')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index if not exists hr_employees_institution_department_idx on public.hr_employees(institution_id, department_id, employment_status);
create index if not exists hr_leave_institution_status_idx on public.hr_leave_requests(institution_id, status, starts_on);
create index if not exists procurement_institution_status_idx on public.procurement_requests(institution_id, status, created_at desc);
create index if not exists library_catalogue_search_idx on public.library_catalogue_items(institution_id, title);
create index if not exists campus_work_orders_queue_idx on public.campus_work_orders(institution_id, status, priority, created_at desc);
create index if not exists campus_assets_department_idx on public.campus_assets(institution_id, department_id, status);
create index if not exists hostel_rooms_availability_idx on public.hostel_rooms(institution_id, status, building);
create index if not exists transport_vehicle_status_idx on public.transport_vehicles(institution_id, status);
create index if not exists placement_drives_date_idx on public.placement_drives(institution_id, drive_date, status);
create index if not exists research_projects_department_idx on public.research_projects(institution_id, department_id, status);
create index if not exists accreditation_evidence_framework_idx on public.accreditation_evidence(institution_id, framework, criterion_code, status);
create index if not exists institution_events_calendar_idx on public.institution_events(institution_id, starts_at, status);

-- Updated timestamps are database-managed, regardless of the calling client.
create or replace function app_private.touch_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin new.updated_at = now(); return new; end; $$;

do $$
declare t text;
begin
  foreach t in array array[
    'hr_employees','hr_leave_requests','procurement_requests','library_catalogue_items',
    'campus_work_orders','campus_assets','hostel_rooms','transport_vehicles',
    'placement_employers','placement_drives','research_projects','accreditation_evidence','institution_events'
  ] loop
    execute format('drop trigger if exists %I_touch_updated_at on public.%I', t, t);
    execute format('create trigger %I_touch_updated_at before update on public.%I for each row execute function app_private.touch_updated_at()', t, t);
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select on public.%I to authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (institution_id = (select app_private.current_institution()))',
      t || '_institution_select', t
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (institution_id = (select app_private.current_institution()) and (select app_private.has_role(array[''principal'',''administrator'',''coordinator'',''hod'',''faculty'',''staff'',''librarian'',''finance'',''hr'',''placement_officer'',''exam_cell'',''iqac_coordinator''])))',
      t || '_institution_insert', t
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (institution_id = (select app_private.current_institution()) and (select app_private.has_role(array[''principal'',''administrator'',''coordinator'',''hod'',''faculty'',''staff'',''librarian'',''finance'',''hr'',''placement_officer'',''exam_cell'',''iqac_coordinator'']))) with check (institution_id = (select app_private.current_institution()))',
      t || '_institution_update', t
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (institution_id = (select app_private.current_institution()) and (select app_private.is_admin()))',
      t || '_institution_delete', t
    );
    execute format('drop trigger if exists %I_audit on public.%I', t, t);
    execute format('create trigger %I_audit after insert or update on public.%I for each row execute function app_private.audit_row_change(%L)', t, t, t);
  end loop;
end $$;

-- Staff leave records must never cross institutions, even if a malformed FK is supplied.
create or replace function app_private.guard_hr_leave_institution()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare employee_institution uuid;
begin
  select e.institution_id into employee_institution from public.hr_employees e where e.id = new.employee_id;
  if employee_institution is null or employee_institution <> new.institution_id then
    raise exception 'Employee must belong to the same institution' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger hr_leave_institution_guard before insert or update on public.hr_leave_requests
for each row execute function app_private.guard_hr_leave_institution();

create or replace function app_private.guard_placement_drive_institution()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare employer_institution uuid;
begin
  select e.institution_id into employer_institution from public.placement_employers e where e.id = new.employer_id;
  if employer_institution is null or employer_institution <> new.institution_id then
    raise exception 'Employer must belong to the same institution' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger placement_drive_institution_guard before insert or update on public.placement_drives
for each row execute function app_private.guard_placement_drive_institution();

grant execute on function app_private.touch_updated_at() to authenticated;
