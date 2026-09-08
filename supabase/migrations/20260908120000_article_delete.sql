begin;

create or replace function private.delete_article(d jsonb, operation uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=private.actor();
  aid uuid:=nullif(d->>'id','')::uuid;
  a public.articles;
  old_data jsonb;
  result jsonb;
begin
  if operation is null or octet_length(d::text)>10000 then raise exception 'Operação inválida.' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended(u::text||operation::text,0));
  select o.result into result from private.operations o where user_id=u and operation_id=operation and action='article.delete';
  if found then return result; end if;

  select * into a from public.articles where id=aid for update;
  if not found then raise exception 'Matéria inexistente.' using errcode='P0002'; end if;
  if not private.has_role(array['editor']) and
    (a.author_id is distinct from u or a.status not in ('draft','review')) then
    raise exception 'Sem permissão para apagar esta matéria.' using errcode='42501';
  end if;
  if (d->>'version')::integer is distinct from a.version then
    raise exception 'A matéria foi atualizada. Recarregue antes de apagar.' using errcode='40001';
  end if;
  if d->>'confirmation' is distinct from a.title then
    raise exception 'Confirme a matéria que será apagada.' using errcode='22023';
  end if;

  old_data:=to_jsonb(a)-'search_vector';
  delete from public.articles where id=aid;
  insert into private.audit_log(actor_id,action,entity_id,before_data)
    values(u,'article.delete',aid,old_data);
  result:=jsonb_build_object('id',aid,'deleted',true);
  insert into private.operations(user_id,operation_id,action,result)
    values(u,operation,'article.delete',result);
  return result;
end $$;

create or replace function public.sis_mutate(act text,d jsonb,operation uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
begin
  if act='article.delete' then return private.delete_article(d,operation); end if;
  return private.mutate(act,d,operation);
end $$;

revoke all on function private.delete_article(jsonb,uuid) from public,anon,authenticated;
grant execute on function private.delete_article(jsonb,uuid) to authenticated;
notify pgrst,'reload schema';
commit;
