-- Admissions office management without applicant/student portal accounts.
create table if not exists public.admission_campaigns (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  campaign_code text not null,
  name text not null,
  academic_year text not null,
  starts_on date not null,
  ends_on date not null,
  status text not null default 'draft' check (status in ('draft','open','closed','archived')),
  notes text,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on),
  unique (institution_id, campaign_code)
);

create table if not exists public.admission_applications (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  application_number text not null,
  campaign_id uuid not null references public.admission_campaigns(id) on delete restrict,
  programme_id uuid not null references public.academic_programmes(id) on delete restrict,
  applicant_name text not null,
  email text,
  phone text,
  date_of_birth date,
  applicant_category text,
  qualifying_exam text,
  qualifying_board text,
  passing_year integer check (passing_year is null or passing_year between 1950 and 2200),
  qualifying_percentage numeric(5,2) check (qualifying_percentage is null or qualifying_percentage between 0 and 100),
  entrance_exam text,
  entrance_score numeric(8,3),
  application_fee_status text not null default 'pending' check (application_fee_status in ('pending','paid','waived','refunded')),
  status text not null default 'submitted' check (status in ('submitted','documents_pending','under_review','shortlisted','offered','accepted','waitlisted','rejected','withdrawn')),
  document_refs jsonb not null default '[]'::jsonb,
  assigned_reviewer uuid,
  reviewed_at timestamptz,
  decision_note text,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, application_number)
);

create index if not exists admission_campaigns_year_idx on public.admission_campaigns(institution_id, academic_year, status);
create index if not exists admission_applications_queue_idx on public.admission_applications(institution_id, campaign_id, status, created_at desc);
create index if not exists admission_applications_programme_idx on public.admission_applications(institution_id, programme_id, status);

do $$
declare t text;
begin
  foreach t in array array['admission_campaigns','admission_applications'] loop
    execute format('create trigger %I_touch_updated_at before update on public.%I for each row execute function app_private.touch_updated_at()', t, t);
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('create trigger %I_audit after insert or update or delete on public.%I for each row execute function app_private.audit_row_change(%L)', t, t, t);
  end loop;
end $$;

create policy admission_campaigns_select on public.admission_campaigns for select to authenticated
using (institution_id = (select app_private.current_institution())
  and (select app_private.has_role(array['principal','administrator','coordinator','staff','hod','admission_officer'])));
create policy admission_campaigns_insert on public.admission_campaigns for insert to authenticated
with check (institution_id = (select app_private.current_institution())
  and (select app_private.has_role(array['principal','administrator','coordinator','staff','admission_officer'])));
create policy admission_campaigns_update on public.admission_campaigns for update to authenticated
using (institution_id = (select app_private.current_institution())
  and (select app_private.has_role(array['principal','administrator','coordinator','staff','admission_officer'])))
with check (institution_id = (select app_private.current_institution()));
create policy admission_campaigns_delete on public.admission_campaigns for delete to authenticated
using (institution_id = (select app_private.current_institution()) and (select app_private.is_admin()));

create policy admission_applications_select on public.admission_applications for select to authenticated
using (institution_id = (select app_private.current_institution())
  and (select app_private.has_role(array['principal','administrator','coordinator','staff','hod','admission_officer'])));
create policy admission_applications_insert on public.admission_applications for insert to authenticated
with check (institution_id = (select app_private.current_institution())
  and created_by = (select auth.uid())
  and (select app_private.has_role(array['principal','administrator','coordinator','staff','admission_officer'])));
create policy admission_applications_update on public.admission_applications for update to authenticated
using (institution_id = (select app_private.current_institution())
  and (select app_private.has_role(array['principal','administrator','coordinator','staff','hod','admission_officer'])))
with check (institution_id = (select app_private.current_institution()));
create policy admission_applications_delete on public.admission_applications for delete to authenticated
using (institution_id = (select app_private.current_institution()) and (select app_private.is_admin()));

create or replace function app_private.guard_admission_tenant()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare parent_institution uuid;
begin
  if tg_table_name = 'admission_applications' then
    select institution_id into parent_institution from public.admission_campaigns where id = new.campaign_id;
    if parent_institution is distinct from new.institution_id then raise exception 'Admission campaign must belong to this institution' using errcode = '23514'; end if;
    select institution_id into parent_institution from public.academic_programmes where id = new.programme_id;
    if parent_institution is distinct from new.institution_id then raise exception 'Programme must belong to this institution' using errcode = '23514'; end if;
  end if;
  return new;
end;
$$;
create trigger admission_applications_tenant_guard before insert or update on public.admission_applications
for each row execute function app_private.guard_admission_tenant();
revoke all on function app_private.guard_admission_tenant() from public, anon, authenticated;
