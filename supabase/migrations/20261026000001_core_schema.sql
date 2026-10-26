-- Astra+ Campus: core schema
-- Tables, constraints, indexes and updated_at triggers. Security lives in later migrations.

set search_path = public, extensions;

create extension if not exists btree_gist with schema extensions;

create schema if not exists app_private;
comment on schema app_private is 'Internal helpers. Not exposed through the Supabase Data API.';

-- A time-of-day range used to prevent overlapping timetable slots.
create type app_private.timerange as range (subtype = time);

create or replace function app_private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------- institutions
create table public.institutions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(btrim(name)) between 2 and 160),
  timezone    text not null default 'Asia/Kolkata',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------- departments
create table public.departments (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions (id) on delete cascade,
  code           text not null check (code ~ '^[A-Z0-9-]{2,16}$'),
  name           text not null check (char_length(btrim(name)) between 2 and 120),
  description    text check (description is null or char_length(description) <= 800),
  hod_user_id    uuid,
  status         text not null default 'active' check (status in ('active', 'archived')),
  created_by     uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (institution_id, code)
);
create unique index departments_institution_name_key on public.departments (institution_id, lower(name));
create index departments_hod_idx on public.departments (hod_user_id) where hod_user_id is not null;

-- -------------------------------------------------------------------- profiles
create table public.profiles (
  user_id        uuid primary key references auth.users (id) on delete cascade,
  institution_id uuid not null references public.institutions (id) on delete cascade,
  full_name      text not null check (char_length(btrim(full_name)) between 1 and 120),
  title          text check (title is null or char_length(title) <= 120),
  phone          text check (phone is null or char_length(phone) <= 32),
  department_id  uuid references public.departments (id) on delete set null,
  status         text not null default 'pending' check (status in ('pending', 'active', 'suspended')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index profiles_institution_status_idx on public.profiles (institution_id, status);
create index profiles_department_idx on public.profiles (department_id);
create index profiles_name_idx on public.profiles (institution_id, lower(full_name));

alter table public.departments
  add constraint departments_hod_user_fk
  foreign key (hod_user_id) references public.profiles (user_id) on delete set null;

-- -------------------------------------------------------------- responsibilities
-- Named coordinator duties (Examination Coordinator, IQAC Coordinator, ...).
create table public.responsibilities (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions (id) on delete cascade,
  key            text not null check (key ~ '^[a-z0-9_]{2,48}$'),
  name           text not null check (char_length(btrim(name)) between 2 and 120),
  description    text check (description is null or char_length(description) <= 500),
  created_at     timestamptz not null default now(),
  unique (institution_id, key)
);

-- ------------------------------------------------------------ role_assignments
create table public.role_assignments (
  id                uuid primary key default gen_random_uuid(),
  institution_id    uuid not null references public.institutions (id) on delete cascade,
  user_id           uuid not null references public.profiles (user_id) on delete cascade,
  role              text not null check (role in ('principal', 'administrator', 'coordinator', 'hod', 'faculty', 'staff')),
  department_id     uuid references public.departments (id) on delete cascade,
  responsibility_id uuid references public.responsibilities (id) on delete set null,
  status            text not null default 'active' check (status in ('active', 'revoked')),
  assigned_by       uuid references auth.users (id) on delete set null,
  created_at        timestamptz not null default now(),
  ended_at          timestamptz,
  constraint role_assignments_hod_needs_department check (role <> 'hod' or department_id is not null),
  constraint role_assignments_principal_is_global check (role <> 'principal' or department_id is null)
);
create unique index role_assignments_active_unique on public.role_assignments (
  user_id, role,
  coalesce(department_id, '00000000-0000-0000-0000-000000000000'::uuid),
  coalesce(responsibility_id, '00000000-0000-0000-0000-000000000000'::uuid)
) where status = 'active';
create index role_assignments_user_idx on public.role_assignments (user_id) where status = 'active';
create index role_assignments_role_idx on public.role_assignments (institution_id, role) where status = 'active';

-- ----------------------------------------------------------- workflow requests
create sequence app_private.workflow_key_seq;

create table public.workflow_requests (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions (id) on delete cascade,
  request_key    text not null,
  module         text not null check (module in (
    'task', 'leave', 'department', 'faculty', 'syllabus', 'timetable', 'attendance', 'examination',
    'circular', 'events', 'documents', 'quality', 'policy', 'report', 'other')),
  title          text not null check (char_length(btrim(title)) between 3 and 160),
  description    text check (description is null or char_length(description) <= 4000),
  priority       text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  status         text not null default 'pending' check (status in ('pending', 'approved', 'returned', 'rejected', 'completed', 'cancelled')),
  department_id  uuid references public.departments (id) on delete set null,
  requester_id   uuid references public.profiles (user_id) on delete set null,
  owner_id       uuid references public.profiles (user_id) on delete set null,
  due_at         timestamptz,
  payload        jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  completed_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (institution_id, request_key)
);
create index workflow_requests_inst_created_idx on public.workflow_requests (institution_id, created_at desc);
create index workflow_requests_requester_idx on public.workflow_requests (requester_id);
create index workflow_requests_owner_idx on public.workflow_requests (owner_id);
create index workflow_requests_department_idx on public.workflow_requests (department_id);
create index workflow_requests_status_idx on public.workflow_requests (institution_id, status);

create table public.workflow_steps (
  id             uuid primary key default gen_random_uuid(),
  workflow_id    uuid not null references public.workflow_requests (id) on delete cascade,
  institution_id uuid not null references public.institutions (id) on delete cascade,
  step_order     integer not null check (step_order >= 1),
  label          text not null check (char_length(label) between 1 and 120),
  approver_id    uuid not null references public.profiles (user_id) on delete cascade,
  status         text not null default 'waiting' check (status in ('waiting', 'pending', 'approved', 'returned', 'rejected', 'skipped')),
  comment        text check (comment is null or char_length(comment) <= 1000),
  decided_at     timestamptz,
  created_at     timestamptz not null default now(),
  unique (workflow_id, step_order)
);
create index workflow_steps_approver_pending_idx on public.workflow_steps (approver_id, created_at) where status = 'pending';
create index workflow_steps_workflow_idx on public.workflow_steps (workflow_id);

-- ------------------------------------------------------------------ audit log
create table public.audit_logs (
  id                  uuid primary key default gen_random_uuid(),
  institution_id      uuid not null references public.institutions (id) on delete cascade,
  actor_id            uuid references auth.users (id) on delete set null,
  action              text not null,
  entity_type         text not null,
  entity_id           uuid,
  related_workflow_id uuid references public.workflow_requests (id) on delete set null,
  metadata            jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now()
);
create index audit_logs_inst_created_idx on public.audit_logs (institution_id, created_at desc);
create index audit_logs_actor_idx on public.audit_logs (actor_id);
create index audit_logs_workflow_idx on public.audit_logs (related_workflow_id) where related_workflow_id is not null;

-- -------------------------------------------------------------- notifications
create table public.notifications (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions (id) on delete cascade,
  recipient_id   uuid not null references public.profiles (user_id) on delete cascade,
  title          text not null check (char_length(title) between 1 and 200),
  body           text check (body is null or char_length(body) <= 1000),
  kind           text not null default 'info' check (kind in ('info', 'approval', 'workflow', 'circular', 'access')),
  href           text check (href is null or (href like '/%' and href not like '//%')),
  read_at        timestamptz,
  created_at     timestamptz not null default now()
);
create index notifications_recipient_idx on public.notifications (recipient_id, created_at desc);
create index notifications_unread_idx on public.notifications (recipient_id) where read_at is null;

-- ------------------------------------------------------------ syllabus progress
create table public.syllabus_progress (
  id              uuid primary key default gen_random_uuid(),
  institution_id  uuid not null references public.institutions (id) on delete cascade,
  department_id   uuid not null references public.departments (id) on delete cascade,
  faculty_id      uuid references public.profiles (user_id) on delete set null,
  subject         text not null check (char_length(btrim(subject)) between 2 and 120),
  unit            text not null check (char_length(btrim(unit)) between 2 and 120),
  planned_hours   integer not null default 0 check (planned_hours between 0 and 1000),
  completed_hours integer not null default 0 check (completed_hours >= 0),
  review_status   text not null default 'draft' check (review_status in ('draft', 'submitted', 'reviewed', 'returned')),
  updated_by      uuid references auth.users (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint syllabus_hours_within_plan check (completed_hours <= planned_hours)
);
create unique index syllabus_progress_unique_unit on public.syllabus_progress (
  department_id,
  coalesce(faculty_id, '00000000-0000-0000-0000-000000000000'::uuid),
  lower(subject), lower(unit)
);
create index syllabus_progress_inst_updated_idx on public.syllabus_progress (institution_id, updated_at desc);
create index syllabus_progress_department_idx on public.syllabus_progress (department_id);

-- ---------------------------------------------------------- timetable entries
create table public.timetable_entries (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions (id) on delete cascade,
  department_id  uuid not null references public.departments (id) on delete cascade,
  faculty_id     uuid references public.profiles (user_id) on delete set null,
  subject        text not null check (char_length(btrim(subject)) between 2 and 120),
  cohort         text not null check (char_length(btrim(cohort)) between 1 and 80),
  room           text check (room is null or char_length(room) <= 80),
  day_of_week    smallint not null check (day_of_week between 1 and 7),
  starts_at      time not null,
  ends_at        time not null,
  status         text not null default 'active' check (status in ('active', 'archived')),
  created_by     uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint timetable_time_order check (ends_at > starts_at),
  constraint timetable_room_no_overlap exclude using gist (
    institution_id with =,
    (lower(room)) with =,
    day_of_week with =,
    app_private.timerange(starts_at, ends_at) with &&
  ) where (status = 'active' and room is not null),
  constraint timetable_cohort_no_overlap exclude using gist (
    department_id with =,
    (lower(cohort)) with =,
    day_of_week with =,
    app_private.timerange(starts_at, ends_at) with &&
  ) where (status = 'active')
);
create index timetable_entries_inst_day_idx on public.timetable_entries (institution_id, day_of_week, starts_at) where status = 'active';
create index timetable_entries_department_idx on public.timetable_entries (department_id);

-- ------------------------------------------------------------------ circulars
create table public.circulars (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions (id) on delete cascade,
  author_id      uuid references public.profiles (user_id) on delete set null,
  title          text not null check (char_length(btrim(title)) between 3 and 160),
  content        text not null check (char_length(btrim(content)) between 3 and 10000),
  category       text not null default 'general' check (category in ('general', 'academic', 'operations', 'event', 'urgent')),
  audience       text not null default 'all' check (audience in ('all')),
  status         text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  publish_at     timestamptz,
  acknowledge_by timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index circulars_inst_created_idx on public.circulars (institution_id, created_at desc);
create index circulars_published_idx on public.circulars (institution_id, created_at desc) where status = 'published';

create table public.circular_acknowledgements (
  id              uuid primary key default gen_random_uuid(),
  circular_id     uuid not null references public.circulars (id) on delete cascade,
  institution_id  uuid not null references public.institutions (id) on delete cascade,
  user_id         uuid not null references public.profiles (user_id) on delete cascade,
  acknowledged_at timestamptz not null default now(),
  unique (circular_id, user_id)
);
create index circular_ack_user_idx on public.circular_acknowledgements (user_id);

-- ------------------------------------------------------------------ documents
create table public.documents (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions (id) on delete cascade,
  owner_id       uuid references public.profiles (user_id) on delete set null,
  department_id  uuid references public.departments (id) on delete set null,
  title          text not null check (char_length(btrim(title)) between 2 and 180),
  category       text not null default 'general' check (category in ('general', 'academic', 'policy', 'finance', 'student', 'staff', 'quality')),
  status         text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  version        integer not null default 1 check (version >= 1),
  expires_at     date,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index documents_inst_updated_idx on public.documents (institution_id, updated_at desc);
create index documents_owner_idx on public.documents (owner_id);
create index documents_department_idx on public.documents (department_id);
create index documents_expiry_idx on public.documents (expires_at) where expires_at is not null;

-- ------------------------------------------------------------ updated_at hooks
create trigger set_updated_at before update on public.institutions        for each row execute function app_private.set_updated_at();
create trigger set_updated_at before update on public.departments         for each row execute function app_private.set_updated_at();
create trigger set_updated_at before update on public.profiles            for each row execute function app_private.set_updated_at();
create trigger set_updated_at before update on public.workflow_requests   for each row execute function app_private.set_updated_at();
create trigger set_updated_at before update on public.syllabus_progress   for each row execute function app_private.set_updated_at();
create trigger set_updated_at before update on public.timetable_entries   for each row execute function app_private.set_updated_at();
create trigger set_updated_at before update on public.circulars           for each row execute function app_private.set_updated_at();
create trigger set_updated_at before update on public.documents           for each row execute function app_private.set_updated_at();
