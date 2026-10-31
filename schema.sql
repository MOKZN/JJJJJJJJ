-- Supabase SQL Editor에서 한 번 실행. 기존 동일 이름의 테이블/함수가 없는 새 프로젝트 권장.
create extension if not exists pgcrypto;
create table if not exists public.participants (
 token uuid primary key default gen_random_uuid(), grp text not null check(grp in ('A','B')),
 stage int not null default 1 check(stage between 1 and 4),
 started_at timestamptz not null default now(), viewed_at timestamptz, finished_at timestamptz,
 view_seconds integer, answers jsonb not null default '{}'::jsonb
);
create table if not exists public.study_admins (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.participants enable row level security;
alter table public.study_admins enable row level security;
revoke all on public.participants from anon, authenticated;
revoke all on public.study_admins from anon, authenticated;
create or replace function public.study_start() returns jsonb language plpgsql security definer set search_path = '' as $$
declare a bigint; b bigint; g text; t uuid;
begin
 perform pg_catalog.pg_advisory_xact_lock(991817);
 select count(*) filter (where grp='A'), count(*) filter (where grp='B') into a,b from public.participants;
 g := case when a<b then 'A' when b<a then 'B' when random()<0.5 then 'A' else 'B' end;
 insert into public.participants(grp) values(g) returning token into t;
 return jsonb_build_object('token',t,'grp',g,'stage',1);
end $$;
create or replace function public.study_status(p_token uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
declare p public.participants%rowtype;
begin
 select * into p from public.participants where token=p_token;
 if not found then return jsonb_build_object('stage',0); end if;
 return jsonb_build_object('stage',p.stage,'grp',p.grp,'token',p.token);
end $$;
create or replace function public.study_advance(p_token uuid,p_expected_stage int,p_payload jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare p public.participants%rowtype; i int; score int := 0; correct int[] := array[1,2,1,2,0]; v text; a jsonb := '{}'::jsonb;
begin
 select * into p from public.participants where token=p_token for update;
 if not found then raise exception 'Invalid participant'; end if;
 if p.stage<>p_expected_stage or p.stage not between 1 and 3 then raise exception 'Stage already completed or invalid'; end if;
 if p.stage=1 then
   if jsonb_typeof(p_payload->'elapsed')<>'number' or (p_payload->>'elapsed')::numeric not between 0 and 3600 then raise exception 'Invalid elapsed'; end if;
   update public.participants set stage=2,viewed_at=now(),view_seconds=(p_payload->>'elapsed')::int where token=p_token;
 elsif p.stage=2 then
   for i in 0..4 loop
     v := p_payload->>('q'||i);
     if v is null or v not in ('0','1','2','3') then raise exception 'Invalid recall response'; end if;
     a := a || jsonb_build_object('q'||i,v::int);
     if v::int=correct[i+1] then score:=score+1; end if;
   end loop;
   a := a || jsonb_build_object('score',score);
   update public.participants set stage=3,answers=answers||a where token=p_token;
 else
   for i in 1..8 loop
     v := p_payload->>('j'||i);
     if v is null or v not in ('1','2','3','4','5') then raise exception 'Invalid scale response'; end if;
     a := a || jsonb_build_object('j'||i,v::int);
   end loop;
   update public.participants set stage=4,finished_at=now(),answers=answers||a where token=p_token;
 end if;
 return jsonb_build_object('stage',p.stage+1);
end $$;
create or replace function public.study_admin_export() returns table(token uuid,grp text,stage int,started_at timestamptz,viewed_at timestamptz,finished_at timestamptz,view_seconds int,answers jsonb)
language plpgsql security definer set search_path = '' as $$
begin
 if auth.uid() is null or not exists(select 1 from public.study_admins where user_id=auth.uid()) then raise exception 'Not authorized'; end if;
 return query select p.token,p.grp,p.stage,p.started_at,p.viewed_at,p.finished_at,p.view_seconds,p.answers from public.participants p order by p.started_at;
end $$;
revoke execute on function public.study_start() from public;
revoke execute on function public.study_status(uuid) from public;
revoke execute on function public.study_advance(uuid,int,jsonb) from public;
revoke execute on function public.study_admin_export() from public;
grant execute on function public.study_start() to anon,authenticated;
grant execute on function public.study_status(uuid) to anon,authenticated;
grant execute on function public.study_advance(uuid,int,jsonb) to anon,authenticated;
grant execute on function public.study_admin_export() to authenticated;
