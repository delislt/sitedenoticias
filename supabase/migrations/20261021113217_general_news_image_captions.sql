-- General news is an editorial category, not a simulated committee session.
alter table public.articles drop constraint articles_category_check;
alter table public.articles add constraint articles_category_check
  check (category in ('juridico', 'csnu', 'historico', 'geral'));

alter table public.articles add column image_caption text not null default ''
  check (char_length(image_caption) <= 1000);

-- Extend the existing save path without changing its authorization, locking,
-- media validation, audit logging, or idempotency behavior.
do $migration$
declare
  original text := pg_get_functiondef('private.save_article(jsonb)'::regprocedure);
  updated text;
begin
  if position('sources,image_credit,correction_note' in original) = 0
    or position('coalesce(d->>''image_credit'',''''),coalesce(d->>''correction_note'','''')' in original) = 0
    or position('image_credit=excluded.image_credit,correction_note=' in original) = 0 then
    raise exception 'Unexpected article save function; review migration before applying.';
  end if;
  updated := replace(original,
    'sources,image_credit,correction_note',
    'sources,image_credit,image_caption,correction_note');
  updated := replace(updated,
    'coalesce(d->>''image_credit'',''''),coalesce(d->>''correction_note'','''')',
    'coalesce(d->>''image_credit'',''''),coalesce(d->>''image_caption'',a.image_caption,''''),coalesce(d->>''correction_note'','''')');
  updated := replace(updated,
    'image_credit=excluded.image_credit,correction_note=',
    'image_credit=excluded.image_credit,image_caption=excluded.image_caption,correction_note=');
  execute updated;
end $migration$;
