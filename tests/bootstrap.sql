-- Isolated PostgreSQL test harness. Never run against a hosted project.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create schema storage;
create table auth.users(id uuid primary key,created_at timestamptz default now(),email_confirmed_at timestamptz,is_anonymous boolean default false,email text);
create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id));
create function auth.uid() returns uuid language sql stable as $$ select (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid $$;
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}') $$;
grant usage on schema auth to anon,authenticated;
grant execute on all functions in schema auth to anon,authenticated;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
alter table storage.objects enable row level security;
grant usage on schema storage to anon,authenticated;
grant select,insert,update,delete on storage.objects to anon,authenticated;
insert into storage.buckets values('article-images','article-images',true,null,null);
create table public.articles (
 id uuid primary key default gen_random_uuid(),slug text unique not null,title text not null,subtitle text not null,
 category text not null check(category in ('juridico','csnu','historico')),author text not null,published_at date not null,
 reading_time text not null,cover_image text not null,content jsonb not null,featured boolean not null default false,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
insert into auth.users(id,created_at,email_confirmed_at) values
 ('00000000-0000-4000-8000-000000000001','2026-05-14','2026-05-14'),
 ('00000000-0000-4000-8000-000000000002','2026-05-28','2026-05-28'),
 ('00000000-0000-4000-8000-000000000003','2026-05-28','2026-05-28');
