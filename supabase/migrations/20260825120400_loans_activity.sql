-- Préstecs ("qui té el trepant") i registre d'activitat.

create table public.loans (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  item_id      uuid not null references public.items (id) on delete cascade,
  borrowed_by  uuid references public.profiles (id) on delete set null,
  borrowed_at  timestamptz not null default now(),
  returned_at  timestamptz,
  note         text check (length(note) <= 500),

  constraint loans_returned_after_borrowed check (returned_at is null or returned_at >= borrowed_at)
);

-- Un objecte no pot estar prestat dues vegades alhora. Índex únic PARCIAL: només
-- vigila les files obertes, així que l'històric de devolucions hi cap sencer.
-- Això treu la necessitat d'una columna d'estat que es podria desincronitzar.
create unique index loans_one_open_per_item on public.loans (item_id) where returned_at is null;

create index loans_item_id_idx      on public.loans (item_id);
create index loans_household_id_idx on public.loans (household_id);
create index loans_open_by_idx      on public.loans (borrowed_by) where returned_at is null;

-- ---------------------------------------------------------------------------
-- Registre d'activitat
-- ---------------------------------------------------------------------------
create type public.activity_action as enum ('create', 'update', 'move', 'delete', 'borrow', 'return');

create table public.activity_log (
  id           bigint generated always as identity primary key,
  household_id uuid not null references public.households (id) on delete cascade,
  actor_id     uuid references public.profiles (id) on delete set null,
  entity_type  text not null check (entity_type in ('item', 'location', 'loan')),
  entity_id    uuid not null,
  entity_name  text,
  action       public.activity_action not null,
  diff         jsonb,
  created_at   timestamptz not null default now()
);

create index activity_household_recent_idx on public.activity_log (household_id, created_at desc);
create index activity_entity_idx           on public.activity_log (entity_type, entity_id, created_at desc);
create index activity_actor_id_idx         on public.activity_log (actor_id);

-- El log s'omple des de triggers, no des del codi de l'app: així no hi ha cap
-- camí d'escriptura (RPC, importació massiva, correcció a mà) que se'l pugui saltar.
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
      -- Només ha canviat tags_text o updated_at: no val la pena una entrada al log.
      return new;
    end if;
  end if;

  insert into public.activity_log (household_id, actor_id, entity_type, entity_id, entity_name, action, diff)
  values (new.household_id, (select auth.uid()), 'item', new.id, new.name, v_action, v_diff);

  return new;
end;
$$;

create trigger items_activity_trg
  after insert or update or delete on public.items
  for each row execute function public.log_item_activity();

create or replace function public.log_location_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
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

create trigger locations_activity_trg
  after insert or update or delete on public.locations
  for each row execute function public.log_location_activity();

create or replace function public.log_loan_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item_name text;
begin
  select i.name into v_item_name from public.items i where i.id = new.item_id;

  insert into public.activity_log (household_id, actor_id, entity_type, entity_id, entity_name, action, diff)
  values (
    new.household_id, (select auth.uid()), 'loan', new.item_id, v_item_name,
    case when tg_op = 'INSERT' or new.returned_at is null
         then 'borrow'::public.activity_action
         else 'return'::public.activity_action end,
    jsonb_build_object('loan_id', new.id, 'borrowed_by', new.borrowed_by)
  );
  return new;
end;
$$;

create trigger loans_activity_trg
  after insert or update of returned_at on public.loans
  for each row execute function public.log_loan_activity();
