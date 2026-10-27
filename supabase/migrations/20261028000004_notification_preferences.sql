-- Persist staff notification preferences without claiming that email/SMS delivery is configured.
create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  email_alerts boolean not null default true,
  sms_alerts boolean not null default false,
  attendance_warnings boolean not null default true,
  updated_by uuid not null references public.profiles(user_id) on delete restrict,
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create index if not exists notification_preferences_institution_idx
  on public.notification_preferences(institution_id, user_id);

alter table public.notification_preferences enable row level security;
drop policy if exists notification_preferences_select_own on public.notification_preferences;
create policy notification_preferences_select_own on public.notification_preferences
  for select to authenticated
  using (
    institution_id = (select app_private.current_institution())
    and user_id = (select auth.uid())
  );
drop policy if exists notification_preferences_insert_own on public.notification_preferences;
create policy notification_preferences_insert_own on public.notification_preferences
  for insert to authenticated
  with check (
    institution_id = (select app_private.current_institution())
    and user_id = (select auth.uid())
    and updated_by = (select auth.uid())
  );
drop policy if exists notification_preferences_update_own on public.notification_preferences;
create policy notification_preferences_update_own on public.notification_preferences
  for update to authenticated
  using (
    institution_id = (select app_private.current_institution())
    and user_id = (select auth.uid())
  )
  with check (
    institution_id = (select app_private.current_institution())
    and user_id = (select auth.uid())
    and updated_by = (select auth.uid())
  );

grant select, insert, update on public.notification_preferences to authenticated;
revoke all on public.notification_preferences from anon;

drop trigger if exists notification_preferences_set_updated_at on public.notification_preferences;
create trigger notification_preferences_set_updated_at
  before update on public.notification_preferences
  for each row execute function app_private.set_updated_at();

drop trigger if exists audit_notification_preferences on public.notification_preferences;
create trigger audit_notification_preferences
  after insert or update on public.notification_preferences
  for each row execute function app_private.audit_row_change('notification_preferences');
