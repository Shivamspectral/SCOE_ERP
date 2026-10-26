-- Astra+ Campus: workflow routing, approval decisions and member access management.

-- ------------------------------------------------------------- submit_workflow
create or replace function public.submit_workflow(
  p_module       text,
  p_title        text,
  p_description  text default null,
  p_department_id uuid default null,
  p_owner_id     uuid default null,
  p_priority     text default 'normal',
  p_due_at       timestamptz default null,
  p_payload      jsonb default '{}'::jsonb,
  p_approver_ids uuid[] default '{}'
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid       uuid := (select auth.uid());
  v_inst      uuid;
  v_title     text := btrim(coalesce(p_title, ''));
  v_id        uuid;
  v_key       text;
  v_hod       uuid;
  v_top       uuid;
  v_top_label text;
  v_is_top    boolean;
  v_chain     uuid[] := '{}';
  v_labels    text[] := '{}';
  v_status    text := 'pending';
  v_approver  uuid;
  v_idx       integer;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select institution_id into v_inst from public.profiles where user_id = v_uid and status = 'active';
  if v_inst is null then
    raise exception 'Campus access is not active' using errcode = '42501';
  end if;

  if char_length(v_title) not between 3 and 160 then
    raise exception 'Title must be 3 to 160 characters' using errcode = '22023';
  end if;
  if p_description is not null and char_length(p_description) > 4000 then
    raise exception 'Description is too long' using errcode = '22023';
  end if;

  if p_department_id is not null and not exists (
    select 1 from public.departments d
    where d.id = p_department_id and d.institution_id = v_inst and d.status = 'active'
  ) then
    raise exception 'Unknown department' using errcode = '22023';
  end if;

  if p_owner_id is not null and not exists (
    select 1 from public.profiles p where p.user_id = p_owner_id and p.institution_id = v_inst and p.status = 'active'
  ) then
    raise exception 'Unknown owner' using errcode = '22023';
  end if;

  select exists (
    select 1 from public.role_assignments ra
    where ra.user_id = v_uid and ra.status = 'active' and ra.role = 'principal'
  ) into v_is_top;

  -- ---- approval chain -------------------------------------------------
  if coalesce(array_length(p_approver_ids, 1), 0) > 0 then
    -- Explicit approvers are reserved for people who manage others.
    if not app_private.has_role(array['principal', 'administrator', 'coordinator', 'hod']) then
      raise exception 'You cannot choose approvers' using errcode = '42501';
    end if;
    if array_length(p_approver_ids, 1) > 8 then
      raise exception 'Too many approvers' using errcode = '22023';
    end if;

    for v_approver, v_idx in
      select u.id, min(u.ord)::integer
      from unnest(p_approver_ids) with ordinality as u(id, ord)
      group by u.id
      order by min(u.ord)
    loop
      if v_approver = v_uid then
        raise exception 'You cannot approve your own request' using errcode = '22023';
      end if;
      if not exists (
        select 1 from public.profiles p where p.user_id = v_approver and p.institution_id = v_inst and p.status = 'active'
      ) then
        raise exception 'Unknown approver' using errcode = '22023';
      end if;
      v_chain := v_chain || v_approver;
      v_labels := v_labels || ('Approval step ' || (coalesce(array_length(v_chain, 1), 1))::text);
    end loop;
  else
    -- Default routing: department head first, then the principal (or an administrator).
    if p_department_id is not null then
      select p.user_id into v_hod
      from public.departments d
      join public.profiles p on p.user_id = d.hod_user_id and p.status = 'active'
      where d.id = p_department_id and d.hod_user_id <> v_uid;
      if v_hod is null then
        select ra.user_id into v_hod
        from public.role_assignments ra
        join public.profiles p on p.user_id = ra.user_id and p.status = 'active'
        where ra.role = 'hod' and ra.status = 'active' and ra.department_id = p_department_id
          and ra.user_id <> v_uid
        order by ra.created_at limit 1;
      end if;
    end if;

    select ra.user_id, 'Principal approval' into v_top, v_top_label
    from public.role_assignments ra
    join public.profiles p on p.user_id = ra.user_id and p.status = 'active'
    where ra.role = 'principal' and ra.status = 'active' and p.institution_id = v_inst and ra.user_id <> v_uid
    order by ra.created_at limit 1;
    if v_top is null then
      select ra.user_id, 'Administrator approval' into v_top, v_top_label
      from public.role_assignments ra
      join public.profiles p on p.user_id = ra.user_id and p.status = 'active'
      where ra.role = 'administrator' and ra.status = 'active' and p.institution_id = v_inst and ra.user_id <> v_uid
      order by ra.created_at limit 1;
    end if;

    if v_hod is not null then
      v_chain := v_chain || v_hod;
      v_labels := v_labels || 'Department head review'::text;
    end if;
    -- Routine departmental work stops at the department head when one exists.
    if v_top is not null and not (v_hod is not null and p_module in ('task', 'leave', 'syllabus', 'timetable', 'attendance')) then
      v_chain := v_chain || v_top;
      v_labels := v_labels || v_top_label;
    end if;
  end if;

  -- The principal's own requests need no further approval.
  if coalesce(array_length(v_chain, 1), 0) = 0 and v_is_top then
    v_status := 'approved';
  end if;

  v_key := 'AST-' || to_char(now() at time zone 'utc', 'YYYY') || '-' || lpad(nextval('app_private.workflow_key_seq')::text, 5, '0');

  insert into public.workflow_requests (
    institution_id, request_key, module, title, description, priority, status,
    department_id, requester_id, owner_id, due_at, payload, completed_at
  ) values (
    v_inst, v_key, p_module, v_title, nullif(btrim(coalesce(p_description, '')), ''), p_priority, v_status,
    p_department_id, v_uid, coalesce(p_owner_id, v_uid), p_due_at, coalesce(p_payload, '{}'::jsonb),
    case when v_status = 'approved' then now() end
  ) returning id into v_id;

  for v_idx in 1 .. coalesce(array_length(v_chain, 1), 0) loop
    insert into public.workflow_steps (workflow_id, institution_id, step_order, label, approver_id, status)
    values (v_id, v_inst, v_idx, v_labels[v_idx], v_chain[v_idx], case when v_idx = 1 then 'pending' else 'waiting' end);
  end loop;

  if coalesce(array_length(v_chain, 1), 0) > 0 then
    perform app_private.notify(
      v_inst, v_chain[1], 'Approval requested: ' || v_title,
      v_key || ' is waiting for your review.', 'approval', '/approvals'
    );
  elsif v_status = 'pending' then
    -- Nobody could be resolved as approver: surface it to administrators instead of losing it.
    insert into public.notifications (institution_id, recipient_id, title, body, kind, href)
    select v_inst, ra.user_id, 'Request needs an approver: ' || left(v_title, 150),
           v_key || ' was submitted but no approver is assigned.', 'workflow', '/workflows'
    from public.role_assignments ra
    join public.profiles p on p.user_id = ra.user_id and p.status = 'active'
    where ra.status = 'active' and ra.role in ('principal', 'administrator') and p.institution_id = v_inst
    group by ra.user_id;
  end if;

  perform app_private.log_audit(
    v_inst, 'workflow_submitted', 'workflow_request', v_id, v_id,
    jsonb_build_object('module', p_module, 'request_key', v_key, 'status', v_status, 'steps', coalesce(array_length(v_chain, 1), 0))
  );

  return v_id;
end;
$$;

-- ------------------------------------------------------------- decide_workflow
create or replace function public.decide_workflow(
  p_workflow_id uuid,
  p_decision    text,
  p_comment     text default null
) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid     uuid := (select auth.uid());
  v_step    public.workflow_steps%rowtype;
  v_req     public.workflow_requests%rowtype;
  v_next    public.workflow_steps%rowtype;
  v_outcome text;
  v_comment text := nullif(btrim(coalesce(p_comment, '')), '');
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  if p_decision not in ('approve', 'return', 'reject') then
    raise exception 'Invalid decision' using errcode = '22023';
  end if;
  if v_comment is not null and char_length(v_comment) > 1000 then
    raise exception 'Comment is too long' using errcode = '22023';
  end if;
  if p_decision in ('return', 'reject') and v_comment is null then
    raise exception 'A comment is required' using errcode = '22023';
  end if;

  select * into v_req from public.workflow_requests where id = p_workflow_id for update;
  if not found or v_req.status <> 'pending' then
    raise exception 'This request is no longer awaiting a decision' using errcode = 'P0002';
  end if;

  select * into v_step
  from public.workflow_steps s
  where s.workflow_id = p_workflow_id and s.approver_id = v_uid and s.status = 'pending'
  for update;
  if not found then
    raise exception 'No pending approval for this user' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles p where p.user_id = v_uid and p.status = 'active' and p.institution_id = v_req.institution_id) then
    raise exception 'Campus access is not active' using errcode = '42501';
  end if;

  v_outcome := case p_decision when 'approve' then 'approved' when 'return' then 'returned' else 'rejected' end;

  update public.workflow_steps
  set status = v_outcome, comment = v_comment, decided_at = now()
  where id = v_step.id;

  if p_decision = 'approve' then
    select * into v_next
    from public.workflow_steps s
    where s.workflow_id = p_workflow_id and s.status = 'waiting'
    order by s.step_order limit 1;

    if found then
      update public.workflow_steps set status = 'pending' where id = v_next.id;
      perform app_private.notify(
        v_req.institution_id, v_next.approver_id, 'Approval requested: ' || v_req.title,
        v_req.request_key || ' is waiting for your review.', 'approval', '/approvals'
      );
    else
      update public.workflow_requests set status = 'approved', completed_at = now() where id = p_workflow_id;
      perform app_private.notify(
        v_req.institution_id, v_req.requester_id, 'Request approved: ' || v_req.title,
        v_req.request_key || ' has been fully approved.', 'workflow', '/workflows'
      );
    end if;
  else
    update public.workflow_steps set status = 'skipped'
    where workflow_id = p_workflow_id and status = 'waiting';
    update public.workflow_requests
    set status = v_outcome, completed_at = case when p_decision = 'reject' then now() end
    where id = p_workflow_id;
    perform app_private.notify(
      v_req.institution_id, v_req.requester_id,
      case p_decision when 'return' then 'Request returned: ' else 'Request rejected: ' end || v_req.title,
      coalesce(v_comment, v_req.request_key), 'workflow', '/workflows'
    );
  end if;

  perform app_private.log_audit(
    v_req.institution_id, 'workflow_' || v_outcome, 'workflow_step', v_step.id, p_workflow_id,
    jsonb_build_object('step_order', v_step.step_order, 'decision', p_decision)
  );
