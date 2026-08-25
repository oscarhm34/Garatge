-- Batec per evitar que Supabase pausi el projecte.
--
-- Els projectes del pla gratuït es pausen després d'una setmana sense activitat.
-- Un inventari de garatge pot passar mesos sense que ningú l'obri, i trobar-se'l
-- pausat justament el dia que es busca una eina és la manera més segura que
-- l'app deixi de fer-se servir. Una tasca diària crida aquesta funció.
--
-- Retorna l'hora del servidor i prou: no toca cap dada ni filtra res, i per això
-- es pot obrir a anon sense exposar res de la casa.

create or replace function public.ping()
returns timestamptz
language sql
stable
security invoker
set search_path = ''
as $$
  select now()
$$;

grant execute on function public.ping() to anon, authenticated;
