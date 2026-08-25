-- Permetre esborrar una casa.
--
-- Fins ara era impossible: en esborrar households, les seves locations i items
-- cauen en cascada, i els triggers d'historial intentaven inserir l'apunt
-- d'esborrat referenciant una casa que ja no hi era. La FK saltava i tota
-- l'operacio es revertia amb un error que no apuntava enlloc.
--
-- La correccio es no registrar res quan la casa sencera esta desapareixent:
-- aquelles files d'historial tambe cauen en cascada immediatament despres, o
-- sigui que l'unica cosa que s'hi guanyava era l'error.

create or replace function public.log_location_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    -- La casa ja no hi es: aixo no es l'esborrat d'una ubicacio, es la caiguda
    -- en cascada de la casa sencera.
    if not exists (select 1 from public.households h where h.id = old.household_id) then
      return old;
    end if;

    insert into public.activity_log (household_id, actor_id, entity_type, entity_id, entity_name, action, diff)
    values (old.household_id, (select auth.uid()), 'location', old.id, old.name, 'delete',
            jsonb_build_object('code', old.code));
    return old;
  end if;

  insert into public.activity_log (household_id, actor_id, entity_type, entity_id, entity_name, action, diff)
  values (
    new.household_id, (select auth.uid()), 'location', new.id, new.name,
    case when tg_op = 'INSERT' then 'create'::public.activity_action
         when new.parent_id is distinct from old.parent_id then 'move'::public.activity_action
         else 'update'::public.activity_action end,
    jsonb_build_object('code', new.code)
  );
  return new;
end;
$$;

create or replace function public.log_item_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_action public.activity_action;
  v_diff   jsonb := '{}'::jsonb;
begin
  if tg_op = 'INSERT' then
    v_action := 'create';
    v_diff := jsonb_build_object('location_id', new.location_id, 'quantity', new.quantity);

  elsif tg_op = 'DELETE' then
    if not exists (select 1 from public.households h where h.id = old.household_id) then
      return old;
    end if;

    insert into public.activity_log (household_id, actor_id, entity_type, entity_id, entity_name, action, diff)
    values (old.household_id, (select auth.uid()), 'item', old.id, old.name, 'delete',
            jsonb_build_object('location_id', old.location_id));
    return old;

  else
    if new.location_id is distinct from old.location_id then
      v_action := 'move';
      v_diff := jsonb_build_object('from', old.location_id, 'to', new.location_id);
    elsif new.name        is distinct from old.name
       or new.quantity    is distinct from old.quantity
       or new.description is distinct from old.description
       or new.category_id is distinct from old.category_id
       or new.photo_url   is distinct from old.photo_url
       or new.notes       is distinct from old.notes then
      v_action := 'update';
      v_diff := jsonb_strip_nulls(jsonb_build_object(
        'name',     case when new.name     is distinct from old.name     then jsonb_build_array(old.name, new.name) end,
        'quantity', case when new.quantity is distinct from old.quantity then jsonb_build_array(old.quantity, new.quantity) end
      ));
    else
      return new;
    end if;
  end if;

  insert into public.activity_log (household_id, actor_id, entity_type, entity_id, entity_name, action, diff)
  values (new.household_id, (select auth.uid()), 'item', new.id, new.name, v_action, v_diff);

  return new;
end;
$$;
