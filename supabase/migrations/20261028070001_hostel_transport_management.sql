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
-- Preserve pre-existing occupancy counts that do not have individual allocation records yet.
alter table public.hostel_rooms
  add column if not exists untracked_occupied_beds integer not null default 0
  check (untracked_occupied_beds >= 0);
update public.hostel_rooms
set untracked_occupied_beds = occupied_beds
where occupied_beds > 0 and untracked_occupied_beds = 0;

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
declare parent_institution uuid; parent_route uuid;
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
      select institution_id, route_id into parent_institution, parent_route from public.transport_route_stops where id = new.stop_id;
      if parent_institution is distinct from new.institution_id then raise exception 'Route stop must belong to this institution' using errcode = '23514'; end if;
      if parent_route is distinct from new.route_id then raise exception 'Selected stop must belong to the selected route' using errcode = '23514'; end if;
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


-- Keep bed occupancy consistent with active allocations and reject over-capacity assignments.
create or replace function app_private.guard_hostel_capacity()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare room_capacity integer; active_allocations integer;
begin
  if new.status = 'active' then
    select capacity into room_capacity from public.hostel_rooms where id = new.room_id and institution_id = new.institution_id;
    select coalesce(untracked_occupied_beds, 0) into active_allocations
      from public.hostel_rooms where id = new.room_id and institution_id = new.institution_id;
    active_allocations := active_allocations + (select count(*) from public.hostel_allocations
      where room_id = new.room_id and institution_id = new.institution_id
        and status = 'active' and id is distinct from new.id);
    if room_capacity is null or active_allocations >= room_capacity then
      raise exception 'Hostel room has no available beds' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;
create trigger hostel_allocations_capacity_guard before insert or update on public.hostel_allocations
for each row execute function app_private.guard_hostel_capacity();

create or replace function app_private.sync_hostel_occupancy()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare room_to_sync uuid; room_institution uuid; occupied integer; capacity_value integer; room_status text;
begin
  if tg_op = 'DELETE' then
    room_to_sync := old.room_id;
    room_institution := old.institution_id;
  else
    room_to_sync := new.room_id;
    room_institution := new.institution_id;
  end if;
  if tg_op = 'UPDATE' and old.room_id is distinct from new.room_id then
    update public.hostel_rooms
      set occupied_beds = untracked_occupied_beds + (select count(*) from public.hostel_allocations where room_id = old.room_id and institution_id = old.institution_id and status = 'active')
      where id = old.room_id and institution_id = old.institution_id;
  end if;
  select capacity, status into capacity_value, room_status from public.hostel_rooms
    where id = room_to_sync and institution_id = room_institution;
  select untracked_occupied_beds + (select count(*) from public.hostel_allocations
    where room_id = room_to_sync and institution_id = room_institution and status = 'active')
    into occupied from public.hostel_rooms where id = room_to_sync and institution_id = room_institution;
  update public.hostel_rooms
    set occupied_beds = occupied,
        status = case
          when status = 'maintenance' or status = 'inactive' then status
          when occupied >= capacity_value then 'full'
          when status = 'full' and occupied < capacity_value then 'available'
          else status
        end
    where id = room_to_sync and institution_id = room_institution;
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;
create trigger hostel_allocations_sync_occupancy
after insert or update or delete on public.hostel_allocations
for each row execute function app_private.sync_hostel_occupancy();

create or replace function app_private.capture_untracked_hostel_occupancy()
returns trigger language plpgsql security definer set search_path = ''
as $
declare active_count integer;
begin
  if new.occupied_beds is distinct from old.occupied_beds then
    select count(*) into active_count from public.hostel_allocations
      where room_id = new.id and institution_id = new.institution_id and status = 'active';
    if new.occupied_beds < active_count then
      raise exception 'Occupied beds cannot be lower than active bed allocations' using errcode = '23514';
    end if;
    new.untracked_occupied_beds := new.occupied_beds - active_count;
  end if;
  return new;
end;
$;
create trigger hostel_rooms_capture_untracked_occupancy
before update of occupied_beds on public.hostel_rooms
for each row execute function app_private.capture_untracked_hostel_occupancy();

create trigger transport_routes_driver_scope_guard
before insert or update on public.transport_routes
for each row execute function app_private.guard_profile_scope('driver_id');

revoke all on function app_private.guard_hostel_capacity() from public, anon, authenticated;
revoke all on function app_private.sync_hostel_occupancy() from public, anon, authenticated;
revoke all on function app_private.capture_untracked_hostel_occupancy() from public, anon, authenticated;
