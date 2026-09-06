begin;
-- Enable only after a production SMTP provider has been connected and tested.
create table private.auth_settings (id boolean primary key default true check(id), email_otp_required boolean not null default false);
insert into private.auth_settings(id) values(true);
alter table private.auth_settings enable row level security;
revoke all on private.auth_settings from public,anon,authenticated;
-- Application-level email step-up, not Supabase AAL2. Both factors can be required
-- by Postgres, including direct Data API calls. No service key reaches the client.
create table private.email_otp_requests (
 user_id uuid primary key references auth.users(id) on delete cascade,
 session_id uuid not null references auth.sessions(id) on delete cascade,
 email text not null, nonce_hash bytea not null,
 created_at timestamptz not null default clock_timestamp(),
 expires_at timestamptz not null,
 attempts integer not null default 0,
 attempt_id uuid
);
create table private.email_otp_sessions (
 session_id uuid primary key references auth.sessions(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 email text not null, verified_at timestamptz not null default clock_timestamp(),
 expires_at timestamptz not null
);
create index email_otp_requests_session_idx on private.email_otp_requests(session_id);
create index email_otp_sessions_user_idx on private.email_otp_sessions(user_id);
alter table private.email_otp_requests enable row level security;
alter table private.email_otp_sessions enable row level security;
revoke all on private.email_otp_requests,private.email_otp_sessions from public,anon,authenticated;

create function private.primary_session() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.users u join auth.sessions s on s.user_id=u.id
 where u.id=auth.uid() and u.email_confirmed_at is not null and not u.is_anonymous
 and s.id=nullif(auth.jwt()->>'session_id','')::uuid)
 and exists(select 1 from jsonb_array_elements(coalesce(auth.jwt()->'amr','[]')) m
 where m->>'method' in ('password','oauth'))
$$;
create function private.email_otp_verified() returns boolean language sql stable security definer set search_path='' as $$
 select private.primary_session() and exists(
 select 1 from private.email_otp_sessions v join auth.users u on u.id=v.user_id
 where v.user_id=auth.uid() and v.session_id=nullif(auth.jwt()->>'session_id','')::uuid
 and v.email=lower(u.email) and v.expires_at>now())
$$;
create or replace function private.is_member() returns boolean language sql stable security definer set search_path='' as $$
 select private.primary_session() and ((select not email_otp_required from private.auth_settings where id) or private.email_otp_verified())
$$;
create or replace function private.has_role(wanted text[]) returns boolean language sql stable security definer set search_path='' as $$
 select private.is_member() and exists(select 1 from private.user_roles
 where user_id=auth.uid() and (role='admin' or role=any(wanted)))
$$;
create or replace function private.actor() returns uuid language plpgsql stable security definer set search_path='' as $$
 begin
 if not private.is_member() then raise exception 'Entre com senha ou Google e confirme o código enviado por email.' using errcode='42501'; end if;
 return auth.uid();
 end
$$;
create or replace function private.access() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare u uuid:=auth.uid(); verified boolean:=private.is_member(); begin
 if u is null or not exists(select 1 from auth.sessions where user_id=u and id=nullif(auth.jwt()->>'session_id','')::uuid)
 then return jsonb_build_object('user_id',null,'roles','[]'::jsonb); end if;
 return jsonb_build_object('user_id',u,'verified',verified,'primary_valid',private.primary_session(),
 'email_otp_verified',private.email_otp_verified(),
 'roles',case when verified then coalesce((select jsonb_agg(role) from private.user_roles where user_id=u),'[]') else '[]'::jsonb end,
 'display_name',case when verified then (select display_name from public.reader_profiles where id=u) end,
 'suspended',case when verified then exists(select 1 from private.suspensions where user_id=u and until_at>now()) else false end);
end $$;

create function private.email_otp_begin(nonce text) returns void language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); begin
 if not private.primary_session() then raise exception 'Entre primeiro com email e senha ou Google.' using errcode='42501'; end if;
 if length(nonce)<>64 or nonce !~ '^[a-f0-9]+$' then raise exception 'Solicitação inválida.' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text||':email-otp',0));
 perform private.rate_limit(u,'email-otp-minute',1,60);
 perform private.rate_limit(u,'email-otp-hour',5,3600);
 insert into private.email_otp_requests(user_id,session_id,email,nonce_hash,expires_at)
 select u,nullif(auth.jwt()->>'session_id','')::uuid,lower(email),sha256(convert_to(nonce,'UTF8')),clock_timestamp()+interval '5 minutes'
 from auth.users where id=u
 on conflict(user_id) do update set session_id=excluded.session_id,email=excluded.email,nonce_hash=excluded.nonce_hash,
 created_at=clock_timestamp(),expires_at=excluded.expires_at,attempts=0,attempt_id=null;
end $$;

create function private.email_otp_attempt(nonce text,attempt uuid) returns boolean language plpgsql security definer set search_path='' as $$
declare found_user uuid; begin
 if not private.primary_session() then return false; end if;
 update private.email_otp_requests set attempts=attempts+1,attempt_id=attempt
 where user_id=auth.uid() and session_id=nullif(auth.jwt()->>'session_id','')::uuid
 and nonce_hash=sha256(convert_to(nonce,'UTF8')) and expires_at>clock_timestamp() and attempts<5
 returning user_id into found_user;
 return found_user is not null;
