-- Keep staff email addresses available to authorized institutional directory views
-- without granting the API a service-role lookup for every list row.

alter table public.profiles add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.user_id
  and p.email is distinct from u.email;

create or replace function app_private.populate_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select u.email into new.email
  from auth.users u
  where u.id = new.user_id;
  return new;
end;
$$;

drop trigger if exists profiles_populate_email on public.profiles;
create trigger profiles_populate_email
before insert on public.profiles
for each row execute function app_private.populate_profile_email();

create or replace function app_private.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles
    set email = new.email
    where user_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists auth_user_sync_profile_email on auth.users;
create trigger auth_user_sync_profile_email
after update of email on auth.users
for each row execute function app_private.sync_profile_email();

revoke all on function app_private.populate_profile_email() from public, anon, authenticated;
revoke all on function app_private.sync_profile_email() from public, anon, authenticated;
