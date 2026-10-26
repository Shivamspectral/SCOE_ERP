-- Astra+ Campus: create a campus profile when an auth user confirms their email.
-- The first confirmed account creates the institution and becomes its principal.
-- Everyone after that joins the same institution as "pending" until an administrator assigns a role.

create or replace function app_private.handle_confirmed_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_meta   jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_name   text;
  v_inst   uuid;
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

  v_name := left(btrim(coalesce(v_meta ->> 'full_name', '')), 120);
  if v_name = '' then
    v_name := left(coalesce(nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 'Campus member'), 120);
  end if;

  -- Serialise first-user bootstrap so two simultaneous signups cannot both become principal.
  perform pg_advisory_xact_lock(hashtextextended('astra_campus_bootstrap', 0));

  select id into v_inst from public.institutions order by created_at limit 1;

  if v_inst is null then
    insert into public.institutions (name)
    values (coalesce(nullif(left(btrim(coalesce(v_meta ->> 'institution_name', '')), 160), ''), 'My Institution'))
    returning id into v_inst;

    perform app_private.seed_responsibilities(v_inst);

    insert into public.profiles (user_id, institution_id, full_name, status)
    values (new.id, v_inst, v_name, 'active');

    insert into public.role_assignments (institution_id, user_id, role, assigned_by)
    values (v_inst, new.id, 'principal', new.id);
  else
    insert into public.profiles (user_id, institution_id, full_name, status)
    values (new.id, v_inst, v_name, 'pending');

    insert into public.notifications (institution_id, recipient_id, title, body, kind, href)
    select v_inst, ra.user_id, 'New access request', v_name || ' is waiting for a campus role.', 'access', '/people'
    from public.role_assignments ra
    join public.profiles p on p.user_id = ra.user_id and p.status = 'active'
    where ra.status = 'active' and ra.role in ('principal', 'administrator') and p.institution_id = v_inst
    group by ra.user_id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed
  after insert or update of email_confirmed_at on auth.users
  for each row execute function app_private.handle_confirmed_user();
