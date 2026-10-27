-- Enforce marks state transitions in PostgreSQL so direct PostgREST updates
-- cannot bypass the faculty submission and academic review workflow.

create or replace function app_private.enforce_marks_record_transition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_owner boolean;
  v_can_edit boolean;
  v_can_review boolean;
  v_content_changed boolean;
begin
  if tg_op = 'INSERT' then
    if new.institution_id is distinct from (select app_private.current_institution())
      or new.faculty_user_id is distinct from (select auth.uid())
      or new.status <> 'draft'
      or not (select app_private.has_scoped_role(array['faculty','hod'], new.department_id)) then
      raise exception 'Only authorized faculty can create draft marks in their permitted department' using errcode = '42501';
    end if;
    if new.verified_by is not null or new.verified_at is not null then
      raise exception 'New marks cannot include review metadata' using errcode = '42501';
    end if;
    return new;
  end if;

  if new.institution_id is distinct from old.institution_id
    or new.department_id is distinct from old.department_id
    or new.class_id is distinct from old.class_id
    or new.subject_id is distinct from old.subject_id
    or new.student_id is distinct from old.student_id
    or new.faculty_user_id is distinct from old.faculty_user_id then
    raise exception 'Marks ownership and academic scope cannot be changed after creation' using errcode = '42501';
  end if;

  v_is_owner := old.faculty_user_id = (select auth.uid());
  v_can_edit := (select app_private.has_scoped_role(array['faculty','hod'], old.department_id));
  v_can_review := (select app_private.has_scoped_role(array['principal','administrator','hod','coordinator'], old.department_id));
  v_content_changed :=
    new.assessment_name is distinct from old.assessment_name
    or new.max_marks is distinct from old.max_marks
    or new.marks_obtained is distinct from old.marks_obtained;

  if new.status is not distinct from old.status then
    if new.verified_by is distinct from old.verified_by or new.verified_at is distinct from old.verified_at then
      raise exception 'Marks review metadata can only change during a valid status transition' using errcode = '42501';
    end if;
    if v_content_changed and not (old.status in ('draft','returned') and v_is_owner and v_can_edit) then
      raise exception 'Only the faculty owner can edit draft or returned marks' using errcode = '42501';
    end if;
    if new.feedback is distinct from old.feedback
      and not (old.status in ('draft','returned') and v_is_owner and v_can_edit) then
      raise exception 'Review feedback cannot be changed in this state' using errcode = '42501';
    end if;
    if old.status in ('submitted','verified','locked') and v_content_changed then
      raise exception 'Submitted, verified or locked marks cannot be edited' using errcode = '42501';
    end if;
    return new;
  end if;

  if old.status in ('draft','returned') and new.status = 'submitted' then
    if not (v_is_owner and v_can_edit) then
      raise exception 'Only the faculty owner can submit marks for review' using errcode = '42501';
    end if;
    if new.marks_obtained is null then
      raise exception 'Marks must be entered before submission' using errcode = '23514';
    end if;
    new.verified_by := null;
    new.verified_at := null;
    new.feedback := null;
    return new;
  end if;

  if old.status = 'submitted' and new.status in ('returned','verified','locked') then
    if not v_can_review then
      raise exception 'Only authorized academic leadership can review submitted marks' using errcode = '42501';
    end if;
    if new.status = 'returned' then
      if nullif(btrim(new.feedback), '') is null then
        raise exception 'A correction reason is required when returning marks' using errcode = '23514';
      end if;
      new.verified_by := null;
      new.verified_at := null;
    elsif new.status = 'verified' then
      new.verified_by := (select auth.uid());
      new.verified_at := now();
      new.feedback := null;
    else
      new.verified_by := null;
      new.verified_at := null;
    end if;
    return new;
  end if;

  if old.status = 'locked' and new.status = 'draft' then
    if not v_can_review then
      raise exception 'Only authorized academic leadership can unlock marks' using errcode = '42501';
    end if;
    new.verified_by := null;
    new.verified_at := null;
    return new;
  end if;

  raise exception 'Invalid marks status transition: % -> %', old.status, new.status using errcode = '23514';
end;
$$;

drop trigger if exists marks_record_transition_guard on public.marks_records;
create trigger marks_record_transition_guard
before insert or update on public.marks_records
for each row execute function app_private.enforce_marks_record_transition();

revoke all on function app_private.enforce_marks_record_transition() from public, anon, authenticated;
