-- Protect document foreign keys from cross-institution attachment.
create or replace function app_private.guard_document_scope()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  document_id_value uuid;
  document_institution uuid;
begin
  document_id_value := nullif(to_jsonb(new) ->> tg_argv[0], '')::uuid;
  if document_id_value is null then return new; end if;
  select institution_id into document_institution from public.documents where id = document_id_value;
  if document_institution is null or document_institution is distinct from new.institution_id then
    raise exception 'Document reference must belong to the same institution' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger accreditation_evidence_document_scope_guard
before insert or update on public.accreditation_evidence
for each row execute function app_private.guard_document_scope('evidence_document_id');

create trigger expense_claims_document_scope_guard
before insert or update on public.expense_claims
for each row execute function app_private.guard_document_scope('receipt_document_id');

revoke all on function app_private.guard_document_scope() from public, anon, authenticated;
