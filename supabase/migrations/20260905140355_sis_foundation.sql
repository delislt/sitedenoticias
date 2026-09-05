-- Additive migration. Legacy dates mean midnight in America/Sao_Paulo.
-- Run after the legacy schema; see docs/DEPLOYMENT.md. No sample content.
begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;
alter default privileges in schema private revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from public;

create table private.user_roles (
  user_id uuid references auth.users(id) on delete cascade,
  role text check (role in ('journalist','editor','moderator','admin')),
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(), primary key(user_id,role)
);
alter table private.user_roles enable row level security;
-- Preserve exactly the pre-reader cohort audited on 2026-09-05. Fail on drift.
do $$ begin
  if (select count(*) from auth.users where created_at < '2026-05-29T00:00:00Z' and email_confirmed_at is not null) <> 3 then
    raise exception 'Legacy administrator cohort changed; review bootstrap before applying';
  end if;
end $$;
insert into private.user_roles(user_id,role)
select id,'admin' from auth.users where created_at < '2026-05-29T00:00:00Z' and email_confirmed_at is not null;

create function private.has_role(wanted text[]) returns boolean language sql stable security definer set search_path='' as $$
  select auth.uid() is not null and exists(select 1 from private.user_roles where user_id=auth.uid() and (role='admin' or role=any(wanted)))
   and exists(select 1 from auth.sessions where id=nullif(auth.jwt()->>'session_id','')::uuid and user_id=auth.uid())
$$;
create function private.is_member() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.users u join auth.sessions s on s.user_id=u.id where u.id=auth.uid() and u.email_confirmed_at is not null and not u.is_anonymous and s.id=nullif(auth.jwt()->>'session_id','')::uuid)
$$;
create function private.normalize_text(value text) returns text language sql immutable parallel safe security invoker set search_path='' as $$
 select translate(value,'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüç','AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuuc')
$$;
create function private.actor() returns uuid language plpgsql stable security definer set search_path='' as $$
declare u uuid := auth.uid(); begin
  if u is null or not exists(select 1 from auth.users where id=u and email_confirmed_at is not null and not is_anonymous)
     or not exists(select 1 from auth.sessions where id=nullif(auth.jwt()->>'session_id','')::uuid and user_id=u) then
    raise exception 'Verifique sua conta e entre novamente.' using errcode='42501';
  end if; return u;
end $$;

