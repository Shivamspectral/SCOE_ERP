-- Academic planning and outcome-based education (OBE) foundation.
-- These are staff-managed academic configuration records, not student/parent portals.

create table if not exists public.academic_programmes (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete restrict,
  programme_code text not null,
  name text not null,
  award_level text not null default 'undergraduate' check (award_level in ('certificate','diploma','undergraduate','postgraduate','doctoral')),
  duration_years numeric(3,1) not null default 4 check (duration_years > 0 and duration_years <= 12),
  approved_intake integer not null default 0 check (approved_intake >= 0),
  regulator text,
  accreditation_status text not null default 'not_applicable' check (accreditation_status in ('not_applicable','in_progress','accredited','expired')),
  status text not null default 'active' check (status in ('draft','active','suspended','archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, programme_code),
  unique (institution_id, department_id, name)
);

create table if not exists public.academic_terms (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  academic_year text not null,
  term_code text not null,
  name text not null,
  starts_on date not null,
  ends_on date not null,
  is_current boolean not null default false,
  status text not null default 'planned' check (status in ('planned','active','completed','cancelled')),
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on),
  unique (institution_id, academic_year, term_code)
);
create unique index if not exists academic_terms_one_current_per_institution
  on public.academic_terms(institution_id) where is_current;

create table if not exists public.curriculum_courses (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  programme_id uuid not null references public.academic_programmes(id) on delete restrict,
  subject_id uuid not null references public.academic_subjects(id) on delete restrict,
  term_id uuid references public.academic_terms(id) on delete set null,
  course_type text not null default 'core' check (course_type in ('core','elective','open_elective','audit','project','internship')),
  credits numeric(4,1) not null default 0 check (credits >= 0),
  lecture_hours numeric(4,1) not null default 0 check (lecture_hours >= 0),
  tutorial_hours numeric(4,1) not null default 0 check (tutorial_hours >= 0),
  practical_hours numeric(4,1) not null default 0 check (practical_hours >= 0),
  sequence_no integer not null default 1 check (sequence_no > 0),
  status text not null default 'active' check (status in ('draft','active','archived')),
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, programme_id, subject_id, sequence_no)
);

create table if not exists public.course_outcomes (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  subject_id uuid not null references public.academic_subjects(id) on delete cascade,
  outcome_code text not null,
  description text not null,
  proficiency_target numeric(5,2) not null default 60 check (proficiency_target between 0 and 100),
  status text not null default 'active' check (status in ('draft','active','archived')),
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, subject_id, outcome_code)
);

create table if not exists public.program_outcomes (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  programme_id uuid not null references public.academic_programmes(id) on delete cascade,
  outcome_code text not null,
  description text not null,
  status text not null default 'active' check (status in ('draft','active','archived')),
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, programme_id, outcome_code)
);

create table if not exists public.course_program_outcome_mappings (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  course_outcome_id uuid not null references public.course_outcomes(id) on delete cascade,
  program_outcome_id uuid not null references public.program_outcomes(id) on delete cascade,
  correlation_level smallint not null check (correlation_level between 1 and 3),
  rationale text,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, course_outcome_id, program_outcome_id)
);

create table if not exists public.outcome_attainment_cycles (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  programme_id uuid not null references public.academic_programmes(id) on delete restrict,
  term_id uuid references public.academic_terms(id) on delete set null,
  cycle_label text not null,
  cohort_label text,
  methodology jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','calculating','submitted_for_review','approved','reopened','archived')),
  approved_by uuid,
  approved_at timestamptz,
  review_note text,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, programme_id, cycle_label)
);

create table if not exists public.outcome_attainment_results (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  cycle_id uuid not null references public.outcome_attainment_cycles(id) on delete cascade,
  outcome_type text not null check (outcome_type in ('course','program')),
  outcome_id uuid not null,
  attained_percent numeric(5,2) check (attained_percent is null or attained_percent between 0 and 100),
  target_percent numeric(5,2) check (target_percent is null or target_percent between 0 and 100),
  sample_size integer check (sample_size is null or sample_size >= 0),
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, cycle_id, outcome_type, outcome_id)
);

create index if not exists academic_programmes_department_idx on public.academic_programmes(institution_id, department_id, status);
create index if not exists academic_terms_year_idx on public.academic_terms(institution_id, academic_year, starts_on);
create index if not exists curriculum_courses_programme_idx on public.curriculum_courses(institution_id, programme_id, term_id, status);
create index if not exists course_outcomes_subject_idx on public.course_outcomes(institution_id, subject_id, status);
create index if not exists program_outcomes_programme_idx on public.program_outcomes(institution_id, programme_id, status);
create index if not exists outcome_cycles_programme_idx on public.outcome_attainment_cycles(institution_id, programme_id, status);

