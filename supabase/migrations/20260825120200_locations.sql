-- Ubicacions: arbre auto-referencial. Avui Armari > Porta > Prestatge > Caixa,
-- però l'estructura és recursiva, així que el traster o el maleter del cotxe hi
-- caben demà sense tocar l'esquema.

create type public.location_kind as enum ('armari', 'porta', 'modul', 'prestatge', 'caixa', 'altre');

create table public.locations (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  parent_id    uuid references public.locations (id) on delete cascade,
  kind         public.location_kind not null,
  name         text not null check (length(btrim(name)) between 1 and 80),
  -- Codi humà i contingut del QR: A2-P1-E3-C02. Es pot llegir en veu alta i
  -- verificar a ull si l'adhesiu es fa malbé.
  code         text not null check (code ~ '^[A-Z0-9][A-Z0-9-]{1,31}$'),
  position     int  not null default 0,
  color        text check (color ~ '^#[0-9a-fA-F]{6}$'),
  photo_url    text,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint locations_code_unique unique (household_id, code)
);

create index locations_parent_id_idx        on public.locations (parent_id);
create index locations_household_id_idx     on public.locations (household_id);
create index locations_household_order_idx  on public.locations (household_id, parent_id, position);

-- ---------------------------------------------------------------------------
-- Integritat de l'arbre
-- ---------------------------------------------------------------------------
-- Dues coses que la FK sola no cobreix: que el pare sigui de la mateixa casa
-- (si no, un moviment mal fet trencaria l'aïllament de RLS) i que ningú creï un
-- cicle en reassignar el pare, cosa que penjaria tota consulta recursiva.
create or replace function public.locations_check_tree()
returns trigger
language plpgsql
as $$
declare
  v_parent_household uuid;
  v_cursor           uuid;
  v_depth            int := 0;
begin
  if new.parent_id is null then
    return new;
  end if;

  if new.parent_id = new.id then
    raise exception 'una ubicació no pot ser pare d''ella mateixa';
  end if;

  select l.household_id into v_parent_household
  from public.locations l
  where l.id = new.parent_id;

  if v_parent_household is null then
    raise exception 'la ubicació pare no existeix';
  end if;

  if v_parent_household <> new.household_id then
    raise exception 'la ubicació pare pertany a una altra casa';
  end if;

  -- Puja per la cadena de pares buscant-se a si mateixa.
  v_cursor := new.parent_id;
  while v_cursor is not null loop
    v_depth := v_depth + 1;
    if v_cursor = new.id then
      raise exception 'aquest moviment crearia un cicle a l''arbre d''ubicacions';
    end if;
    if v_depth > 20 then
      raise exception 'arbre d''ubicacions massa profund (màxim 20 nivells)';
    end if;
    select l.parent_id into v_cursor from public.locations l where l.id = v_cursor;
  end loop;

  return new;
end;
$$;

create trigger locations_check_tree_trg
  before insert or update of parent_id, household_id on public.locations
  for each row execute function public.locations_check_tree();

-- updated_at automàtic, reutilitzat per items més endavant.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger locations_touch_updated_at
  before update on public.locations
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Camí complet: "Armari 2 · Porta 1 · Prestatge 3 · Caixa blava"
-- ---------------------------------------------------------------------------
-- security invoker a posta: la RLS de locations s'hi aplica, així que un usuari
-- no pot descobrir el camí d'una ubicació d'una altra casa passant-ne l'uuid.
create or replace function public.location_path(p_id uuid)
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  with recursive chain as (
    select l.id, l.parent_id, l.name, 1 as depth
    from public.locations l
    where l.id = p_id
    union all
    select l.id, l.parent_id, l.name, c.depth + 1
    from public.locations l
    join chain c on l.id = c.parent_id
    where c.depth < 20
  )
  select string_agg(name, ' · ' order by depth desc)
  from chain;
$$;

-- Els codis dels fills hereten el del pare: A2 -> A2-P1 -> A2-P1-E3 -> A2-P1-E3-C02.
-- Es calcula a la BD i no a l'app perquè dues altes simultànies no es trepitgin.
create or replace function public.next_location_code(p_household uuid, p_parent uuid, p_kind public.location_kind)
returns text
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_prefix text := '';
  v_letter text;
  v_pad    int  := 1;
  v_n      int;
begin
  v_letter := case p_kind
                when 'armari'    then 'A'
                when 'porta'     then 'P'
                when 'modul'     then 'M'
                when 'prestatge' then 'E'
                when 'caixa'     then 'C'
                else 'X'
              end;

  if p_kind = 'caixa' then
    v_pad := 2;  -- C01, C02... les caixes acostumen a passar de nou
  end if;

  if p_parent is not null then
    select l.code || '-' into v_prefix
    from public.locations l
    where l.id = p_parent;
  end if;

  -- Primer número lliure entre els germans del mateix tipus.
  select coalesce(max(substring(l.code from '[0-9]+$')::int), 0) + 1
    into v_n
  from public.locations l
  where l.household_id = p_household
    and l.parent_id is not distinct from p_parent
    and l.kind = p_kind
    and l.code ~ ('^' || v_prefix || v_letter || '[0-9]+$');

  return v_prefix || v_letter || lpad(v_n::text, v_pad, '0');
end;
$$;
