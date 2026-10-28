-- Tenant-level configuration for the multi-institution SaaS ERP.
create table if not exists public.institution_settings (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null unique references public.institutions(id) on delete cascade,
  academic_year_label text,
  academic_year_starts_on date,
  academic_year_ends_on date,
  default_currency char(3) not null default 'INR',
  locale text not null default 'en-IN',
  timezone text not null default 'Asia/Kolkata',
  contact_email text,
  contact_phone text,
  address jsonb not null default '{}'::jsonb,
  branding jsonb not null default '{}'::jsonb,
  enabled_modules text[] not null default '{}',
  notification_settings jsonb not null default '{}'::jsonb,
  updated_by uuid,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (academic_year_ends_on is null or academic_year_starts_on is null or academic_year_ends_on >= academic_year_starts_on)
);

create trigger institution_settings_touch_updated_at
before update on public.institution_settings
for each row execute function app_private.touch_updated_at();

alter table public.institution_settings enable row level security;
grant select, insert, update, delete on public.institution_settings to authenticated;
create policy institution_settings_select on public.institution_settings
for select to authenticated
using (institution_id = (select app_private.current_institution()));
create policy institution_settings_insert on public.institution_settings
for insert to authenticated
with check (institution_id = (select app_private.current_institution())
  and (select app_private.has_role(array['principal','administrator','coordinator'])));
create policy institution_settings_update on public.institution_settings
for update to authenticated
using (institution_id = (select app_private.current_institution())
  and (select app_private.has_role(array['principal','administrator','coordinator'])))
with check (institution_id = (select app_private.current_institution())
  and (select app_private.has_role(array['principal','administrator','coordinator'])));
create policy institution_settings_delete on public.institution_settings
for delete to authenticated
using (institution_id = (select app_private.current_institution())
  and (select app_private.is_admin()));

create trigger institution_settings_audit
after insert or update or delete on public.institution_settings
for each row execute function app_private.audit_row_change('institution_settings');
