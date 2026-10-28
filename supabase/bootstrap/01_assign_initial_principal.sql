-- One-time initial Principal provisioning for SCOE ERP.
-- Run manually in Supabase SQL Editor after the intended college administrator
-- has created an account and confirmed their email.
--
-- IMPORTANT:
-- 1. Replace the placeholder email below with the exact verified institutional email.
-- 2. Review the selected account before running.
-- 3. This script does not create a password or bypass email confirmation.
-- 4. Only a trusted Supabase project administrator should run this script.
--
-- It is safe to re-run for the same account; it refuses to silently select an
-- arbitrary user or promote an account whose email is not confirmed.

begin;

do $bootstrap$
declare
  v_email text := lower(btrim('REPLACE_WITH_VERIFIED_PRINCIPAL_EMAIL'));
  v_user_id uuid;
  v_institution_id uuid;
  v_profile_status text;
begin
  if v_email = '' or v_email = 'replace_with_verified_principal_email'
     or position('@' in v_email) < 2 then
    raise exception 'Edit the script and provide the exact verified Principal email first';
  end if;

  select u.id into v_user_id
  from auth.users u
  where lower(u.email) = v_email
    and u.email_confirmed_at is not null;

  if v_user_id is null then
    raise exception 'No confirmed Supabase Auth user exists for the supplied email';
  end if;

  select p.institution_id, p.status
    into v_institution_id, v_profile_status
  from public.profiles p
  where p.user_id = v_user_id;

  if v_institution_id is null then
    raise exception 'The user has no campus profile; check the email-confirmation trigger and migration status';
  end if;

  if not exists (
    select 1 from public.institutions i where i.id = v_institution_id
  ) then
    raise exception 'The user profile points to a missing institution';
  end if;

  -- Refuse to create a second Principal for the same institution.
  if exists (
    select 1
    from public.role_assignments ra
    where ra.institution_id = v_institution_id
      and ra.role = 'principal'
      and ra.status = 'active'
      and ra.user_id <> v_user_id
  ) then
    raise exception 'Another active Principal already exists for this institution';
  end if;

  update public.profiles
  set status = 'active',
      email = v_email,
      updated_at = now()
  where user_id = v_user_id;

  insert into public.role_assignments (
    institution_id, user_id, role, department_id, responsibility_id, status, assigned_by
  )
  values (
    v_institution_id, v_user_id, 'principal', null, null, 'active', v_user_id
  )
  on conflict do nothing;

  raise notice 'Principal access provisioned for % (user id %).', v_email, v_user_id;
end
$bootstrap$;

commit;
