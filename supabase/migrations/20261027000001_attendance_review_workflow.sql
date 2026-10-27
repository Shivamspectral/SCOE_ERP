-- Attendance submission/review audit fields.
-- Apply after 20261026000007_attendance_module.sql.

alter table public.attendance_sessions
  add column if not exists review_note text;

comment on column public.attendance_sessions.review_note is
  'Latest correction feedback from the authorized attendance reviewer.';