end;
$$;

-- --------------------------------------------------------------- manage_member
create or replace function public.manage_member(
  p_user_id           uuid,
  p_status            text,
  p_role              text,
  p_department_id     uuid default null,
  p_responsibility_id uuid default null
) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid         uuid := (select auth.uid());
  v_inst        uuid;
  v_target      public.profiles%rowtype;
  v_caller_top  boolean;
  v_target_top  boolean;
  v_target_adm  boolean;
  v_old_status  text;
  v_replaced    uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select p.institution_id into v_inst from public.profiles p where p.user_id = v_uid and p.status = 'active';
  if v_inst is null or not app_private.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  if p_user_id = v_uid then
    raise exception 'You cannot change your own access' using errcode = '42501';
  end if;
  if p_status not in ('pending', 'active', 'suspended') then
    raise exception 'Invalid status' using errcode = '22023';
  end if;
  if p_role not in ('administrator', 'coordinator', 'hod', 'faculty', 'staff') then
    raise exception 'Invalid role' using errcode = '22023';
  end if;
  if p_role = 'hod' and p_department_id is null then
    raise exception 'A department head needs a department' using errcode = '22023';
  end if;

  select * into v_target from public.profiles where user_id = p_user_id and institution_id = v_inst for update;
  if not found then
    raise exception 'Unknown member' using errcode = 'P0002';
  end if;

  if p_department_id is not null and not exists (
    select 1 from public.departments d where d.id = p_department_id and d.institution_id = v_inst and d.status = 'active'
  ) then
    raise exception 'Unknown department' using errcode = '22023';
  end if;
  if p_responsibility_id is not null and not exists (
    select 1 from public.responsibilities r where r.id = p_responsibility_id and r.institution_id = v_inst
  ) then
    raise exception 'Unknown responsibility' using errcode = '22023';
  end if;

  select exists (select 1 from public.role_assignments ra where ra.user_id = v_uid and ra.status = 'active' and ra.role = 'principal') into v_caller_top;
  select exists (select 1 from public.role_assignments ra where ra.user_id = p_user_id and ra.status = 'active' and ra.role = 'principal') into v_target_top;
  select exists (select 1 from public.role_assignments ra where ra.user_id = p_user_id and ra.status = 'active' and ra.role = 'administrator') into v_target_adm;

  if v_target_top then
    raise exception 'The principal''s access cannot be changed here' using errcode = '42501';
  end if;
  if (v_target_adm or p_role = 'administrator') and not v_caller_top then
    raise exception 'Only the principal can manage administrators' using errcode = '42501';
  end if;

  v_old_status := v_target.status;

  update public.profiles set status = p_status, department_id = p_department_id where user_id = p_user_id;

  -- Replace the assignment that covers the same responsibility slot.
  update public.role_assignments
  set status = 'revoked', ended_at = now()
  where user_id = p_user_id and status = 'active'
    and responsibility_id is not distinct from p_responsibility_id;

  insert into public.role_assignments (institution_id, user_id, role, department_id, responsibility_id, assigned_by)
  values (v_inst, p_user_id, p_role, p_department_id, p_responsibility_id, v_uid);

  -- Keep department.hod_user_id in step with role assignments.
  update public.departments set hod_user_id = null
  where hod_user_id = p_user_id and (p_role <> 'hod' or id <> p_department_id);

  if p_role = 'hod' then
    for v_replaced in
      select ra.user_id from public.role_assignments ra
      where ra.role = 'hod' and ra.status = 'active' and ra.department_id = p_department_id and ra.user_id <> p_user_id
    loop
      update public.role_assignments set status = 'revoked', ended_at = now()
      where user_id = v_replaced and role = 'hod' and department_id = p_department_id and status = 'active';
      insert into public.role_assignments (institution_id, user_id, role, department_id, assigned_by)
      values (v_inst, v_replaced, 'faculty', p_department_id, v_uid);
    end loop;
    update public.departments set hod_user_id = p_user_id where id = p_department_id;
  end if;

  if v_old_status is distinct from p_status then
    perform app_private.notify(
      v_inst, p_user_id,
      case p_status when 'active' then 'Your campus access is active'
                    when 'suspended' then 'Your campus access was paused'
                    else 'Your campus access is under review' end,
      null, 'access', case when p_status = 'active' then '/dashboard' else null end
    );
  end if;

  perform app_private.log_audit(
    v_inst, 'member_access_updated', 'profile', p_user_id, null,
    jsonb_build_object('status', p_status, 'role', p_role, 'department_id', p_department_id)
  );
end;
$$;

-- ------------------------------------------------------------------- privileges
revoke all on function public.submit_workflow(text, text, text, uuid, uuid, text, timestamptz, jsonb, uuid[]) from public, anon;
revoke all on function public.decide_workflow(uuid, text, text) from public, anon;
revoke all on function public.manage_member(uuid, text, text, uuid, uuid) from public, anon;
grant execute on function public.submit_workflow(text, text, text, uuid, uuid, text, timestamptz, jsonb, uuid[]) to authenticated;
grant execute on function public.decide_workflow(uuid, text, text) to authenticated;
grant execute on function public.manage_member(uuid, text, text, uuid, uuid) to authenticated;
