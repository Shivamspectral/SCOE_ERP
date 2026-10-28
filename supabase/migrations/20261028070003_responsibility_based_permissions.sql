-- Responsibility assignments extend the canonical six account roles without creating extra login roles.
-- This lets a staff account hold operational duties such as HR, finance, exam cell or library.

insert into public.responsibilities (institution_id, key, name)
select i.id, v.key, v.name
from public.institutions i
cross join (values
  ('human_resources','Human Resources'),
  ('finance','Finance & Accounts'),
  ('procurement','Procurement Officer'),
  ('librarian','Library Management'),
  ('placement_officer','Training & Placement'),
  ('iqac_coordinator','IQAC Coordinator'),
  ('exam_cell','Examination Cell'),
  ('admission_officer','Admissions Office'),
  ('facilities','Facilities & Maintenance'),
  ('hostel','Hostel Administration'),
  ('transport','Transport Administration'),
  ('campus_security','Campus Security'),
  ('alumni','Alumni Relations'),
  ('laboratory','Laboratory Administration'),
  ('quality_assurance','Quality Assurance')
) as v(key, name)
on conflict (institution_id, key) do nothing;

create or replace function app_private.seed_responsibilities(p_institution uuid)
returns void
language sql security definer set search_path = ''
as $
  insert into public.responsibilities (institution_id, key, name)
  select p_institution, v.key, v.name
  from (values
    ('examination', 'Examination Coordinator'),
    ('iqac', 'IQAC Coordinator'),
    ('academic', 'Academic Coordinator'),
    ('research', 'Research Coordinator'),
    ('avishkar', 'Avishkar Coordinator'),
    ('training_placement', 'Training & Placement Coordinator'),
    ('nss', 'NSS Coordinator'),
    ('sports', 'Sports Coordinator'),
    ('cultural', 'Cultural Coordinator'),
    ('internship', 'Internship Coordinator'),
    ('industrial_visit', 'Industrial Visit Coordinator'),
    ('timetable', 'Timetable Coordinator'),
    ('library', 'Library Coordinator'),
    ('human_resources', 'Human Resources'),
    ('finance', 'Finance & Accounts'),
    ('procurement', 'Procurement Officer'),
    ('librarian', 'Library Management'),
    ('placement_officer', 'Training & Placement'),
    ('iqac_coordinator', 'IQAC Coordinator'),
    ('exam_cell', 'Examination Cell'),
    ('admission_officer', 'Admissions Office'),
    ('facilities', 'Facilities & Maintenance'),
    ('hostel', 'Hostel Administration'),
    ('transport', 'Transport Administration'),
    ('campus_security', 'Campus Security'),
    ('alumni', 'Alumni Relations'),
    ('laboratory', 'Laboratory Administration'),
    ('quality_assurance', 'Quality Assurance')
  ) as v(key, name)
  on conflict (institution_id, key) do nothing
$;

create or replace function app_private.has_role(p_roles text[])
returns boolean
language sql stable security definer set search_path = ''
as $$
  select
    exists (
      select 1
      from public.role_assignments ra
      join public.profiles p on p.user_id = ra.user_id and p.status = 'active'
      where ra.user_id = (select auth.uid())
        and ra.status = 'active'
        and ra.role = any (p_roles)
    )
    or exists (
      select 1
      from public.role_assignments ra
      join public.profiles p on p.user_id = ra.user_id and p.status = 'active'
      join public.responsibilities r on r.id = ra.responsibility_id and r.institution_id = ra.institution_id
      where ra.user_id = (select auth.uid())
        and ra.status = 'active'
        and ra.institution_id = (select app_private.current_institution())
        and (
          r.key = any (p_roles)
          or (r.key = 'examination' and 'exam_cell' = any (p_roles))
          or (r.key = 'iqac' and 'iqac_coordinator' = any (p_roles))
          or (r.key = 'training_placement' and 'placement_officer' = any (p_roles))
          or (r.key = 'library' and 'librarian' = any (p_roles))
          or (r.key = 'human_resources' and 'hr' = any (p_roles))
        )
    )
$$;

create or replace function app_private.has_scoped_role(p_roles text[], p_department uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select
    exists (
      select 1
      from public.role_assignments ra
      join public.profiles p on p.user_id = ra.user_id and p.status = 'active'
      where ra.user_id = (select auth.uid())
        and ra.status = 'active'
        and ra.role = any (p_roles)
        and (ra.department_id is null or ra.department_id = p_department)
    )
    or exists (
      select 1
      from public.role_assignments ra
      join public.profiles p on p.user_id = ra.user_id and p.status = 'active'
      join public.responsibilities r on r.id = ra.responsibility_id and r.institution_id = ra.institution_id
      where ra.user_id = (select auth.uid())
        and ra.status = 'active'
        and ra.institution_id = (select app_private.current_institution())
        and (ra.department_id is null or ra.department_id = p_department)
        and (
          r.key = any (p_roles)
          or (r.key = 'examination' and 'exam_cell' = any (p_roles))
          or (r.key = 'iqac' and 'iqac_coordinator' = any (p_roles))
          or (r.key = 'training_placement' and 'placement_officer' = any (p_roles))
          or (r.key = 'library' and 'librarian' = any (p_roles))
          or (r.key = 'human_resources' and 'hr' = any (p_roles))
        )
    )
$$;
