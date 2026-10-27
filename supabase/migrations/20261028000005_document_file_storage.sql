-- Private institutional document files. The API signs uploads/downloads only after
-- verifying the caller's staff identity, institution, role and document row scope.
alter table public.documents
  add column if not exists storage_path text,
  add column if not exists file_name text,
  add column if not exists mime_type text,
  add column if not exists file_size bigint,
  add column if not exists uploaded_by uuid references public.profiles(user_id) on delete set null;

alter table public.documents
  drop constraint if exists documents_file_size_check;
alter table public.documents
  add constraint documents_file_size_check
  check (file_size is null or file_size between 1 and 10485760);

create unique index if not exists documents_storage_path_unique
  on public.documents(storage_path) where storage_path is not null;

grant update (storage_path, file_name, mime_type, file_size, uploaded_by, version)
  on public.documents to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'institution-documents',
  'institution-documents',
  false,
  10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'image/png',
    'image/jpeg'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
