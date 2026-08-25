-- Objectes, categories i etiquetes.

create table public.categories (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name         text not null check (length(btrim(name)) between 1 and 40),
  icon         text,
  color        text check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at   timestamptz not null default now()
);

-- Índex únic per expressió: "Jardí" i "jardí" han de ser la mateixa categoria.
create unique index categories_household_name_key on public.categories (household_id, lower(name));
create index categories_household_id_idx on public.categories (household_id);

create table public.tags (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name         text not null check (length(btrim(name)) between 1 and 30),
  created_at   timestamptz not null default now()
);

create unique index tags_household_name_key on public.tags (household_id, lower(name));
create index tags_household_id_idx on public.tags (household_id);

create table public.items (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  location_id  uuid references public.locations (id) on delete set null,
  category_id  uuid references public.categories (id) on delete set null,
  name         text not null check (length(btrim(name)) between 1 and 120),
  description  text check (length(description) <= 2000),
  quantity     int  not null default 1 check (quantity > 0),
  photo_url    text,
  notes        text check (length(notes) <= 2000),
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- Etiquetes desnormalitzades. Les manté un trigger sobre item_tags: sense això
  -- caldria un JOIN dins de la columna generada, cosa que Postgres no permet.
  tags_text    text not null default '',

  search_vector tsvector generated always as (
    setweight(to_tsvector('public.es_unaccent', coalesce(name, '')),        'A') ||
    setweight(to_tsvector('public.es_unaccent', coalesce(tags_text, '')),   'B') ||
    setweight(to_tsvector('public.es_unaccent', coalesce(description, '')), 'C') ||
    setweight(to_tsvector('public.es_unaccent', coalesce(notes, '')),       'D')
  ) stored,

  -- Nom normalitzat per als trigrames: "martel" ha de trobar "Martell".
  name_norm text generated always as (public.f_unaccent(lower(name))) stored
);

create index items_search_vector_idx  on public.items using gin (search_vector);
create index items_name_norm_trgm_idx on public.items using gin (name_norm extensions.gin_trgm_ops);
create index items_household_id_idx   on public.items (household_id);
create index items_location_id_idx    on public.items (location_id);
create index items_category_id_idx    on public.items (category_id);
create index items_created_by_idx     on public.items (created_by);
create index items_recent_idx         on public.items (household_id, created_at desc);

create trigger items_touch_updated_at
  before update on public.items
  for each row execute function public.touch_updated_at();

create table public.item_tags (
  item_id uuid not null references public.items (id) on delete cascade,
  tag_id  uuid not null references public.tags  (id) on delete cascade,
  primary key (item_id, tag_id)
);

-- La PK ja indexa (item_id, tag_id); falta el sentit invers per a "què hi ha
-- etiquetat com a elèctric".
create index item_tags_tag_id_idx on public.item_tags (tag_id);

-- ---------------------------------------------------------------------------
-- Sincronització de tags_text
-- ---------------------------------------------------------------------------
create or replace function public.refresh_item_tags_text(p_item uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.items i
     set tags_text = coalesce(
           (select string_agg(t.name, ' ' order by t.name)
              from public.item_tags it
              join public.tags t on t.id = it.tag_id
             where it.item_id = p_item),
           ''
         )
   where i.id = p_item
     and i.tags_text is distinct from coalesce(
           (select string_agg(t.name, ' ' order by t.name)
              from public.item_tags it
              join public.tags t on t.id = it.tag_id
             where it.item_id = p_item),
           ''
         );
$$;

create or replace function public.item_tags_sync()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_item_tags_text(old.item_id);
    return old;
  end if;
  perform public.refresh_item_tags_text(new.item_id);
  return new;
end;
$$;

create trigger item_tags_sync_trg
  after insert or delete on public.item_tags
  for each row execute function public.item_tags_sync();

-- Si es reanomena una etiqueta, cal refrescar tots els objectes que la duen.
create or replace function public.tags_rename_sync()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item uuid;
begin
  if new.name is not distinct from old.name then
    return new;
  end if;
  for v_item in select it.item_id from public.item_tags it where it.tag_id = new.id loop
    perform public.refresh_item_tags_text(v_item);
  end loop;
  return new;
end;
$$;

create trigger tags_rename_sync_trg
  after update of name on public.tags
  for each row execute function public.tags_rename_sync();
