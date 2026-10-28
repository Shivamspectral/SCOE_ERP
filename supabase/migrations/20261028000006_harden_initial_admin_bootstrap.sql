-- Harden first-account provisioning for SCOE ERP.
-- Never grant Principal privileges merely because someone is the first person to sign up.
-- The institution is provisioned once; all self-service signups remain pending until
-- a trusted Principal/Administrator assigns an institutional role.

do $$
declare
  v_inst uuid;
begin
  select id into v_inst
  from public.institutions
  order by created_at
  limit 1;

  if v_inst is null then
    insert into public.institutions (name, timezone)
    values ('Siddhant College of Engineering', 'Asia/Kolkata')
    returning id into v_inst;

    perform app_private.seed_responsibilities(v_inst);
  end if;
end;
$$;

create or replace function app_private.handle_confirmed_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_name text;
  v_inst uuid;
begin
  if new.email_confirmed_at is null then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.email_confirmed_at is not null then
    return new;
  end if;

  if exists (select 1 from public.profiles where user_id = new.id) then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('astra_campus_bootstrap', 0));

  select id into v_inst
  from public.institutions
  order by created_at
  limit 1;

  if v_inst is null then
    raise exception 'Institution must be provisioned by a trusted administrator before account activation';
  end if;

  v_name := left(btrim(coalesce(v_meta ->> 'full_name', '')), 120);
  if v_name = '' then
    v_name := left(coalesce(nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 'Campus member'), 120);
  end if;

  -- Every self-service account starts pending. Role grants are always an explicit
  -- administrator action, never derived from signup order or user-editable metadata.
  insert into public.profiles (user_id, institution_id, full_name, status)
  values (new.id, v_inst, v_name, 'pending');

  insert into public.notifications (institution_id, recipient_id, title, body, kind, href)
  select v_inst, ra.user_id, 'New access request',
         v_name || ' is waiting for a campus role.', 'access', '/people'
  from public.role_assignments ra
  join public.profiles p on p.user_id = ra.user_id and p.status = 'active'
  where ra.institution_id = v_inst
    and ra.status = 'active'
    and ra.role in ('principal', 'administrator')
  group by ra.user_id;

  return new;
end;
$$;

-- Keep the existing trigger attached to the hardened function.
