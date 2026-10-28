-- Separate issuance from return permissions: the staff member returning a loan
-- need not be the same person who originally issued it.
drop policy if exists library_loans_write on public.library_loans;
drop policy if exists library_loans_insert on public.library_loans;
drop policy if exists library_loans_update on public.library_loans;

create policy library_loans_insert on public.library_loans for insert to authenticated
with check (
  institution_id = (select app_private.current_institution())
  and issued_by = (select auth.uid())
  and (select app_private.has_role(array['principal','administrator','coordinator']))
  and exists (select 1 from public.library_books b where b.id = book_id and b.institution_id = library_loans.institution_id and b.status = 'active')
  and exists (select 1 from public.academic_students s where s.id = student_id and s.institution_id = library_loans.institution_id and s.status = 'active')
);
create policy library_loans_update on public.library_loans for update to authenticated
using (institution_id = (select app_private.current_institution()) and (select app_private.has_role(array['principal','administrator','coordinator'])))
with check (institution_id = (select app_private.current_institution()) and (select app_private.has_role(array['principal','administrator','coordinator'])));