do $$
declare t text;
begin
  foreach t in array array[
    'academic_programmes','academic_terms','curriculum_courses','course_outcomes',
    'program_outcomes','course_program_outcome_mappings','outcome_attainment_cycles','outcome_attainment_results'
  ] loop
    execute format('drop trigger if exists %I_touch_updated_at on public.%I', t, t);
    execute format('create trigger %I_touch_updated_at before update on public.%I for each row execute function app_private.touch_updated_at()', t, t);
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('create policy %I on public.%I for select to authenticated using (institution_id = (select app_private.current_institution()))', t || '_institution_select', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (institution_id = (select app_private.current_institution()) and (select app_private.has_role(array[''principal'',''administrator'',''coordinator'',''hod'',''faculty'',''staff'',''exam_cell'',''iqac_coordinator''])))', t || '_institution_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (institution_id = (select app_private.current_institution()) and (select app_private.has_role(array[''principal'',''administrator'',''coordinator'',''hod'',''faculty'',''staff'',''exam_cell'',''iqac_coordinator'']))) with check (institution_id = (select app_private.current_institution()))', t || '_institution_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using (institution_id = (select app_private.current_institution()) and (select app_private.is_admin()))', t || '_institution_delete', t);
    execute format('create trigger %I_audit after insert or update or delete on public.%I for each row execute function app_private.audit_row_change(%L)', t, t, t);
  end loop;
end $$;

-- Keep all academic relationships inside a single institution.
create or replace function app_private.guard_academic_planning_institution()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare parent_institution uuid;
begin
  if tg_table_name = 'academic_programmes' then
    select institution_id into parent_institution from public.departments where id = new.department_id;
    if parent_institution is distinct from new.institution_id then raise exception 'Department must belong to this institution' using errcode = '23514'; end if;
  elsif tg_table_name = 'curriculum_courses' then
    select institution_id into parent_institution from public.academic_programmes where id = new.programme_id;
    if parent_institution is distinct from new.institution_id then raise exception 'Programme must belong to this institution' using errcode = '23514'; end if;
    select institution_id into parent_institution from public.academic_subjects where id = new.subject_id;
    if parent_institution is distinct from new.institution_id then raise exception 'Subject must belong to this institution' using errcode = '23514'; end if;
    if new.term_id is not null then
      select institution_id into parent_institution from public.academic_terms where id = new.term_id;
      if parent_institution is distinct from new.institution_id then raise exception 'Term must belong to this institution' using errcode = '23514'; end if;
    end if;
  elsif tg_table_name = 'course_outcomes' then
    select institution_id into parent_institution from public.academic_subjects where id = new.subject_id;
    if parent_institution is distinct from new.institution_id then raise exception 'Subject must belong to this institution' using errcode = '23514'; end if;
  elsif tg_table_name = 'program_outcomes' then
    select institution_id into parent_institution from public.academic_programmes where id = new.programme_id;
    if parent_institution is distinct from new.institution_id then raise exception 'Programme must belong to this institution' using errcode = '23514'; end if;
  elsif tg_table_name = 'outcome_attainment_cycles' then
    select institution_id into parent_institution from public.academic_programmes where id = new.programme_id;
    if parent_institution is distinct from new.institution_id then raise exception 'Programme must belong to this institution' using errcode = '23514'; end if;
    if new.term_id is not null then
      select institution_id into parent_institution from public.academic_terms where id = new.term_id;
      if parent_institution is distinct from new.institution_id then raise exception 'Term must belong to this institution' using errcode = '23514'; end if;
    end if;
  elsif tg_table_name = 'course_program_outcome_mappings' then
    select institution_id into parent_institution from public.course_outcomes where id = new.course_outcome_id;
    if parent_institution is distinct from new.institution_id then raise exception 'Course outcome must belong to this institution' using errcode = '23514'; end if;
    select institution_id into parent_institution from public.program_outcomes where id = new.program_outcome_id;
    if parent_institution is distinct from new.institution_id then raise exception 'Program outcome must belong to this institution' using errcode = '23514'; end if;
  elsif tg_table_name = 'outcome_attainment_results' then
    select institution_id into parent_institution from public.outcome_attainment_cycles where id = new.cycle_id;
    if parent_institution is distinct from new.institution_id then raise exception 'Attainment cycle must belong to this institution' using errcode = '23514'; end if;
    if new.outcome_type = 'course' then
      select institution_id into parent_institution from public.course_outcomes where id = new.outcome_id;
    else
      select institution_id into parent_institution from public.program_outcomes where id = new.outcome_id;
    end if;
    if parent_institution is distinct from new.institution_id then raise exception 'Outcome must belong to this institution' using errcode = '23514'; end if;
  end if;
  return new;
end;
$$;

create trigger academic_programmes_institution_guard before insert or update on public.academic_programmes for each row execute function app_private.guard_academic_planning_institution();
create trigger curriculum_courses_institution_guard before insert or update on public.curriculum_courses for each row execute function app_private.guard_academic_planning_institution();
create trigger course_outcomes_institution_guard before insert or update on public.course_outcomes for each row execute function app_private.guard_academic_planning_institution();
create trigger program_outcomes_institution_guard before insert or update on public.program_outcomes for each row execute function app_private.guard_academic_planning_institution();
create trigger outcome_attainment_cycles_institution_guard before insert or update on public.outcome_attainment_cycles for each row execute function app_private.guard_academic_planning_institution();
create trigger course_program_outcome_mappings_institution_guard before insert or update on public.course_program_outcome_mappings for each row execute function app_private.guard_academic_planning_institution();
create trigger outcome_attainment_results_institution_guard before insert or update on public.outcome_attainment_results for each row execute function app_private.guard_academic_planning_institution();

revoke all on function app_private.guard_academic_planning_institution() from public, anon, authenticated;


-- Setting a new current term automatically clears the prior current term.
create or replace function app_private.ensure_single_current_academic_term()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.is_current then
    update public.academic_terms
      set is_current = false
      where institution_id = new.institution_id
        and id is distinct from new.id
        and is_current = true;
  end if;
  return new;
end;
$$;
drop trigger if exists academic_terms_current_guard on public.academic_terms;
create trigger academic_terms_current_guard
before insert or update of is_current, institution_id on public.academic_terms
for each row execute function app_private.ensure_single_current_academic_term();
revoke all on function app_private.ensure_single_current_academic_term() from public, anon, authenticated;