end $$;

create function private.email_otp_complete(nonce text,attempt uuid) returns boolean language plpgsql security definer set search_path='' as $$
declare challenge private.email_otp_requests; begin
 select * into challenge from private.email_otp_requests where user_id=auth.uid()
 and nonce_hash=sha256(convert_to(nonce,'UTF8')) and attempt_id=attempt for update;
 if not found or challenge.expires_at<=clock_timestamp() or challenge.attempts not between 1 and 5 then return false; end if;
 -- Only a newly verified email OTP session can attest the second step.
 if nullif(auth.jwt()->>'session_id','')::uuid=challenge.session_id
 or not exists(select 1 from jsonb_array_elements(coalesce(auth.jwt()->'amr','[]')) m
 where m->>'method'='otp' and (m->>'timestamp')::numeric >= extract(epoch from challenge.created_at)-1)
 or not exists(select 1 from auth.users u join auth.sessions s on s.user_id=u.id where u.id=auth.uid()
 and lower(u.email)=challenge.email and u.email_confirmed_at is not null and not u.is_anonymous
 and s.id=nullif(auth.jwt()->>'session_id','')::uuid)
 or not exists(select 1 from auth.sessions where id=challenge.session_id and user_id=auth.uid()) then return false; end if;
 insert into private.email_otp_sessions(session_id,user_id,email,expires_at)
 values(challenge.session_id,challenge.user_id,challenge.email,clock_timestamp()+interval '12 hours')
 on conflict(session_id) do update set email=excluded.email,verified_at=clock_timestamp(),expires_at=excluded.expires_at;
 delete from private.email_otp_requests where user_id=auth.uid();
 return true;
end $$;

create function public.sis_email_otp_begin(nonce text) returns void language sql security invoker set search_path='' as $$ select private.email_otp_begin(nonce) $$;
create function public.sis_email_otp_attempt(nonce text,attempt uuid) returns boolean language sql security invoker set search_path='' as $$ select private.email_otp_attempt(nonce,attempt) $$;
create function public.sis_email_otp_complete(nonce text,attempt uuid) returns boolean language sql security invoker set search_path='' as $$ select private.email_otp_complete(nonce,attempt) $$;
revoke all on function private.primary_session(),private.email_otp_begin(text),private.email_otp_attempt(text,uuid),private.email_otp_complete(text,uuid),public.sis_email_otp_begin(text),public.sis_email_otp_attempt(text,uuid),public.sis_email_otp_complete(text,uuid) from public,anon;
grant execute on function private.primary_session(),private.email_otp_begin(text),private.email_otp_attempt(text,uuid),private.email_otp_complete(text,uuid),public.sis_email_otp_begin(text),public.sis_email_otp_attempt(text,uuid),public.sis_email_otp_complete(text,uuid) to authenticated;

-- Keep the single event relationship internally; stop exposing edition management.
alter function private.manage(text,jsonb) rename to manage_before_single_event;
revoke all on function private.manage_before_single_event(text,jsonb) from public,anon,authenticated;
create function private.manage(act text,d jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 perform private.actor();
 if act='edition' then raise exception 'O SIS utiliza somente o evento de 2026.' using errcode='22023'; end if;
 if act in ('session','document','announcement') then
 d:=d||jsonb_build_object('edition_id',(select id from public.editions where slug='2026'));
 end if;
 return private.manage_before_single_event(act,d);
end $$;
update public.site_settings set readers_enabled=true,updated_at=now() where id;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('sis-avatars','sis-avatars',false,4194304,array['image/webp']);
create policy avatar_own_read on storage.objects for select to authenticated
using(bucket_id='sis-avatars' and name=(select auth.uid())::text||'/avatar.webp' and (select private.is_member()));
create function private.avatar_reserve() returns void language plpgsql security definer set search_path='' as $$
begin perform private.rate_limit(private.actor(),'avatar-upload',10,3600); end $$;
create function public.sis_avatar_reserve() returns void language sql security invoker set search_path='' as $$ select private.avatar_reserve() $$;
revoke all on function private.avatar_reserve(),public.sis_avatar_reserve() from public,anon;
grant execute on function private.avatar_reserve(),public.sis_avatar_reserve() to authenticated;
create or replace function private.retention_cleanup() returns void language plpgsql security definer set search_path='' as $$ begin
 delete from private.email_otp_requests where expires_at<now();
 delete from private.email_otp_sessions where expires_at<now();
 delete from private.operations where created_at<now()-interval '30 days';
 delete from private.rate_limits where window_started<now()-interval '30 days';
 delete from private.comment_reports where resolved and resolved_at<now()-interval '180 days';
 delete from private.corrections where status<>'pending' and resolved_at<now()-interval '180 days';
 delete from private.audit_log where action like 'moderation.%' and created_at<now()-interval '180 days';
end $$;
commit;
