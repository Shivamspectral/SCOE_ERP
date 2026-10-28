-- Module entitlements are platform-managed, not self-service institution preferences.
-- Authenticated institution administrators may read entitlements but cannot change them.
revoke all on public.institution_settings from authenticated;
grant select, delete on public.institution_settings to authenticated;
grant insert (
  institution_id, academic_year_label, academic_year_starts_on, academic_year_ends_on,
  default_currency, locale, timezone, contact_email, contact_phone,
  address, branding, notification_settings
) on public.institution_settings to authenticated;
grant update (
  academic_year_label, academic_year_starts_on, academic_year_ends_on,
  default_currency, locale, timezone, contact_email, contact_phone,
  address, branding, notification_settings, updated_by
) on public.institution_settings to authenticated;
