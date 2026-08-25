-- Row Level Security. L'aïllament entre cases es fa aquí, a la base de dades,
-- no al codi de l'app: encara que una ruta d'API s'oblidés del filtre, Postgres
-- no retornaria ni una fila d'una altra casa.
--
-- Totes les polítiques criden (select private.current_household_id()). El SELECT
-- que l'embolcalla no és decoratiu: fa que Postgres l'avaluï un sol cop com a
-- InitPlan en comptes d'un cop per fila.

-- Cap taula d'aquesta app té res a oferir a un usuari sense sessió.
revoke all on all tables in schema public from anon;

grant select, insert, update, delete on
  public.households, public.profiles, public.locations, public.categories,
  public.tags, public.items, public.item_tags, public.loans
to authenticated;

grant select on public.activity_log to authenticated;

alter table public.households  enable row level security;
alter table public.profiles    enable row level security;
alter table public.locations   enable row level security;
alter table public.categories  enable row level security;
alter table public.tags        enable row level security;
alter table public.items       enable row level security;
alter table public.item_tags   enable row level security;
alter table public.loans       enable row level security;
alter table public.activity_log enable row level security;

-- ---------------------------------------------------------------------------
-- households
-- ---------------------------------------------------------------------------
-- No hi ha política d'INSERT: crear una casa passa per public.create_household(),
-- que és SECURITY DEFINER i comprova que l'usuari no en tingui cap altra.
create policy households_select on public.households
  for select to authenticated
  using (id = (select private.current_household_id()));

create policy households_update on public.households
  for update to authenticated
  using (id = (select private.current_household_id()) and (select private.is_household_admin()))
  with check (id = (select private.current_household_id()));

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy profiles_select_self on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

-- Cal veure els noms de la resta de la família per mostrar "el té l'Aina".
create policy profiles_select_household on public.profiles
  for select to authenticated
  using (household_id = (select private.current_household_id()));

-- Només el propi nom i avatar. household_id i role es canvien via RPC, mai
-- directament: si no, qualsevol podria autoassignar-se admin o saltar de casa.
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and household_id is not distinct from (select private.current_household_id())
    and role is not distinct from (select private.current_member_role())
  );

-- ---------------------------------------------------------------------------
-- Taules amb household_id: mateix patró per a totes
-- ---------------------------------------------------------------------------
create policy locations_select on public.locations
  for select to authenticated using (household_id = (select private.current_household_id()));
create policy locations_insert on public.locations
  for insert to authenticated with check (household_id = (select private.current_household_id()));
create policy locations_update on public.locations
  for update to authenticated
  using (household_id = (select private.current_household_id()))
  with check (household_id = (select private.current_household_id()));
-- Esborrar una ubicació s'emporta els fills en cascada: només admin.
create policy locations_delete on public.locations
  for delete to authenticated
  using (household_id = (select private.current_household_id()) and (select private.is_household_admin()));

create policy categories_all on public.categories
  for all to authenticated
  using (household_id = (select private.current_household_id()))
  with check (household_id = (select private.current_household_id()));

create policy tags_all on public.tags
  for all to authenticated
  using (household_id = (select private.current_household_id()))
  with check (household_id = (select private.current_household_id()));

create policy items_all on public.items
  for all to authenticated
  using (household_id = (select private.current_household_id()))
  with check (household_id = (select private.current_household_id()));

create policy loans_all on public.loans
  for all to authenticated
  using (household_id = (select private.current_household_id()))
  with check (household_id = (select private.current_household_id()));

-- ---------------------------------------------------------------------------
-- item_tags: taula pont sense household_id propi
-- ---------------------------------------------------------------------------
-- Es comprova a través de l'objecte. items_household_id_idx fa que l'EXISTS
-- sigui una cerca per índex i no un escaneig.
create policy item_tags_all on public.item_tags
  for all to authenticated
  using (
    exists (
      select 1 from public.items i
      where i.id = item_tags.item_id
        and i.household_id = (select private.current_household_id())
    )
  )
  with check (
    exists (
      select 1 from public.items i
      where i.id = item_tags.item_id
        and i.household_id = (select private.current_household_id())
    )
    and exists (
      select 1 from public.tags t
      where t.id = item_tags.tag_id
        and t.household_id = (select private.current_household_id())
    )
  );

-- ---------------------------------------------------------------------------
-- activity_log: només lectura
-- ---------------------------------------------------------------------------
-- L'omplen els triggers, que són SECURITY DEFINER i per tant no passen per RLS.
-- Sense polítiques d'INSERT/UPDATE/DELETE, ningú el pot reescriure des del client.
create policy activity_select on public.activity_log
  for select to authenticated
  using (household_id = (select private.current_household_id()));
