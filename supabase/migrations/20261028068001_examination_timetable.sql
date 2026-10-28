-- Examination calendar and subject-level timetable for staff-managed exam cell workflows.
create table if not exists public.examination_sessions (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  exam_code text not null,
  name text not null,
  exam_type text not null default 'end_semester' check (exam_type in ('in_semester','end_semester','practical','oral','retest','entrance','other')),
  academic_year text not null,
  term_id uuid references public.academic_terms(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null,
  starts_on date not null,
  ends_on date not null,
  status text not null default 'draft' check (status in ('draft','scheduled','published','in_progress','completed','cancelled')),
  instructions text,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on),
  unique (institution_id, exam_code)
);

create table if not exists public.examination_timetable (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  session_id uuid not null references public.examination_sessions(id) on delete cascade,
  subject_id uuid not null references public.academic_subjects(id) on delete restrict,
  exam_date date not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  venue text not null,
  invigilator_id uuid,
  max_marks numeric(7,2) not null default 100 check (max_marks > 0),
  passing_marks numeric(7,2) not null default 40 check (passing_marks >= 0 and passing_marks <= max_marks),
  status text not null default 'scheduled' check (status in ('draft','scheduled','published','completed','cancelled')),
  instructions text,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  unique (institution_id, session_id, subject_id)
);

create index if not exists examination_sessions_year_idx on public.examination_sessions(institution_id, academic_year, status);
create index if not exists examination_timetable_date_idx on public.examination_timetable(institution_id, exam_date, starts_at, status);
alter table public.examination_timetable
  add constraint examination_timetable_venue_no_overlap
  exclude using gist (
    institution_id with =,
    venue with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status in ('scheduled','published'));
alter table public.examination_timetable
  add constraint examination_timetable_invigilator_no_overlap
  exclude using gist (
    institution_id with =,
    invigilator_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (invigilator_id is not null and status in ('scheduled','published'));

do $$
declare t text;
begin
  foreach t in array array['examination_sessions','examination_timetable'] loop
    execute format('create trigger %I_touch_updated_at before update on public.%I for each row execute function app_private.touch_updated_at()', t, t);
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('create trigger %I_audit after insert or update or delete on public.%I for each row execute function app_private.audit_row_change(%L)', t, t, t);
  end loop;
end $$;

create policy examination_sessions_select on public.examination_sessions for select to authenticated
using (institution_id = (select app_private.current_institution())
  and (select app_private.has_role(array['principal','administrator','coordinator','hod','faculty','staff','exam_cell'])));
create policy examination_sessions_insert on public.examination_sessions for insert to authenticated
with check (institution_id = (select app_private.current_institution())
  and created_by = (select auth.uid())
  and (select app_private.has_role(array['principal','administrator','coordinator','hod','exam_cell'])));
create policy examination_sessions_update on public.examination_sessions for update to authenticated
using (institution_id = (select app_private.current_institution())
  and (select app_private.has_role(array['principal','administrator','coordinator','hod','exam_cell'])))
with check (institution_id = (select app_private.current_institution()));
create policy examination_sessions_delete on public.examination_sessions for delete to authenticated
using (institution_id = (select app_private.current_institution()) and (select app_private.is_admin()));

create policy examination_timetable_select on public.examination_timetable for select to authenticated
using (institution_id = (select app_private.current_institution())
  and (select app_private.has_role(array['principal','administrator','coordinator','hod','faculty','staff','exam_cell'])));
create policy examination_timetable_insert on public.examination_timetable for insert to authenticated
with check (institution_id = (select app_private.current_institution())
  and created_by = (select auth.uid())
  and (select app_private.has_role(array['principal','administrator','coordinator','hod','exam_cell'])));
create policy examination_timetable_update on public.examination_timetable for update to authenticated
using (institution_id = (select app_private.current_institution())
  and (select app_private.has_role(array['principal','administrator','coordinator','hod','exam_cell'])))
with check (institution_id = (select app_private.current_institution()));
create policy examination_timetable_delete on public.examination_timetable for delete to authenticated
using (institution_id = (select app_private.current_institution()) and (select app_private.is_admin()));

create or replace function app_private.guard_examination_tenant()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare parent_institution uuid;
begin
  if tg_table_name = 'examination_sessions' and new.term_id is not null then
    select institution_id into parent_institution from public.academic_terms where id = new.term_id;
    if parent_institution is distinct from new.institution_id then raise exception 'Academic term must belong to this institution' using errcode = '23514'; end if;
  elsif tg_table_name = 'examination_timetable' then
    select institution_id into parent_institution from public.examination_sessions where id = new.session_id;
    if parent_institution is distinct from new.institution_id then raise exception 'Examination session must belong to this institution' using errcode = '23514'; end if;
    select institution_id into parent_institution from public.academic_subjects where id = new.subject_id;
    if parent_institution is distinct from new.institution_id then raise exception 'Subject must belong to this institution' using errcode = '23514'; end if;
  end if;
  return new;
end;
$$;
create trigger examination_sessions_tenant_guard before insert or update on public.examination_sessions
for each row execute function app_private.guard_examination_tenant();
create trigger examination_timetable_tenant_guard before insert or update on public.examination_timetable
for each row execute function app_private.guard_examination_tenant();
revoke all on function app_private.guard_examination_tenant() from public, anon, authenticated;
