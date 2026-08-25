-- Vista de detall i funció de cerca. És el cor de l'app: si buscar "martel" no
-- troba el martell, la resta no serveix de res.

-- security_invoker: la vista s'avalua amb els permisos de qui consulta, de manera
-- que la RLS d'items s'hi aplica igualment. Sense això, la vista seria un forat.
create view public.items_detail
with (security_invoker = true)
as
select
  i.id,
  i.household_id,
  i.name,
  i.description,
  i.quantity,
  i.photo_url,
  i.notes,
  i.created_at,
  i.updated_at,
  i.location_id,
  l.code                       as location_code,
  public.location_path(i.location_id) as location_path,
  i.category_id,
  c.name                       as category_name,
  c.color                      as category_color,
  coalesce(
    (select array_agg(t.name order by t.name)
       from public.item_tags it
       join public.tags t on t.id = it.tag_id
      where it.item_id = i.id),
    '{}'::text[]
  )                            as tags,
  ln.id                        as open_loan_id,
  ln.borrowed_at,
  ln.borrowed_by,
  bp.display_name              as borrowed_by_name
from public.items i
left join public.locations  l  on l.id  = i.location_id
left join public.categories c  on c.id  = i.category_id
left join public.loans      ln on ln.item_id = i.id and ln.returned_at is null
left join public.profiles   bp on bp.id = ln.borrowed_by;

grant select on public.items_detail to authenticated;

-- ---------------------------------------------------------------------------
-- search_items
-- ---------------------------------------------------------------------------
-- Dues vies en una sola consulta:
--   1. full-text sobre search_vector (índex GIN) -> troba plurals, descripcions
--      i etiquetes, amb pesos: el nom pesa més que les notes.
--   2. trigrames sobre name_norm (índex GIN trgm) -> rescata les errades
--      d'escriptura, que és el que passa de veritat quan busques amb una mà
--      i el mòbil a l'altra. Es fa servir l'operador % i no similarity() > x
--      perquè només l'operador pot fer servir l'índex GIN. El llindar és el
--      de sèrie (0,3): Supabase no deixa fixar pg_trgm.similarity_threshold
--      des d'una funció, i 0,3 ja tolera "martel" per "martell".
-- El prefix (name_norm like q || '%') és el que fa que teclejar "mar" ja
-- comenci a ensenyar el martell mentre escrius.
create or replace function public.search_items(p_query text, p_limit int default 30)
returns setof public.items_detail
language sql
stable
security invoker
set search_path = ''
as $$
  with q as (
    select
      pg_catalog.websearch_to_tsquery('public.es_unaccent', pg_catalog.btrim(p_query)) as ts,
      public.f_unaccent(pg_catalog.lower(pg_catalog.btrim(p_query)))                   as norm
  )
  select d.*
  from public.items_detail d
  join public.items i on i.id = d.id
  cross join q
  where pg_catalog.length(q.norm) > 0
    and (
      i.search_vector @@ q.ts
      or i.name_norm operator(extensions.%) q.norm
      or i.name_norm like q.norm || '%'
    )
  order by
    -- Coincidència exacta primer, després per prefix, i finalment per rellevància.
    (i.name_norm = q.norm) desc,
    (i.name_norm like q.norm || '%') desc,
    pg_catalog.ts_rank(i.search_vector, q.ts) desc,
    extensions.similarity(i.name_norm, q.norm) desc,
    i.name asc
  limit least(greatest(coalesce(p_limit, 30), 1), 100);
$$;

revoke execute on function public.search_items(text, int) from public, anon;
grant  execute on function public.search_items(text, int) to authenticated;

-- ---------------------------------------------------------------------------
-- Arbre d'ubicacions amb recompte, per al mapa i les llistes
-- ---------------------------------------------------------------------------
create view public.locations_detail
with (security_invoker = true)
as
select
  l.id,
  l.household_id,
  l.parent_id,
  l.kind,
  l.name,
  l.code,
  l.position,
  l.color,
  l.photo_url,
  l.notes,
  public.location_path(l.id) as path,
  (select count(*) from public.locations c where c.parent_id = l.id)      as child_count,
  (select count(*) from public.items    i where i.location_id = l.id)     as item_count,
  -- Recompte recursiu: el que interessa d'una porta és tot el que hi ha a dins,
  -- repartit entre els seus prestatges i caixes, no només el que hi penja directament.
  (
    with recursive down as (
      select l.id
      union all
      select c.id from public.locations c join down on c.parent_id = down.id
    )
    select count(*) from public.items i where i.location_id in (select id from down)
  ) as item_count_deep
from public.locations l;

grant select on public.locations_detail to authenticated;
