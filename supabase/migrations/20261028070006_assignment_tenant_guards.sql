-- Enforce academic tenant and class consistency even when clients bypass the API controller.
create or replace function app_private.guard_assignment_scope()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  parent_institution uuid;
  parent_department uuid;
  parent_class uuid;
  parent_max_marks numeric;
  parent_status text;
begin
  if tg_table_name = 'assignment_records' then
    select institution_id, department_id into parent_institution, parent_department
    from public.academic_classes where id = new.class_id;
    if new.class_id is not null and (
      parent_institution is distinct from new.institution_id
      or parent_department is distinct from new.department_id
    ) then
      raise exception 'Assignment class must belong to the same institution and department' using errcode = '23514';
    end if;
    if new.subject_id is not null then
      select institution_id, department_id, class_id into parent_institution, parent_department, parent_class
      from public.academic_subjects where id = new.subject_id;
      if parent_institution is distinct from new.institution_id
        or parent_department is distinct from new.department_id
        or (parent_class is not null and parent_class is distinct from new.class_id) then
        raise exception 'Assignment subject must match its institution, department and class' using errcode = '23514';
      end if;
    end if;
  elsif tg_table_name = 'assignment_submissions' then
    select institution_id, department_id, class_id, max_marks, status
      into parent_institution, parent_department, parent_class, parent_max_marks, parent_status
    from public.assignment_records where id = new.assignment_id;
    if parent_institution is null then
      raise exception 'Assignment does not exist' using errcode = '23503';
    end if;
    select institution_id, department_id, class_id into parent_institution, parent_department, parent_class
      from public.academic_students where id = new.student_id;
    if parent_institution is distinct from (
        select institution_id from public.assignment_records where id = new.assignment_id
      )
      or parent_department is distinct from (
        select department_id from public.assignment_records where id = new.assignment_id
      )
      or (select class_id from public.assignment_records where id = new.assignment_id) is distinct from parent_class then
      raise exception 'Assignment submission student must belong to the assignment class and institution' using errcode = '23514';
    end if;
    if new.marks is not null and parent_max_marks is not null and new.marks > parent_max_marks then
      raise exception 'Marks cannot exceed the assignment maximum' using errcode = '23514';
    end if;
    if new.status = 'evaluated' and new.marks is null then
      raise exception 'An evaluated submission must have marks' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create trigger assignment_records_scope_guard
before insert or update on public.assignment_records
for each row execute function app_private.guard_assignment_scope();
create trigger assignment_submissions_scope_guard
before insert or update on public.assignment_submissions
for each row execute function app_private.guard_assignment_scope();

revoke all on function app_private.guard_assignment_scope() from public, anon, authenticated;
