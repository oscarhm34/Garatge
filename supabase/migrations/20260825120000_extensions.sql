-- Extensions, configuració de cerca i esquema privat per als helpers de RLS.
-- pg_trgm  -> tolerància a errors tipogràfics ("martel" ha de trobar "martell")
-- unaccent -> "cargol" i "càrgol" han de ser la mateixa paraula

create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

-- Esquema privat: helpers de RLS que mai s'exposen a PostgREST.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- Embolcall IMMUTABLE d'unaccent. La versió d'un sol argument és STABLE (depèn del
-- search_path), i Postgres no admet funcions STABLE ni en columnes generades ni en
-- índexs. La de dos arguments sí que és immutable; aquí la fixem al diccionari.
-- Sense clàusula SET a propòsit: així la funció es pot inlinear dins dels índexs.
create or replace function public.f_unaccent(text)
returns text
language sql
immutable
parallel safe
strict
as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, $1)
$$;

comment on function public.f_unaccent(text) is
  'unaccent() immutable, apte per a columnes generades i índexs.';

-- Configuració de cerca "espanyol sense accents".
-- Postgres no porta diccionari català; l'stemmer espanyol resol prou bé els plurals
-- i les formes verbals del vocabulari de garatge (eines, cargols, mides).
-- Fer-ho com a text search configuration (i no cridant unaccent() a la consulta)
-- és el que permet que to_tsvector() segueixi sent IMMUTABLE i, per tant, indexable.
-- Es crea dins d'un bloc condicional i mai amb DROP: la columna generada
-- items.search_vector en depèn, i un DROP ... CASCADE se l'emportaria per
-- davant en qualsevol reexecució accidental d'aquesta migració.
do $$
begin
  if not exists (
    select 1 from pg_ts_config c
    join pg_namespace n on n.oid = c.cfgnamespace
    where c.cfgname = 'es_unaccent' and n.nspname = 'public'
  ) then
    create text search configuration public.es_unaccent (copy = spanish);

    alter text search configuration public.es_unaccent
      alter mapping for hword, hword_part, word
      with extensions.unaccent, spanish_stem;
  end if;
end
$$;
