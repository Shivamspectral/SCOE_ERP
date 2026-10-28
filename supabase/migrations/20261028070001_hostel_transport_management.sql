-- Hostel bed allocations and transport route planning.
create table if not exists public.hostel_allocations (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  student_id uuid not null references public.academic_students(id) on delete restrict,
  room_id uuid not null references public.hostel_rooms(id) on delete restrict,
  bed_label text not null,
  starts_on date not null,
  ends_on date,
  status text not null default 'active' check (status in ('active','checked_out','cancelled')),
  allocated_by uuid not null default auth.uid(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on is null or ends_on >= starts_on)
);
create unique index if not exists hostel_allocations_active_bed_key
  on public.hostel_allocations(institution_id, room_id, bed_label) where status = 'active';
create index if not exists hostel_allocations_student_idx on public.hostel_allocations(institution_id, student_id, status);

create table if not exists public.transport_routes (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  route_code text not null,
  name text not null,
  direction text not null default 'both' check (direction in ('pickup','dropoff','both')),
  start_point text not null,
  end_point text not null,
  assigned_vehicle_id uuid references public.transport_vehicles(id) on delete set null,
  driver_id uuid,
  departure_time time,
  return_time time,
  status text not null default 'planned' check (status in ('planned','active','suspended','retired')),
  notes text,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, route_code)
);

create table if not exists public.transport_route_stops (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  route_id uuid not null references public.transport_routes(id) on delete cascade,
  stop_order integer not null check (stop_order > 0),
  stop_name text not null,
  pickup_time time,
  drop_time time,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, route_id, stop_order),
  unique (institution_id, route_id, stop_name)
);

create table if not exists public.student_transport_assignments (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  student_id uuid not null references public.academic_students(id) on delete restrict,
  route_id uuid not null references public.transport_routes(id) on delete restrict,
  stop_id uuid references public.transport_route_stops(id) on delete set null,
  starts_on date not null,
  ends_on date,
  status text not null default 'active' check (status in ('active','completed','cancelled')),
  allocated_by uuid not null default auth.uid(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on is null or ends_on >= starts_on)
);
create unique index if not exists student_transport_one_active_route
  on public.student_transport_assignments(institution_id, student_id) where status = 'active';

do $$
declare t text;
begin
  foreach t in array array['hostel_allocations','transport_routes','transport_route_stops','student_transport_assignments'] loop
    execute format('create trigger %I_touch_updated_at before update on public.%I for each row execute function app_private.touch_updated_at()', t, t);
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('create trigger %I_audit after insert or update or delete on public.%I for each row execute function app_private.audit_row_change(%L)', t, t, t);
    execute format('create policy %I_select on public.%I for select to authenticated using (institution_id = (select app_private.current_institution()) and (select app_private.has_role(array[''principal'',''administrator'',''coordinator'',''hod'',''staff'',''faculty''])))', t || '_institution', t);
    execute format('create policy %I_insert on public.%I for insert to authenticated with check (institution_id = (select app_private.current_institution()) and (select app_private.has_role(array[''principal'',''administrator'',''coordinator'',''staff'',''faculty''])))', t || '_institution', t);
    execute format('create policy %I_update on public.%I for update to authenticated using (institution_id = (select app_private.current_institution()) and (select app_private.has_role(array[''principal'',''administrator'',''coordinator'',''staff'']))) with check (institution_id = (select app_private.current_institution()))', t || '_institution', t);
    execute format('create policy %I_delete on public.%I for delete to authenticated using (institution_id = (select app_private.current_institution()) and (select app_private.is_admin()))', t || '_institution', t);
  end loop;
end $$;

create or replace function app_private.guard_hostel_transport_tenant()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare parent_institution uuid;
begin
  if tg_table_name = 'hostel_allocations' then
    select institution_id into parent_institution from public.academic_students where id = new.student_id;
    if parent_institution is distinct from new.institution_id then raise exception 'Student record must belong to this institution' using errcode = '23514'; end if;
    select institution_id into parent_institution from public.hostel_rooms where id = new.room_id;
    if parent_institution is distinct from new.institution_id then raise exception 'Hostel room must belong to this institution' using errcode = '23514'; end if;
  elsif tg_table_name = 'transport_routes' then
    if new.assigned_vehicle_id is not null then
      select institution_id into parent_institution from public.transport_vehicles where id = new.assigned_vehicle_id;
      if parent_institution is distinct from new.institution_id then raise exception 'Vehicle must belong to this institution' using errcode = '23514'; end if;
    end if;
  elsif tg_table_name = 'transport_route_stops' then
    select institution_id into parent_institution from public.transport_routes where id = new.route_id;
    if parent_institution is distinct from new.institution_id then raise exception 'Route must belong to this institution' using errcode = '23514'; end if;
  elsif tg_table_name = 'student_transport_assignments' then
    select institution_id into parent_institution from public.academic_students where id = new.student_id;
    if parent_institution is distinct from new.institution_id then raise exception 'Student record must belong to this institution' using errcode = '23514'; end if;
    select institution_id into parent_institution from public.transport_routes where id = new.route_id;
    if parent_institution is distinct from new.institution_id then raise exception 'Route must belong to this institution' using errcode = '23514'; end if;
    if new.stop_id is not null then
      select institution_id into parent_institution from public.transport_route_stops where id = new.stop_id;
      if parent_institution is distinct from new.institution_id then raise exception 'Route stop must belong to this institution' using errcode = '23514'; end if;
    end if;
  end if;
  return new;
end;
$$;
create trigger hostel_allocations_tenant_guard before insert or update on public.hostel_allocations for each row execute function app_private.guard_hostel_transport_tenant();
create trigger transport_routes_tenant_guard before insert or update on public.transport_routes for each row execute function app_private.guard_hostel_transport_tenant();
create trigger transport_route_stops_tenant_guard before insert or update on public.transport_route_stops for each row execute function app_private.guard_hostel_transport_tenant();
create trigger student_transport_assignments_tenant_guard before insert or update on public.student_transport_assignments for each row execute function app_private.guard_hostel_transport_tenant();
revoke all on function app_private.guard_hostel_transport_tenant() from public, anon, authenticated;
