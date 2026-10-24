-- SQLSTATE 40001 is reserved for retryable serialization failures. PostgREST 14
-- retries it indefinitely, even when an unchanged stale version cannot succeed.
-- PT409 preserves optimistic locking and returns an HTTP conflict without retry.
-- Only the error code changes; privileges, checks and article data stay intact.
do $migration$
declare
  fn record;
  original text;
  updated text;
begin
  for fn in
    select p.oid
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private'
      and p.prokind = 'f'
      and p.prosrc ~ 'errcode\s*=\s*''40001'''
  loop
    original := pg_get_functiondef(fn.oid);
    updated := regexp_replace(original,
      'errcode\s*=\s*''40001''', 'errcode=''PT409''', 'g');
    execute updated;
  end loop;
end
$migration$;
