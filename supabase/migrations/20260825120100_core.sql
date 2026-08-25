-- Casa (household) i perfils. Tot l'aïllament de dades penja de household_id.

create table public.households (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (length(btrim(name)) between 1 and 80),
  -- Codi curt per convidar la família. Es regenera des de l'app si es filtra.
  invite_code  text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_at   timestamptz not null default now()
);

create type public.member_role as enum ('admin', 'member');

create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  household_id  uuid references public.households (id) on delete set null,
  display_name  text not null check (length(btrim(display_name)) between 1 and 60),
  role          public.member_role not null default 'member',
  avatar_url    text,
  created_at    timestamptz not null default now()
);

-- Índex obligatori: household_id s'avalua a cada política de RLS de tota la BD.
create index profiles_household_id_idx on public.profiles (household_id);

-- ---------------------------------------------------------------------------
-- Helpers de RLS
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER a posta: llegeixen public.profiles saltant-se'n la RLS, cosa
-- que evita la recursió infinita "per llegir el perfil cal saber el perfil".
-- Duen check explícit d'auth.uid() a dins i no s'atorga EXECUTE a anon.

create or replace function private.current_household_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.household_id
  from public.profiles p
  where p.id = (select auth.uid())
$$;

create or replace function private.is_household_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
      and p.household_id is not null
  )
$$;

revoke execute on function private.current_household_id() from public, anon;
revoke execute on function private.is_household_admin()   from public, anon;
grant  execute on function private.current_household_id() to authenticated;
grant  execute on function private.is_household_admin()   to authenticated;

-- Les polítiques de RLS s'avaluen amb els permisos de qui consulta, encara que
-- la funció sigui SECURITY DEFINER: cal poder-la CRIDAR. Sense USAGE sobre
-- l'esquema, totes les polítiques fallarien amb "permission denied for schema private".
grant usage on schema private to authenticated;

-- ---------------------------------------------------------------------------
-- Alta d'usuari
-- ---------------------------------------------------------------------------
-- El perfil neix SENSE casa. L'app envia l'usuari a /benvinguda, on tria entre
-- crear-ne una o entrar-hi amb el codi d'invitació. Crear una casa per cada alta
-- separaria la família en tres inventaris sense que ningú se n'adonés.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    -- L'última alternativa no és paranoia: si algun dia s'activa l'entrada per
    -- telèfon, new.email és null, split_part retornaria null i l'alta petaria
    -- amb una violació de NOT NULL enmig del registre.
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Membre de la casa'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Crear o unir-se a una casa (RPC cridades des de /benvinguda)
-- ---------------------------------------------------------------------------
create or replace function public.create_household(p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid       uuid := (select auth.uid());
  v_household uuid;
begin
  if v_uid is null then
    raise exception 'no autenticat' using errcode = '42501';
  end if;

  if exists (select 1 from public.profiles p where p.id = v_uid and p.household_id is not null) then
    raise exception 'aquest usuari ja pertany a una casa' using errcode = '23505';
  end if;

  insert into public.households (name)
  values (coalesce(nullif(btrim(p_name), ''), 'Casa'))
  returning id into v_household;

  update public.profiles
     set household_id = v_household,
         role         = 'admin'
   where id = v_uid;

  return v_household;
end;
$$;

create or replace function public.join_household(p_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid       uuid := (select auth.uid());
  v_household uuid;
begin
  if v_uid is null then
    raise exception 'no autenticat' using errcode = '42501';
  end if;

  select h.id into v_household
  from public.households h
  where h.invite_code = upper(btrim(p_invite_code));

  if v_household is null then
    raise exception 'codi d''invitació no vàlid' using errcode = 'P0002';
  end if;

  update public.profiles
     set household_id = v_household,
         role         = 'member'
   where id = v_uid
     and household_id is null;

  if not found then
    raise exception 'aquest usuari ja pertany a una casa' using errcode = '23505';
  end if;

  return v_household;
end;
$$;

revoke execute on function public.create_household(text) from public, anon;
revoke execute on function public.join_household(text)   from public, anon;
grant  execute on function public.create_household(text) to authenticated;
grant  execute on function public.join_household(text)   to authenticated;

-- El rol propi, per a la política d'UPDATE de profiles. Ha de ser SECURITY
-- DEFINER: si la política llegís public.profiles directament es tornaria a
-- avaluar la política de profiles i Postgres avortaria per recursió infinita.
create or replace function private.current_member_role()
returns public.member_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = (select auth.uid())
$$;

revoke execute on function private.current_member_role() from public, anon;
grant  execute on function private.current_member_role() to authenticated;
