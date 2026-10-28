-- Scoped private document storage. The API uses the caller JWT for Storage operations;
-- no service-role key is needed for ordinary upload/download flows.

create or replace function app_private.can_access_document_file(
  p_object_name text,
  p_require_registered boolean default true
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.documents d
    join public.profiles p
      on p.user_id = (select auth.uid())
     and p.institution_id = d.institution_id
     and p.status = 'active'
    where
      d.id = case
        when split_part(p_object_name, '/', 2) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then split_part(p_object_name, '/', 2)::uuid
        else null
      end
      and d.institution_id = case
        when split_part(p_object_name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then split_part(p_object_name, '/', 1)::uuid
        else null
      end
      and (
        d.owner_id = (select auth.uid())
        or exists (
          select 1
          from public.role_assignments ra
          where ra.user_id = (select auth.uid())
            and ra.institution_id = d.institution_id
            and ra.status = 'active'
            and (
              ra.role in ('principal', 'administrator')
              or (
                ra.role in ('hod', 'coordinator')
                and (ra.department_id is null or ra.department_id = d.department_id)
              )
            )
        )
      )
      and (not p_require_registered or d.storage_path = p_object_name)
  );
$$;

revoke all on function app_private.can_access_document_file(text, boolean) from public, anon;
grant execute on function app_private.can_access_document_file(text, boolean) to authenticated;

drop policy if exists "staff can upload scoped document files" on storage.objects;
create policy "staff can upload scoped document files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'institution-documents'
  and app_private.can_access_document_file(name, false)
);

drop policy if exists "staff can download registered document files" on storage.objects;
create policy "staff can download registered document files"
on storage.objects for select to authenticated
using (
  bucket_id = 'institution-documents'
  and app_private.can_access_document_file(name, true)
);

drop policy if exists "staff can remove scoped document files" on storage.objects;
create policy "staff can remove scoped document files"
on storage.objects for delete to authenticated
using (
  bucket_id = 'institution-documents'
  and app_private.can_access_document_file(name, false)
);
