-- Restrict invoice writes to inserts and ensure all references stay in the same institution.
drop policy if exists fee_invoices_write on public.fee_invoices;
create policy fee_invoices_insert on public.fee_invoices for insert to authenticated
with check (
  institution_id = (select app_private.current_institution())
  and created_by = (select auth.uid())
  and (select app_private.has_role(array['principal','administrator','coordinator']))
  and exists (select 1 from public.academic_students s where s.id = student_id and s.institution_id = fee_invoices.institution_id and s.status = 'active')
  and (fee_structure_id is null or exists (select 1 from public.fee_structures fs where fs.id = fee_structure_id and fs.institution_id = fee_invoices.institution_id and fs.status = 'active'))
);
revoke update, delete on public.fee_invoices from authenticated;
drop policy if exists fee_structures_write on public.fee_structures;
create policy fee_structures_insert on public.fee_structures for insert to authenticated
with check (
  institution_id = (select app_private.current_institution())
  and created_by = (select auth.uid())
  and (select app_private.has_role(array['principal','administrator','coordinator']))
  and (department_id is null or exists (select 1 from public.departments d where d.id = department_id and d.institution_id = fee_structures.institution_id and d.status = 'active'))
);
create policy fee_structures_update on public.fee_structures for update to authenticated
using (institution_id = (select app_private.current_institution()) and (select app_private.has_role(array['principal','administrator','coordinator'])))
with check (
  institution_id = (select app_private.current_institution())
  and (select app_private.has_role(array['principal','administrator','coordinator']))
  and (department_id is null or exists (select 1 from public.departments d where d.id = department_id and d.institution_id = fee_structures.institution_id and d.status = 'active'))
);
