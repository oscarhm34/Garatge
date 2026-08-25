-- Posada a punt del garatge. Es crida un sol cop des de /benvinguda, just després
-- de crear la casa.
--
-- Crea NOMÉS els armaris i les portes. Els prestatges i les caixes s'afegeixen des
-- de l'app en obrir cada porta, perquè els tres armaris no estan distribuïts igual
-- per dins i inventar-se una estructura obligaria a esborrar-la després.

create or replace function public.bootstrap_garage(p_cabinets int default 3, p_doors int default 3)
returns int
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_household uuid := (select private.current_household_id());
  v_cabinet   uuid;
  v_created   int := 0;
  a int;
  d int;
begin
  if v_household is null then
    raise exception 'aquest usuari encara no pertany a cap casa' using errcode = '42501';
  end if;

  if exists (select 1 from public.locations l where l.household_id = v_household) then
    raise exception 'aquesta casa ja té ubicacions creades' using errcode = '23505';
  end if;

  for a in 1..greatest(least(p_cabinets, 20), 1) loop
    insert into public.locations (household_id, kind, name, code, position)
    values (v_household, 'armari', 'Armari ' || a, 'A' || a, a)
    returning id into v_cabinet;
    v_created := v_created + 1;

    for d in 1..greatest(least(p_doors, 20), 1) loop
      insert into public.locations (household_id, parent_id, kind, name, code, position)
      values (v_household, v_cabinet, 'porta', 'Porta ' || d, 'A' || a || '-P' || d, d);
      v_created := v_created + 1;
    end loop;
  end loop;

  -- Vocabulari inicial. Serveix de dues coses: que els primers objectes ja tinguin
  -- on classificar-se, i que la IA de la foto tingui categories a què agafar-se en
  -- comptes d'inventar-ne de noves a cada crida.
  insert into public.categories (household_id, name, icon, color) values
    (v_household, 'Eines de mà',    'hammer',      '#ef4444'),
    (v_household, 'Elèctric',       'zap',         '#f59e0b'),
    (v_household, 'Cargols i tacs', 'bolt',        '#64748b'),
    (v_household, 'Pintura',        'paint-roller','#8b5cf6'),
    (v_household, 'Jardí',          'sprout',      '#22c55e'),
    (v_household, 'Neteja',         'spray-can',   '#06b6d4'),
    (v_household, 'Cotxe',          'car',         '#3b82f6'),
    (v_household, 'Fontaneria',     'droplet',     '#0ea5e9'),
    (v_household, 'Esport',         'bike',        '#ec4899'),
    (v_household, 'Nadal i festes', 'gift',        '#d946ef')
  on conflict do nothing;

  return v_created;
end;
$$;

revoke execute on function public.bootstrap_garage(int, int) from public, anon;
grant  execute on function public.bootstrap_garage(int, int) to authenticated;

-- ---------------------------------------------------------------------------
-- Alta d'ubicació amb codi automàtic
-- ---------------------------------------------------------------------------
-- Passa per aquí i no per un INSERT directe perquè el codi el calcula la BD:
-- si dues persones afegeixen una caixa alhora des de dos mòbils, la restricció
-- única les separa i el reintent troba el següent número lliure.
create or replace function public.add_location(
  p_parent uuid,
  p_kind   public.location_kind,
  p_name   text default null,
  p_color  text default null
)
returns public.locations
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_household uuid := (select private.current_household_id());
  v_code      text;
  v_name      text;
  v_position  int;
  v_row       public.locations;
  v_attempt   int := 0;
begin
  if v_household is null then
    raise exception 'aquest usuari encara no pertany a cap casa' using errcode = '42501';
  end if;

  if p_parent is not null and not exists (
    select 1 from public.locations l where l.id = p_parent and l.household_id = v_household
  ) then
    raise exception 'la ubicació pare no existeix en aquesta casa' using errcode = 'P0002';
  end if;

  select coalesce(max(l.position), 0) + 1 into v_position
  from public.locations l
  where l.household_id = v_household
    and l.parent_id is not distinct from p_parent;

  loop
    v_attempt := v_attempt + 1;
    v_code := public.next_location_code(v_household, p_parent, p_kind);
    v_name := coalesce(nullif(btrim(p_name), ''),
                       case p_kind
                         when 'armari'    then 'Armari '
                         when 'porta'     then 'Porta '
                         when 'modul'     then 'Mòdul '
                         when 'prestatge' then 'Prestatge '
                         when 'caixa'     then 'Caixa '
                         else 'Ubicació '
                       end || regexp_replace(v_code, '^.*[A-Z]0*', ''));

    begin
      insert into public.locations (household_id, parent_id, kind, name, code, position, color)
      values (v_household, p_parent, p_kind, v_name, v_code, v_position, p_color)
      returning * into v_row;
      return v_row;
    exception when unique_violation then
      if v_attempt >= 5 then
        raise;
      end if;
      -- Un altre mòbil s'ha quedat aquest codi. Torna-ho a provar amb el següent.
    end;
  end loop;
end;
$$;

revoke execute on function public.add_location(uuid, public.location_kind, text, text) from public, anon;
grant  execute on function public.add_location(uuid, public.location_kind, text, text) to authenticated;