create table public.reader_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 60),
  updated_at timestamptz not null default now()
);
create table public.site_settings (
  id boolean primary key default true check(id), comments_enabled boolean not null default false,
  moderation_ready boolean not null default false, premoderation boolean not null default true,
  readers_enabled boolean not null default false, updated_at timestamptz not null default now()
);
insert into public.site_settings(id) values(true);
create table public.editions (
  id uuid primary key default gen_random_uuid(), slug text unique not null check(slug ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  title text not null check(char_length(title) between 3 and 120), year integer not null check(year between 2000 and 2200),
  published boolean not null default false, version integer not null default 1, updated_at timestamptz not null default now()
);
-- The existing dossiers explicitly identify SIS 2026; this is an archive label, not an invented schedule.
insert into public.editions(slug,title,year,published) values('2026','SIS 2026',2026,true);

alter table public.articles alter column published_at drop not null;
alter table public.articles alter column published_at type timestamptz using published_at::timestamp at time zone 'America/Sao_Paulo';
alter table public.articles add column status text not null default 'published' check(status in ('draft','review','published','archived'));
alter table public.articles alter column status set default 'draft';
alter table public.articles add column author_id uuid references auth.users(id) on delete set null;
alter table public.articles add column edition_id uuid references public.editions(id) on delete restrict;
update public.articles set edition_id=(select id from public.editions where slug='2026');
alter table public.articles add column kind text not null default 'simulation' check(kind in ('simulation','context','opinion','official'));
alter table public.articles add column tags text[] not null default '{}' check(cardinality(tags)<=12);
alter table public.articles add column sources jsonb not null default '[]' check(jsonb_typeof(sources)='array' and jsonb_array_length(sources)<=30);
alter table public.articles add column image_credit text not null default '' check(char_length(image_credit)<=300);
alter table public.articles add column correction_note text not null default '' check(char_length(correction_note)<=2000);
alter table public.articles add column comments_open boolean not null default true;
alter table public.articles add column version integer not null default 1;
alter table public.articles add column search_vector tsvector generated always as (
  setweight(to_tsvector('portuguese',private.normalize_text(coalesce(title,''))),'A') || setweight(to_tsvector('portuguese',private.normalize_text(coalesce(subtitle,''))),'B') || setweight(to_tsvector('portuguese',private.normalize_text(coalesce(content->>'paragraphs',''))),'C')
) stored;
create index articles_search_idx on public.articles using gin(search_vector);
create index articles_publication_idx on public.articles(status,published_at desc,id);
create index articles_category_idx on public.articles(category,status,published_at desc,id);
create index articles_author_idx on public.articles(author_id);
create index articles_edition_idx on public.articles(edition_id);
create index articles_tags_idx on public.articles using gin(tags);
create table public.article_slugs (slug text primary key, article_id uuid not null references public.articles(id) on delete cascade);
create index article_slugs_article_idx on public.article_slugs(article_id);

create table private.audit_log (
  id bigint generated always as identity primary key, actor_id uuid references auth.users(id) on delete set null,
  action text not null, entity_id uuid, reason text not null default '', before_data jsonb, after_data jsonb, created_at timestamptz not null default now()
);
create index audit_entity_idx on private.audit_log(entity_id,created_at desc);
alter table private.audit_log enable row level security;
create table private.rate_limits (
  user_id uuid references auth.users(id) on delete cascade, action text, window_started timestamptz not null,
  attempts integer not null, primary key(user_id,action)
);
alter table private.rate_limits enable row level security;
create table private.operations (
  user_id uuid references auth.users(id) on delete cascade, operation_id uuid, action text not null,
  result jsonb not null, created_at timestamptz not null default now(), primary key(user_id,operation_id)
);
alter table private.operations enable row level security;
create table private.suspensions (
  user_id uuid primary key references auth.users(id) on delete cascade, until_at timestamptz not null, reason text not null
);
alter table private.suspensions enable row level security;
create function private.rate_limit(u uuid,a text,maximum integer,seconds integer) returns void language plpgsql security definer set search_path='' as $$
declare n integer; begin
  insert into private.rate_limits values(u,a,clock_timestamp(),1)
  on conflict(user_id,action) do update set
    attempts=case when private.rate_limits.window_started < clock_timestamp()-make_interval(secs=>seconds) then 1 else private.rate_limits.attempts+1 end,
    window_started=case when private.rate_limits.window_started < clock_timestamp()-make_interval(secs=>seconds) then clock_timestamp() else private.rate_limits.window_started end
  returning attempts into n;
  if n>maximum then raise exception 'Limite de frequência atingido. Aguarde antes de tentar novamente.' using errcode='P0001'; end if;
end $$;

create table public.comments (
  id uuid primary key default gen_random_uuid(), article_id uuid not null references public.articles(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null, parent_id uuid references public.comments(id) on delete restrict,
  display_name text not null, team_badge boolean not null default false, body text not null check(char_length(body)<=2000),
  status text not null default 'pending' check(status in ('pending','approved','rejected','removed')),
  created_at timestamptz not null default now(), edited_at timestamptz, version integer not null default 1
);
create index comments_article_idx on public.comments(article_id,status,created_at desc,id);
create index comments_author_idx on public.comments(author_id,created_at desc);
create index comments_parent_idx on public.comments(parent_id);
create table private.comment_reports (
  id uuid primary key default gen_random_uuid(), comment_id uuid not null references public.comments(id) on delete cascade,
  reporter_id uuid references auth.users(id) on delete set null, reason text not null check(char_length(reason) between 3 and 500),
  resolved boolean not null default false, resolved_at timestamptz, created_at timestamptz not null default now(), unique(comment_id,reporter_id)
);
alter table private.comment_reports enable row level security;
create table private.corrections (
  id uuid primary key default gen_random_uuid(), article_id uuid not null references public.articles(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null, body text not null check(char_length(body) between 10 and 2000),
  status text not null default 'pending' check(status in ('pending','accepted','rejected')), resolved_at timestamptz, created_at timestamptz not null default now()
);
alter table private.corrections enable row level security;
create table public.bookmarks (
  user_id uuid references auth.users(id) on delete cascade, article_id uuid references public.articles(id) on delete cascade,
  created_at timestamptz not null default now(), primary key(user_id,article_id)
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(), edition_id uuid not null references public.editions(id) on delete restrict,
  category text not null check(category in ('juridico','csnu','historico')), title text not null check(char_length(title) between 3 and 180),
  starts_at timestamptz not null, ends_at timestamptz not null check(ends_at>starts_at),
  location text not null default '' check(char_length(location)<=200), location_public boolean not null default false,
  status text not null default 'scheduled' check(status in ('scheduled','live','closed','cancelled')),
  summary text not null default '' check(char_length(summary)<=10000), published boolean not null default false,
  version integer not null default 1, updated_at timestamptz not null default now()
);
create index sessions_schedule_idx on public.sessions(published,starts_at,category);
create index sessions_edition_idx on public.sessions(edition_id);
create table public.session_updates (
  id uuid primary key default gen_random_uuid(), session_id uuid not null references public.sessions(id) on delete restrict,
  body text not null check(char_length(body) between 3 and 2000), author text not null check(char_length(author) between 2 and 120),
  author_id uuid references auth.users(id) on delete set null, article_id uuid references public.articles(id) on delete set null,
  result boolean not null default false, organization_confirmed boolean not null default false,
  correction_note text not null default '' check(char_length(correction_note)<=2000),
  published boolean not null default false, version integer not null default 1,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(not published or not result or organization_confirmed)
);
create index session_updates_session_idx on public.session_updates(session_id,created_at desc);
create index session_updates_article_idx on public.session_updates(article_id);
create index session_updates_author_idx on public.session_updates(author_id);
create table public.media_assets (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  bucket text not null check(bucket in ('sis-images','sis-documents')), path text unique not null,
  mime text not null, bytes integer not null check(bytes between 1 and 4194304),
  created_at timestamptz not null default now()
);
create index media_assets_owner_idx on public.media_assets(owner_id);
create table public.documents (
  id uuid primary key default gen_random_uuid(), edition_id uuid not null references public.editions(id) on delete restrict,
  category text check(category in ('juridico','csnu','historico')), title text not null check(char_length(title) between 3 and 180),
  description text not null default '' check(char_length(description)<=2000),
  kind text not null check(kind in ('rules','guide','template','resolution','notice')),
  document_version text not null check(char_length(document_version) between 1 and 40), responsible text not null check(char_length(responsible) between 2 and 120),
  asset_id uuid not null references public.media_assets(id) on delete restrict,
  audience text not null default 'restricted' check(audience in ('public','restricted')), published boolean not null default false,
  organization_confirmed boolean not null default false, version integer not null default 1, updated_at timestamptz not null default now(),
  check(not published or kind<>'resolution' or organization_confirmed)
);
create index documents_filter_idx on public.documents(published,audience,edition_id,category,kind);
create index documents_asset_idx on public.documents(asset_id);
create table public.announcements (
  id uuid primary key default gen_random_uuid(), edition_id uuid not null references public.editions(id) on delete restrict,
  title text not null check(char_length(title) between 3 and 180), body text not null check(char_length(body) between 3 and 2000),
  published boolean not null default false, version integer not null default 1, updated_at timestamptz not null default now()
);
create index announcements_edition_idx on public.announcements(edition_id);

create function private.article_public(a uuid) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.articles where id=a and status='published' and published_at<=now())
$$;
create function private.asset_visible(a uuid) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.media_assets m where m.id=a and ((m.owner_id=auth.uid() and private.is_member()) or private.has_role(array['editor'])
    or exists(select 1 from public.articles n where n.cover_image='/api/media/'||m.id::text and n.status='published' and n.published_at<=now())
    or exists(select 1 from public.documents d where d.asset_id=m.id and d.published and (d.audience='public' or private.is_member()))))
$$;

-- Remove the permissive legacy policies and all unnecessary table grants.
drop policy if exists authenticated_delete on public.articles;
drop policy if exists authenticated_update on public.articles;
drop policy if exists authenticated_insert on public.articles;
drop policy if exists allow_public_read on public.articles;
do $$ declare t text; begin
  foreach t in array array['articles','reader_profiles','site_settings','editions','article_slugs','comments','bookmarks','sessions','session_updates','media_assets','documents','announcements'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon,authenticated',t);
    execute format('grant select on public.%I to authenticated',t);
  end loop;
end $$;
grant select on public.articles, public.site_settings,public.editions,public.article_slugs,public.session_updates,public.documents,public.announcements,public.media_assets to anon;
grant select(id,article_id,parent_id,display_name,team_badge,body,status,created_at,edited_at,version) on public.comments to anon;
-- Detailed locations cannot leak through the Data API, even if a query selects all columns.
revoke select on public.sessions from authenticated;
grant select(id,edition_id,category,title,starts_at,ends_at,status,summary,published,version,updated_at) on public.sessions to anon,authenticated;
create policy articles_read on public.articles for select to anon,authenticated using(
 (status='published' and published_at<=now()) or private.has_role(array['editor']) or (author_id=auth.uid() and private.has_role(array['journalist'])));
create policy profile_own on public.reader_profiles for select to authenticated using(id=auth.uid() and private.is_member());
create policy settings_read on public.site_settings for select to anon,authenticated using(true);
create policy editions_read on public.editions for select to anon,authenticated using(published or private.has_role(array['editor','journalist']));
create policy slugs_read on public.article_slugs for select to anon,authenticated using(private.article_public(article_id));
create policy comments_read on public.comments for select to anon,authenticated using(
  (status='approved' and private.article_public(article_id)) or (author_id=auth.uid() and private.is_member()) or private.has_role(array['moderator']));
create policy bookmarks_own on public.bookmarks for select to authenticated using(user_id=auth.uid() and private.is_member());
create policy sessions_read on public.sessions for select to anon,authenticated using(published or private.has_role(array['editor','journalist']));
create policy updates_read on public.session_updates for select to anon,authenticated using(
 (published and exists(select 1 from public.sessions s where s.id=session_id and s.published)) or private.has_role(array['editor']) or (author_id=auth.uid() and private.has_role(array['journalist'])));
create policy documents_read on public.documents for select to anon,authenticated using((published and (audience='public' or private.is_member())) or private.has_role(array['editor','journalist']));
create policy announcements_read on public.announcements for select to anon,authenticated using(published or private.has_role(array['editor']));
create policy assets_read on public.media_assets for select to anon,authenticated using(private.asset_visible(id));
grant insert on public.media_assets to service_role;

drop policy if exists authenticated_delete_images on storage.objects;
drop policy if exists authenticated_update_images on storage.objects;
drop policy if exists authenticated_upload on storage.objects;
drop policy if exists allow_public_read_images on storage.objects;
update storage.buckets set file_size_limit=4194304,allowed_mime_types=array['image/jpeg','image/png','image/webp'] where id='article-images';
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('sis-images','sis-images',false,4194304,array['image/webp']),
 ('sis-documents','sis-documents',false,4194304,array['application/pdf']);
-- No client INSERT/UPDATE/DELETE policy: validated server uploads only.
create policy sis_asset_download on storage.objects for select to anon,authenticated using(
 bucket_id in ('sis-images','sis-documents') and exists(select 1 from public.media_assets m where m.bucket=bucket_id and m.path=name and private.asset_visible(m.id)));

create function private.save_article(d jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=private.actor(); a public.articles; old_data jsonb; aid uuid:=nullif(d->>'id','')::uuid;
  st text:=coalesce(d->>'status','draft'); v integer; e boolean:=private.has_role(array['editor']); src jsonb; image_id uuid;
begin
  if not private.has_role(array['journalist','editor']) then raise exception 'Sem permissão editorial.' using errcode='42501'; end if;
  if aid is not null then
    select * into a from public.articles where id=aid for update;
    if not found then raise exception 'Matéria inexistente.' using errcode='P0002'; end if;
    if (d->>'version')::integer is distinct from a.version then raise exception 'Outra pessoa salvou esta matéria. Recarregue antes de editar.' using errcode='40001'; end if;
    if not e and (a.author_id is distinct from u or a.status not in ('draft','review')) then raise exception 'Sem permissão para editar esta matéria.' using errcode='42501'; end if;
    old_data:=to_jsonb(a)-'search_vector';
  else aid:=gen_random_uuid(); end if;
  if not e and st not in ('draft','review') then raise exception 'Somente editores podem publicar ou arquivar.' using errcode='42501'; end if;
  if char_length(coalesce(d->>'title','')) not between 5 and 180 or char_length(coalesce(d->>'subtitle',''))>500
    or char_length(coalesce(d->>'author','')) not between 2 and 120 or (d->>'slug') !~ '^[a-z0-9][a-z0-9-]{0,149}$'
    or jsonb_typeof(d->'content'->'paragraphs') is distinct from 'array' or jsonb_array_length(d->'content'->'paragraphs') not between 1 and 400
    or char_length(d->'content'->>'paragraphs')>150000 or exists(select 1 from jsonb_array_elements(d->'content'->'paragraphs') p where jsonb_typeof(p)<>'string') then
    raise exception 'Confira título, autoria, endereço e texto da matéria.' using errcode='22023';
  end if;
  if d->>'edition_id' is null then raise exception 'Selecione a edição.' using errcode='22023'; end if;
  if char_length(coalesce(d->>'cover_image',''))>0 and not (
    d->>'cover_image' ~ '^/images/[a-zA-Z0-9/_.-]+$' or d->>'cover_image' ~ '^/api/media/[a-f0-9-]{36}$'
    or d->>'cover_image' ~ '^https://akkmhfdpqlikbgajwlle[.]supabase[.]co/storage/v1/object/public/article-images/[a-zA-Z0-9/_.%-]+$') then
    raise exception 'Envie a imagem pelo portal.' using errcode='22023';
  end if;
  if d->>'cover_image' like '/api/media/%' then
    image_id:=substring(d->>'cover_image' from 12)::uuid;
    if not exists(select 1 from public.media_assets where id=image_id and bucket='sis-images' and (owner_id=u or e)) then raise exception 'Imagem sem autorização.' using errcode='42501'; end if;
  end if;
  for src in select value from jsonb_array_elements(coalesce(d->'sources','[]')) loop
    if char_length(coalesce(src->>'title','')) not between 2 and 200 or coalesce(src->>'url','') !~ '^https://[^/@[:space:]]+([/:?#][^[:space:]]*)?$' or char_length(src->>'url')>2000 then raise exception 'Fonte inválida.' using errcode='22023'; end if;
  end loop;
  if exists(select 1 from jsonb_array_elements_text(coalesce(d->'tags','[]')) tag where char_length(tag) not between 1 and 40) then raise exception 'Tag inválida.' using errcode='22023'; end if;
  if exists(select 1 from public.article_slugs where slug=d->>'slug' and article_id<>aid) then raise exception 'Este endereço pertence a uma matéria anterior.' using errcode='23505'; end if;
  v:=coalesce(a.version,0)+1;
  insert into public.articles(id,slug,title,subtitle,category,author,published_at,reading_time,cover_image,content,featured,status,author_id,edition_id,kind,tags,sources,image_credit,correction_note,comments_open,version,updated_at)
  values(aid,d->>'slug',d->>'title',coalesce(d->>'subtitle',''),d->>'category',d->>'author',case when st='published' then coalesce(a.published_at,now()) else a.published_at end,
    greatest(1,ceil(array_length(regexp_split_to_array(d->'content'->>'paragraphs','\s+'),1)/200.0))::text||' min',coalesce(d->>'cover_image',''),d->'content',coalesce((d->>'featured')::boolean,false),st,coalesce(a.author_id,u),(d->>'edition_id')::uuid,coalesce(d->>'kind','simulation'),
    array(select jsonb_array_elements_text(coalesce(d->'tags','[]'))),coalesce(d->'sources','[]'),coalesce(d->>'image_credit',''),coalesce(d->>'correction_note',''),coalesce((d->>'comments_open')::boolean,true),v,now())
  on conflict(id) do update set slug=excluded.slug,title=excluded.title,subtitle=excluded.subtitle,category=excluded.category,author=excluded.author,published_at=excluded.published_at,reading_time=excluded.reading_time,cover_image=excluded.cover_image,content=excluded.content,featured=excluded.featured,status=excluded.status,edition_id=excluded.edition_id,kind=excluded.kind,tags=excluded.tags,sources=excluded.sources,image_credit=excluded.image_credit,correction_note=excluded.correction_note,comments_open=excluded.comments_open,version=excluded.version,updated_at=excluded.updated_at;
  if a.slug is not null and a.slug<>d->>'slug' then insert into public.article_slugs values(a.slug,aid) on conflict(slug) do nothing; end if;
  insert into private.audit_log(actor_id,action,entity_id,reason,before_data,after_data) values(u,'article.save',aid,coalesce(d->>'correction_note',''),old_data,(select to_jsonb(n)-'search_vector' from public.articles n where id=aid));
  return jsonb_build_object('id',aid,'version',v);
end $$;

create function private.comment_action(act text,d jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=private.actor(); c public.comments; parent public.comments; a public.articles; s public.site_settings;
  cid uuid:=nullif(d->>'id','')::uuid; txt text:=btrim(coalesce(d->>'body','')); nm text; st text;
begin
  if act='comment.create' then
    if exists(select 1 from private.suspensions where user_id=u and until_at>now()) then raise exception 'Sua participação está suspensa.' using errcode='42501'; end if;
    select * into s from public.site_settings where id;
    select * into a from public.articles where id=(d->>'article_id')::uuid for share;
    if a.id is null or a.status<>'published' or a.published_at>now() or not a.comments_open or not s.comments_enabled or not s.moderation_ready
      or not exists(select 1 from private.user_roles where role in ('admin','moderator')) then raise exception 'Esta discussão está fechada.' using errcode='42501'; end if;
    if char_length(txt) not between 1 and 2000 then raise exception 'Escreva entre 1 e 2.000 caracteres.' using errcode='22023'; end if;
    select display_name into nm from public.reader_profiles where id=u;
    if nm is null then raise exception 'Defina seu nome de exibição na conta.' using errcode='22023'; end if;
    if nullif(d->>'parent_id','') is not null then
      select * into parent from public.comments where id=(d->>'parent_id')::uuid for share;
      if parent.id is null or parent.article_id<>a.id or parent.parent_id is not null or parent.status<>'approved' then raise exception 'Resposta inválida: escolha um comentário público desta matéria.' using errcode='22023'; end if;
    end if;
    perform private.rate_limit(u,'comment',5,600);
    st:=case when s.premoderation then 'pending' else 'approved' end;
    insert into public.comments(article_id,author_id,parent_id,display_name,team_badge,body,status)
      values(a.id,u,parent.id,nm,private.has_role(array['journalist','editor','moderator']),txt,st) returning id into cid;
  elsif act in ('comment.edit','comment.remove') then
    select * into c from public.comments where id=cid for update;
    if c.id is null or c.author_id is distinct from u then raise exception 'Você só pode gerenciar seus comentários.' using errcode='42501'; end if;
    if (d->>'version')::integer is distinct from c.version then raise exception 'O comentário foi atualizado. Recarregue.' using errcode='40001'; end if;
    if act='comment.edit' then
      if now()>c.created_at+interval '15 minutes' or c.status not in ('pending','approved') or char_length(txt) not between 1 and 2000 then raise exception 'A edição está indisponível ou o texto é inválido.' using errcode='22023'; end if;
      if exists(select 1 from private.suspensions where user_id=u and until_at>now()) or not private.article_public(c.article_id)
       or not exists(select 1 from public.articles where id=c.article_id and comments_open)
       or not exists(select 1 from public.site_settings where id and comments_enabled and moderation_ready) then raise exception 'Edição indisponível.' using errcode='42501'; end if;
      perform private.rate_limit(u,'comment.edit',10,600);
      update public.comments set body=txt,status='pending',edited_at=now(),version=version+1 where id=cid; st:='pending';
    else update public.comments set body='',display_name='Comentário removido',status='removed',version=version+1 where id=cid; st:='removed'; end if;
  elsif act='comment.report' then
    if not exists(select 1 from public.comments where id=cid and status='approved' and private.article_public(article_id)) then raise exception 'Comentário indisponível.' using errcode='P0002'; end if;
    if char_length(coalesce(d->>'reason','')) not between 3 and 500 then raise exception 'Informe o motivo.' using errcode='22023'; end if;
    if exists(select 1 from private.comment_reports where comment_id=cid and reporter_id=u) then return jsonb_build_object('id',cid,'status','reported'); end if;
    perform private.rate_limit(u,'report',10,3600);
    insert into private.comment_reports(comment_id,reporter_id,reason) values(cid,u,d->>'reason'); st:='reported';
  else raise exception 'Operação inválida.' using errcode='22023'; end if;
  return jsonb_build_object('id',cid,'status',st);
end $$;

create function private.moderate(d jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=private.actor(); c public.comments; decision text:=d->>'decision'; reason text:=btrim(coalesce(d->>'reason','')); begin
  if not private.has_role(array['moderator']) then raise exception 'Sem permissão de moderação.' using errcode='42501'; end if;
  if char_length(reason) not between 3 and 500 then raise exception 'Registre um motivo de 3 a 500 caracteres.' using errcode='22023'; end if;
  select * into c from public.comments where id=(d->>'id')::uuid for update;
  if c.id is null then raise exception 'Comentário inexistente.' using errcode='P0002'; end if;
  if (d->>'version')::integer is distinct from c.version then raise exception 'Comentário alterado. Recarregue a fila.' using errcode='40001'; end if;
  if decision not in ('approve','reject','remove','suspend','dismiss') then raise exception 'Decisão inválida.' using errcode='22023'; end if;
  if decision='approve' and (c.status='removed' or not private.article_public(c.article_id)
   or not exists(select 1 from public.articles where id=c.article_id and comments_open)
   or not exists(select 1 from public.site_settings where id and comments_enabled and moderation_ready)) then raise exception 'Não é possível aprovar este comentário.' using errcode='22023'; end if;
  if decision='suspend' then
    if c.author_id is null or exists(select 1 from private.user_roles where user_id=c.author_id and role='admin') then raise exception 'Suspensão indisponível.' using errcode='42501'; end if;
    insert into private.suspensions values(c.author_id,now()+interval '7 days',reason) on conflict(user_id) do update set until_at=excluded.until_at,reason=excluded.reason;
  elsif decision<>'dismiss' then
    update public.comments set status=case decision when 'approve' then 'approved' when 'reject' then 'rejected' else 'removed' end,
      body=case when decision='remove' then '' else body end,version=version+1 where id=c.id;
  end if;
  update private.comment_reports set resolved=true,resolved_at=now() where comment_id=c.id;
  -- Comment bodies are deliberately excluded from the moderation audit.
  insert into private.audit_log(actor_id,action,entity_id,reason) values(u,'moderation.'||decision,c.id,reason);
  return jsonb_build_object('id',c.id);
end $$;

create function private.manage(act text,d jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=private.actor(); rid uuid:=nullif(d->>'id','')::uuid; old_data jsonb; v integer; target text; role_name text;
begin
  if act='settings' then
    if not private.has_role(array['admin']) then raise exception 'Acesso de administrador necessário.' using errcode='42501'; end if;
    if coalesce((d->>'comments_enabled')::boolean,false) and not coalesce((d->>'moderation_ready')::boolean,false) then raise exception 'Confirme a operação de moderação antes de abrir comentários.' using errcode='22023'; end if;
    update public.site_settings set comments_enabled=(d->>'comments_enabled')::boolean,moderation_ready=(d->>'moderation_ready')::boolean,premoderation=(d->>'premoderation')::boolean,readers_enabled=(d->>'readers_enabled')::boolean,updated_at=now() where id;
  elsif act='role' then
    if not private.has_role(array['admin']) or (d->>'user_id')::uuid=u then raise exception 'Não é permitido alterar seus próprios privilégios.' using errcode='42501'; end if;
    role_name:=d->>'role';
    if coalesce((d->>'grant')::boolean,false) then insert into private.user_roles(user_id,role,granted_by) values((d->>'user_id')::uuid,role_name,u) on conflict do nothing;
    else delete from private.user_roles where user_id=(d->>'user_id')::uuid and role=role_name; end if;
    rid:=(d->>'user_id')::uuid;
  elsif act='correction.resolve' then
    if not private.has_role(array['editor']) then raise exception 'Permissão editorial necessária.' using errcode='42501'; end if;
    if d->>'status' not in ('accepted','rejected') or char_length(coalesce(d->>'reason',''))<3 then raise exception 'Informe decisão e motivo.' using errcode='22023'; end if;
    update private.corrections set status=d->>'status',resolved_at=now() where id=rid;
    if not found then raise exception 'Sugestão inexistente.' using errcode='P0002'; end if;
  else
    if not private.has_role(array['editor']) then raise exception 'Permissão editorial necessária.' using errcode='42501'; end if;
    target:=case act when 'edition' then 'editions' when 'session' then 'sessions' when 'update' then 'session_updates' when 'document' then 'documents' when 'announcement' then 'announcements' else null end;
    if target is null then raise exception 'Operação inválida.' using errcode='22023'; end if;
    if rid is not null then
      execute format('select to_jsonb(t) from public.%I t where id=$1 for update',target) into old_data using rid;
      if old_data is null then raise exception 'Registro inexistente.' using errcode='P0002'; end if;
      if (d->>'version')::integer is distinct from (old_data->>'version')::integer then raise exception 'Registro atualizado por outra pessoa. Recarregue.' using errcode='40001'; end if;
    else rid:=gen_random_uuid(); end if;
    v:=coalesce((old_data->>'version')::integer,0)+1;
    if act='edition' then
      insert into public.editions(id,slug,title,year,published,version) values(rid,d->>'slug',d->>'title',(d->>'year')::integer,(d->>'published')::boolean,v)
      on conflict(id) do update set title=excluded.title,year=excluded.year,published=excluded.published,version=excluded.version,updated_at=now();
    elsif act='session' then
      insert into public.sessions(id,edition_id,category,title,starts_at,ends_at,location,location_public,status,summary,published,version)
      values(rid,(d->>'edition_id')::uuid,d->>'category',d->>'title',(d->>'starts_at')::timestamptz,(d->>'ends_at')::timestamptz,coalesce(d->>'location',''),coalesce((d->>'location_public')::boolean,false),coalesce(d->>'status','scheduled'),coalesce(d->>'summary',''),coalesce((d->>'published')::boolean,false),v)
      on conflict(id) do update set edition_id=excluded.edition_id,category=excluded.category,title=excluded.title,starts_at=excluded.starts_at,ends_at=excluded.ends_at,location=excluded.location,location_public=excluded.location_public,status=excluded.status,summary=excluded.summary,published=excluded.published,version=excluded.version,updated_at=now();
    elsif act='update' then
      if not exists(select 1 from public.sessions where id=(d->>'session_id')::uuid) then raise exception 'Sessão inexistente.' using errcode='22023'; end if;
      if nullif(d->>'article_id','') is not null and not private.article_public((d->>'article_id')::uuid) then raise exception 'Vincule apenas matéria publicada.' using errcode='22023'; end if;
      insert into public.session_updates(id,session_id,body,author,author_id,article_id,result,organization_confirmed,correction_note,published,version)
      values(rid,(d->>'session_id')::uuid,d->>'body',d->>'author',u,nullif(d->>'article_id','')::uuid,coalesce((d->>'result')::boolean,false),coalesce((d->>'organization_confirmed')::boolean,false),coalesce(d->>'correction_note',''),coalesce((d->>'published')::boolean,false),v)
      on conflict(id) do update set body=excluded.body,article_id=excluded.article_id,result=excluded.result,organization_confirmed=excluded.organization_confirmed,correction_note=excluded.correction_note,published=excluded.published,version=excluded.version,updated_at=now();
    elsif act='document' then
      if not exists(select 1 from public.media_assets where id=(d->>'asset_id')::uuid and bucket='sis-documents') then raise exception 'Envie um PDF validado.' using errcode='22023'; end if;
      insert into public.documents(id,edition_id,category,title,description,kind,document_version,responsible,asset_id,audience,published,organization_confirmed,version)
      values(rid,(d->>'edition_id')::uuid,nullif(d->>'category',''),d->>'title',coalesce(d->>'description',''),d->>'kind',d->>'document_version',d->>'responsible',(d->>'asset_id')::uuid,coalesce(d->>'audience','restricted'),coalesce((d->>'published')::boolean,false),coalesce((d->>'organization_confirmed')::boolean,false),v)
      on conflict(id) do update set edition_id=excluded.edition_id,category=excluded.category,title=excluded.title,description=excluded.description,kind=excluded.kind,document_version=excluded.document_version,responsible=excluded.responsible,asset_id=excluded.asset_id,audience=excluded.audience,published=excluded.published,organization_confirmed=excluded.organization_confirmed,version=excluded.version,updated_at=now();
    elsif act='announcement' then
      insert into public.announcements(id,edition_id,title,body,published,version) values(rid,(d->>'edition_id')::uuid,d->>'title',d->>'body',coalesce((d->>'published')::boolean,false),v)
      on conflict(id) do update set title=excluded.title,body=excluded.body,published=excluded.published,version=excluded.version,updated_at=now();
    end if;
    execute format('select to_jsonb(t) from public.%I t where id=$1',target) into d using rid;
  end if;
  insert into private.audit_log(actor_id,action,entity_id,reason,before_data,after_data) values(u,act,rid,coalesce(d->>'reason',''),old_data,d);
  return jsonb_build_object('id',rid,'version',v);
end $$;

create function private.mutate(act text,d jsonb,operation uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=private.actor(); result jsonb; aid uuid; begin
  if operation is null or octet_length(d::text)>300000 then raise exception 'Operação inválida.' using errcode='22023'; end if;
  -- Serializes retries across Vercel instances; only committed successes are reused.
  perform pg_advisory_xact_lock(hashtextextended(u::text||operation::text,0));
  select o.result into result from private.operations o where user_id=u and operation_id=operation and action=act;
  if found then return result; end if;
  if act='article.save' then result:=private.save_article(d);
  elsif act like 'comment.%' then result:=private.comment_action(act,d);
  elsif act='moderate' then result:=private.moderate(d);
  elsif act='profile' then
    insert into public.reader_profiles(id,display_name) values(u,btrim(d->>'display_name')) on conflict(id) do update set display_name=excluded.display_name,updated_at=now(); result:='{}';
  elsif act='bookmark' then
    aid:=(d->>'article_id')::uuid;
    if coalesce((d->>'saved')::boolean,false) then
      if not private.article_public(aid) then raise exception 'Matéria indisponível.' using errcode='P0002'; end if;
      insert into public.bookmarks values(u,aid,now()) on conflict do nothing;
    else delete from public.bookmarks where user_id=u and article_id=aid; end if; result:='{}';
  elsif act='correction' then
    aid:=(d->>'article_id')::uuid;
    if not private.article_public(aid) then raise exception 'Matéria indisponível.' using errcode='P0002'; end if;
    perform private.rate_limit(u,'correction',5,3600);
    insert into private.corrections(article_id,author_id,body) values(aid,u,btrim(d->>'body')); result:='{}';
  elsif act='upload.reserve' then
    if not private.has_role(array['journalist','editor']) then raise exception 'Sem permissão para upload.' using errcode='42501'; end if;
    perform private.rate_limit(u,'upload',15,3600); result:='{}';
  elsif act='account.erase' then
    if d->>'confirmation' is distinct from 'APAGAR MINHAS CONTRIBUIÇÕES' then raise exception 'Confirme a remoção das suas contribuições.' using errcode='22023'; end if;
    update public.comments set body='',display_name='Comentário removido',status='removed',author_id=null,version=version+1 where author_id=u;
    delete from public.reader_profiles where id=u;
    delete from public.bookmarks where user_id=u;
    delete from private.corrections where author_id=u;
    delete from private.comment_reports where reporter_id=u;
    result:='{}';
  else result:=private.manage(act,d); end if;
  insert into private.operations(user_id,operation_id,action,result) values(u,operation,act,result);
  return result;
end $$;

create function private.access() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare u uuid:=auth.uid(); begin
 if u is null or not private.is_member() then return jsonb_build_object('user_id',null,'roles','[]'::jsonb); end if;
 return jsonb_build_object('user_id',u,'verified',exists(select 1 from auth.users where id=u and email_confirmed_at is not null and not is_anonymous),
 'roles',coalesce((select jsonb_agg(role) from private.user_roles where user_id=u),'[]'),
 'display_name',(select display_name from public.reader_profiles where id=u),'suspended',exists(select 1 from private.suspensions where user_id=u and until_at>now()));
end $$;
create function private.dashboard(kind text,pg integer,query text) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare u uuid:=private.actor(); result jsonb; begin
 if pg not between 1 and 10000 or char_length(query)>100 then raise exception 'Consulta inválida.' using errcode='22023'; end if;
 if kind in ('pending','reported') then
  if not private.has_role(array['moderator']) then raise exception 'Sem permissão de moderação.' using errcode='42501'; end if;
  select coalesce(jsonb_agg(t),'[]') into result from (select c.*,a.title article_title,a.slug article_slug,
   (select coalesce(jsonb_agg(jsonb_build_object('reason',r.reason,'created_at',r.created_at)),'[]') from private.comment_reports r where r.comment_id=c.id and not r.resolved) reports
   from public.comments c join public.articles a on a.id=c.article_id
   where (dashboard.kind='pending' and c.status='pending') or (dashboard.kind='reported' and exists(select 1 from private.comment_reports where comment_id=c.id and not resolved))
   order by c.created_at limit 20 offset (pg-1)*20)t;
 elsif kind='corrections' then
  if not private.has_role(array['editor']) then raise exception 'Sem permissão editorial.' using errcode='42501'; end if;
  select coalesce(jsonb_agg(t),'[]') into result from (select c.id,c.body,c.status,c.created_at,a.title,a.slug from private.corrections c join public.articles a on a.id=c.article_id where c.status='pending' order by c.created_at limit 20 offset (pg-1)*20)t;
 elsif kind='audit' then
  if not private.has_role(array['editor','moderator']) then raise exception 'Sem permissão.' using errcode='42501'; end if;
  select coalesce(jsonb_agg(t),'[]') into result from (select id,actor_id,action,entity_id,reason,created_at from private.audit_log where
   (private.has_role(array['editor']) and action not like 'moderation.%') or (private.has_role(array['moderator']) and action like 'moderation.%') order by created_at desc limit 30 offset (pg-1)*30)t;
 elsif kind='roles' then
  if not private.has_role(array['admin']) then raise exception 'Sem permissão.' using errcode='42501'; end if;
  select coalesce(jsonb_agg(t),'[]') into result from (select r.user_id,r.role,r.granted_at,p.display_name from private.user_roles r left join public.reader_profiles p on p.id=r.user_id order by r.granted_at limit 50 offset (pg-1)*50)t;
 elsif kind='sessions' then
  if not private.has_role(array['editor']) then raise exception 'Sem permissão.' using errcode='42501'; end if;
  select coalesce(jsonb_agg(t),'[]') into result from (select * from public.sessions order by starts_at desc limit 30 offset (pg-1)*30)t;
 elsif kind='history' then
  if not private.has_role(array['journalist','editor']) then raise exception 'Sem permissão.' using errcode='42501'; end if;
  select coalesce(jsonb_agg(t),'[]') into result from (select l.id,l.actor_id,l.action,l.created_at,l.reason,l.before_data,l.after_data from private.audit_log l join public.articles a on a.id=l.entity_id
   where a.id=nullif(query,'')::uuid and (private.has_role(array['editor']) or a.author_id=u) order by l.created_at desc limit 10 offset (pg-1)*10)t;
 else raise exception 'Consulta inválida.' using errcode='22023'; end if;
 return result;
end $$;

-- Exposed wrappers are invokers; privileged implementation lives in unexposed private.
create function public.sis_access() returns jsonb language sql stable security invoker set search_path='' as $$ select private.access() $$;
create function public.sis_mutate(act text,d jsonb,operation uuid) returns jsonb language sql security invoker set search_path='' as $$ select private.mutate(act,d,operation) $$;
create function public.sis_dashboard(kind text,pg integer default 1,query text default '') returns jsonb language sql stable security invoker set search_path='' as $$ select private.dashboard(kind,pg,query) $$;
create function public.sis_search(q text default '',committee text default '',from_date timestamptz default null,to_date timestamptz default null,edition uuid default null,pg integer default 1,per_page integer default 12)
returns table(id uuid,slug text,title text,subtitle text,category text,author text,published_at timestamptz,updated_at timestamptz,reading_time text,cover_image text,featured boolean,kind text,tags text[],edition_id uuid,total bigint)
language sql stable security invoker set search_path='' as $$
 select a.id,a.slug,a.title,a.subtitle,a.category,a.author,a.published_at,a.updated_at,a.reading_time,a.cover_image,a.featured,a.kind,a.tags,a.edition_id,count(*) over()
 from public.articles a where char_length(q)<=100 and pg between 1 and 10000 and per_page between 1 and 30
  and a.status='published' and a.published_at<=now() and (committee='' or a.category=committee)
  and (from_date is null or a.published_at>=from_date) and (to_date is null or a.published_at<to_date)
  and (edition is null or a.edition_id=edition) and (q='' or a.search_vector@@websearch_to_tsquery('portuguese',private.normalize_text(q)))
 order by case when q<>'' then ts_rank_cd(a.search_vector,websearch_to_tsquery('portuguese',private.normalize_text(q))) end desc,a.published_at desc,a.id
 limit least(greatest(per_page,1),30) offset (least(greatest(pg,1),10000)-1)*least(greatest(per_page,1),30)
$$;
create function private.public_location(session_id uuid) returns text language sql stable security definer set search_path='' as $$
 select location from public.sessions where id=session_id and published and location_public
$$;
create function public.sis_public_location(session_id uuid) returns text language sql stable security invoker set search_path='' as $$ select private.public_location(session_id) $$;
create function private.account_export() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare u uuid:=private.actor(); begin return jsonb_build_object(
 'profile',(select to_jsonb(p) from public.reader_profiles p where id=u),
 'comments',coalesce((select jsonb_agg(c) from (select id,article_id,parent_id,body,status,created_at,edited_at from public.comments where author_id=u)c),'[]'),
 'bookmarks',coalesce((select jsonb_agg(b) from (select article_id,created_at from public.bookmarks where user_id=u)b),'[]'),
 'corrections',coalesce((select jsonb_agg(c) from (select article_id,body,status,created_at from private.corrections where author_id=u)c),'[]'));
end $$;
create function public.sis_account_export() returns jsonb language sql stable security invoker set search_path='' as $$ select private.account_export() $$;
create function private.retention_cleanup() returns void language plpgsql security definer set search_path='' as $$ begin
 delete from private.operations where created_at<now()-interval '30 days';
 delete from private.rate_limits where window_started<now()-interval '30 days';
 delete from private.comment_reports where resolved and resolved_at<now()-interval '180 days';
 delete from private.corrections where status<>'pending' and resolved_at<now()-interval '180 days';
 delete from private.audit_log where action like 'moderation.%' and created_at<now()-interval '180 days';
end $$;
create function public.sis_retention_cleanup() returns void language sql security invoker set search_path='' as $$ select private.retention_cleanup() $$;
revoke all on all functions in schema private from public,anon,authenticated;
revoke all on all functions in schema public from public,anon,authenticated;
grant execute on function private.has_role(text[]),private.article_public(uuid),private.asset_visible(uuid),private.access() to anon,authenticated;
grant execute on function private.public_location(uuid),public.sis_public_location(uuid) to anon,authenticated;
grant execute on function private.is_member() to anon,authenticated;
grant execute on function private.normalize_text(text) to anon,authenticated;
grant execute on function private.account_export(),public.sis_account_export() to authenticated;
grant execute on function private.retention_cleanup(),public.sis_retention_cleanup() to service_role;
grant execute on function private.mutate(text,jsonb,uuid),private.dashboard(text,integer,text) to authenticated;
grant execute on function public.sis_access(),public.sis_search(text,text,timestamptz,timestamptz,uuid,integer,integer) to anon,authenticated;
grant execute on function public.sis_mutate(text,jsonb,uuid),public.sis_dashboard(text,integer,text) to authenticated;
notify pgrst,'reload schema';
commit;
