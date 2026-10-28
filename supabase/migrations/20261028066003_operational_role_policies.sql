-- Replace broad operational write policies with role-scoped capabilities.
do $$
declare
  r record;
begin
  for r in
    select * from (values
      ('hr_employees', array['principal','administrator','coordinator','hr']::text[], array['principal','administrator','coordinator','hr','hod']::text[]),
      ('hr_leave_requests', array['principal','administrator','coordinator','hr','hod','faculty','staff']::text[], array['principal','administrator','coordinator','hr','hod']::text[]),
      ('procurement_requests', array['principal','administrator','coordinator','hod','staff','finance']::text[], array['principal','administrator','coordinator','hod','finance']::text[]),
      ('library_catalogue_items', array['principal','administrator','coordinator','librarian']::text[], array['principal','administrator','coordinator','librarian']::text[]),
      ('campus_work_orders', array['principal','administrator','coordinator','hod','faculty','staff']::text[], array['principal','administrator','coordinator','hod','staff']::text[]),
      ('campus_assets', array['principal','administrator','coordinator','finance','staff']::text[], array['principal','administrator','coordinator','finance','staff']::text[]),
      ('hostel_rooms', array['principal','administrator','coordinator','staff']::text[], array['principal','administrator','coordinator','staff']::text[]),
      ('transport_vehicles', array['principal','administrator','coordinator','staff']::text[], array['principal','administrator','coordinator','staff']::text[]),
      ('placement_employers', array['principal','administrator','coordinator','placement_officer','hod','faculty']::text[], array['principal','administrator','coordinator','placement_officer']::text[]),
      ('placement_drives', array['principal','administrator','coordinator','placement_officer','hod','faculty']::text[], array['principal','administrator','coordinator','placement_officer']::text[]),
      ('research_projects', array['principal','administrator','coordinator','hod','faculty','iqac_coordinator']::text[], array['principal','administrator','coordinator','hod','faculty','iqac_coordinator']::text[]),
      ('accreditation_evidence', array['principal','administrator','coordinator','hod','faculty','iqac_coordinator']::text[], array['principal','administrator','coordinator','hod','faculty','iqac_coordinator']::text[]),
      ('institution_events', array['principal','administrator','coordinator','hod','faculty','staff']::text[], array['principal','administrator','coordinator','hod','faculty','staff']::text[])
    ) as p(table_name, insert_roles, update_roles)
  loop
    execute format('drop policy if exists %I_institution_insert on public.%I', r.table_name, r.table_name);
    execute format(
      'create policy %I_institution_insert on public.%I for insert to authenticated with check (institution_id = (select app_private.current_institution()) and (select app_private.has_role(%L::text[])))',
      r.table_name, r.table_name, r.insert_roles
    );
    execute format('drop policy if exists %I_institution_update on public.%I', r.table_name, r.table_name);
    execute format(
      'create policy %I_institution_update on public.%I for update to authenticated using (institution_id = (select app_private.current_institution()) and (select app_private.has_role(%L::text[]))) with check (institution_id = (select app_private.current_institution()))',
      r.table_name, r.table_name, r.update_roles
    );
  end loop;
end $$;

-- Leave requests contain personal information; employees can read their own,
-- while HR and institutional leadership can review the institution's queue.
drop policy if exists hr_leave_requests_institution_select on public.hr_leave_requests;
create policy hr_leave_requests_institution_select on public.hr_leave_requests
for select to authenticated
using (
  institution_id = (select app_private.current_institution())
  and (
    created_by = (select auth.uid())
    or (select app_private.has_role(array['principal','administrator','coordinator','hr','hod']))
  )
);

drop policy if exists hr_leave_requests_institution_update on public.hr_leave_requests;
create policy hr_leave_requests_institution_update on public.hr_leave_requests
for update to authenticated
using (
  institution_id = (select app_private.current_institution())
  and (
    (created_by = (select auth.uid()) and status = 'pending')
    or (select app_private.has_role(array['principal','administrator','coordinator','hr','hod']))
  )
)
with check (
  institution_id = (select app_private.current_institution())
  and (
    (created_by = (select auth.uid()) and status in ('pending','cancelled'))
    or (select app_private.has_role(array['principal','administrator','coordinator','hr','hod']))
  )
);
