-- Comptador de crides a la IA.
--
-- L'alta per foto té cost per crida. Sense límit, un bucle mal fet al client o
-- algú jugant amb el botó es converteix en una factura, i com que la clau viu al
-- servidor no hi ha cap altre lloc on aturar-ho.

create table public.ai_calls (
  id           bigint generated always as identity primary key,
  household_id uuid not null references public.households (id) on delete cascade,
  profile_id   uuid references public.profiles (id) on delete set null,
  kind         text not null default 'identify' check (length(kind) <= 40),
  created_at   timestamptz not null default now()
);

create index ai_calls_household_recent_idx on public.ai_calls (household_id, created_at desc);
create index ai_calls_profile_id_idx       on public.ai_calls (profile_id);

alter table public.ai_calls enable row level security;

-- Els permisos per defecte de Supabase donen accés a anon a cada taula nova;
-- cal treure'l explícitament a cada migració que en creï una.
revoke all on public.ai_calls from anon;
grant select on public.ai_calls to authenticated;

create policy ai_calls_select on public.ai_calls
  for select to authenticated
  using (household_id = (select private.current_household_id()));

-- L'apunt el fa aquesta funció i no un INSERT del client: si el client pogués
-- decidir si compta o no la crida, el límit no serviria de res.
create or replace function public.register_ai_call(p_kind text default 'identify', p_daily_limit int default 200)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid       uuid := (select auth.uid());
  v_household uuid;
  v_used      int;
begin
  select p.household_id into v_household
  from public.profiles p
  where p.id = v_uid;

  if v_household is null then
    raise exception 'aquest usuari encara no pertany a cap casa' using errcode = '42501';
  end if;

  select count(*) into v_used
  from public.ai_calls c
  where c.household_id = v_household
    and c.created_at >= now() - interval '24 hours';

  if v_used >= greatest(p_daily_limit, 1) then
    raise exception 'límit diari de crides a la IA exhaurit' using errcode = '54000';
  end if;

  insert into public.ai_calls (household_id, profile_id, kind)
  values (v_household, v_uid, p_kind);

  return v_used + 1;
end;
$$;

revoke execute on function public.register_ai_call(text, int) from public, anon;
grant  execute on function public.register_ai_call(text, int) to authenticated;
