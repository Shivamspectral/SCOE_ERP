-- Write append-only, privacy-conscious audit events for important institutional records.
-- Values such as names, emails, phone numbers, marks, notes and document contents are never copied into audit metadata.

create or replace function app_private.write_institutional_audit_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_row jsonb;
  new_row jsonb;
  row_data jsonb;
  inst_id uuid;
  record_id uuid;
  actor uuid;
  workflow_id uuid;
  changed_fields text[] := array[]::text[];
  audit_metadata jsonb := '{}'::jsonb;
  field_name text;
begin
  if tg_op = 'DELETE' then
    old_row := to_jsonb(old);
    row_data := old_row;
    inst_id := nullif(row_data ->> 'institution_id', '')::uuid;
    record_id := coalesce(nullif(row_data ->> 'id', '')::uuid, nullif(row_data ->> 'user_id', '')::uuid);
    actor := auth.uid();
    audit_metadata := jsonb_build_object('deleted', true);
  elsif tg_op = 'INSERT' then
    new_row := to_jsonb(new);
    row_data := new_row;
    inst_id := nullif(row_data ->> 'institution_id', '')::uuid;
    record_id := coalesce(nullif(row_data ->> 'id', '')::uuid, nullif(row_data ->> 'user_id', '')::uuid);
    actor := coalesce(
      auth.uid(),
      nullif(row_data ->> 'created_by', '')::uuid,
      nullif(row_data ->> 'owner_id', '')::uuid,
      nullif(row_data ->> 'author_id', '')::uuid,
      nullif(row_data ->> 'assigned_by', '')::uuid,
      nullif(row_data ->> 'user_id', '')::uuid
    );
    audit_metadata := jsonb_build_object('created', true);
  else
    old_row := to_jsonb(old);
    new_row := to_jsonb(new);
    row_data := new_row;
    if (old_row - 'updated_at') is not distinct from (new_row - 'updated_at') then
      return new;
    end if;
    inst_id := nullif(new_row ->> 'institution_id', '')::uuid;
    record_id := coalesce(nullif(new_row ->> 'id', '')::uuid, nullif(new_row ->> 'user_id', '')::uuid);
    actor := auth.uid();

    for field_name in select jsonb_object_keys(new_row)
    loop
      if field_name not in ('created_at', 'updated_at', 'metadata', 'payload', 'email', 'phone', 'full_name', 'name', 'title', 'description', 'notes', 'content', 'feedback', 'review_note')
        and old_row -> field_name is distinct from new_row -> field_name then
        changed_fields := array_append(changed_fields, field_name);
      end if;
    end loop;

    audit_metadata := jsonb_build_object('changed_fields', to_jsonb(changed_fields));
    foreach field_name in array array['status', 'role', 'department_id', 'category', 'module', 'priority']
    loop
      if old_row ? field_name or new_row ? field_name then
        if old_row -> field_name is distinct from new_row -> field_name then
          audit_metadata := audit_metadata || jsonb_build_object(
            field_name || '_before', old_row -> field_name,
            field_name || '_after', new_row -> field_name
          );
        end if;
      end if;
    end loop;
  end if;

  if inst_id is null or record_id is null then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  if tg_table_name = 'workflow_requests' then
    workflow_id := record_id;
  else
    workflow_id := nullif(row_data ->> 'related_workflow_id', '')::uuid;
  end if;

  insert into public.audit_logs (
    institution_id, actor_id, action, entity_type, entity_id, related_workflow_id, metadata
  ) values (
    inst_id, actor, lower(tg_op), tg_table_name, record_id, workflow_id, audit_metadata
  );

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function app_private.write_institutional_audit_event() from public, anon, authenticated;

drop trigger if exists audit_departments on public.departments;
create trigger audit_departments after insert or update or delete on public.departments
for each row execute function app_private.write_institutional_audit_event();

drop trigger if exists audit_profiles on public.profiles;
create trigger audit_profiles after insert or update or delete on public.profiles
for each row execute function app_private.write_institutional_audit_event();

drop trigger if exists audit_role_assignments on public.role_assignments;
create trigger audit_role_assignments after insert or update or delete on public.role_assignments
for each row execute function app_private.write_institutional_audit_event();

drop trigger if exists audit_academic_students on public.academic_students;
create trigger audit_academic_students after insert or update or delete on public.academic_students
for each row execute function app_private.write_institutional_audit_event();

drop trigger if exists audit_attendance_sessions on public.attendance_sessions;
create trigger audit_attendance_sessions after insert or update or delete on public.attendance_sessions
for each row execute function app_private.write_institutional_audit_event();

drop trigger if exists audit_marks_records on public.marks_records;
create trigger audit_marks_records after insert or update or delete on public.marks_records
for each row execute function app_private.write_institutional_audit_event();

drop trigger if exists audit_workflow_requests on public.workflow_requests;
create trigger audit_workflow_requests after insert or update or delete on public.workflow_requests
for each row execute function app_private.write_institutional_audit_event();

drop trigger if exists audit_circulars on public.circulars;
create trigger audit_circulars after insert or update or delete on public.circulars
for each row execute function app_private.write_institutional_audit_event();

drop trigger if exists audit_documents on public.documents;
create trigger audit_documents after insert or update or delete on public.documents
for each row execute function app_private.write_institutional_audit_event();
