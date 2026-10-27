-- Persist an audit trail for staff workspace records (including institutional tasks).
-- The shared trigger writes to the append-only audit log under its SECURITY DEFINER helper.

drop trigger if exists audit_faculty_workspace_records on public.faculty_workspace_records;
create trigger audit_faculty_workspace_records
  after insert or update on public.faculty_workspace_records
  for each row execute function app_private.audit_row_change('faculty_workspace_record');
