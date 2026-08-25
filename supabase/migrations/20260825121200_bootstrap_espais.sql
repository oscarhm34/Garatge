-- Muntar el garatge comptant espais, no portes.
--
-- La primera versio creava una ubicacio per porta, que es l'error natural quan
-- mires un armari des de fora. En aquests armaris de tres portes, dues son
-- batents i obren un unic compartiment: etiquetar-ne tres faria que dos
-- adhesius apuntessin al mateix lloc i ningu sabria quin escanejar.
--
-- El que cal comptar es on pots deixar coses, no per on hi entres.

drop function if exists public.bootstrap_garage(int, int);

create or replace function public.bootstrap_garage(p_cabinets int default 3, p_compartments int default 2)
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
  m int;
begin
  if v_household is null then
    raise exception 'aquest usuari encara no pertany a cap casa' using errcode = '42501';
  end if;

  if exists (select 1 from public.locations l where l.household_id = v_household) then
    raise exception 'aquesta casa ja te ubicacions creades' using errcode = '23505';
  end if;

  for a in 1..greatest(least(p_cabinets, 20), 1) loop
    insert into public.locations (household_id, kind, name, code, position)
    values (v_household, 'armari', 'Armari ' || a, 'A' || a, a)
    returning id into v_cabinet;
    v_created := v_created + 1;

    for m in 1..greatest(least(p_compartments, 20), 1) loop
      insert into public.locations (household_id, parent_id, kind, name, code, position)
      values (v_household, v_cabinet, 'modul', 'Espai ' || m, 'A' || a || '-M' || m, m);
      v_created := v_created + 1;
    end loop;
  end loop;

  insert into public.categories (household_id, name, icon, color) values
    (v_household, 'Eines de ma',    'hammer',      '#ef4444'),
    (v_household, 'Electric',       'zap',         '#f59e0b'),
    (v_household, 'Cargols i tacs', 'bolt',        '#64748b'),
    (v_household, 'Pintura',        'paint-roller','#8b5cf6'),
    (v_household, 'Jardi',          'sprout',      '#22c55e'),
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
