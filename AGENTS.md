# Garatge

Inventari domèstic. Es busca un objecte i l'app diu en quin armari, porta, prestatge i caixa és.
La interfície i els noms de fitxers, funcions i rutes van **en català**; el codi, en anglès només
quan és una API de tercers.

## Comandaments

```bash
npm run dev        npm run build      npm run test
npm run lint       npm run typecheck  npm run icones
npm run db:push    npm run db:types
npx next typegen   # obligatori després d'afegir una pàgina o ruta d'API
```

## Regles del projecte

- **Mai `any`.** Ni `as any`. Si un tipus de supabase-js es queda en `any` per inferència
  circular, trenca el cicle amb una variable intermèdia tipada (hi ha un exemple a
  `lib/db/locations.ts`, a `getBreadcrumb`).
- **Res de Server Actions.** Tota la lògica d'escriptura va a rutes d'API sota `app/api/`. Les
  pàgines i els layouts sí que consulten Supabase directament al servidor.
- **Els tipus de la BD són generats.** `lib/types/database.ts` està escrit a mà de moment; en
  quant hi hagi projecte enllaçat, `npm run db:types` el sobreescriu. No hi afegeixis res a mà
  que no vingui de l'esquema.
- **Els fitxers TSX es creen amb l'eina Write**, no amb heredocs de bash: les cometes de JSX
  trenquen el heredoc.

## Arquitectura

```
app/(app)/        pàgines de dins de l'app; el layout exigeix sessió i casa
app/api/          tota la lògica d'escriptura
lib/db/           accés a dades (servidor)
lib/supabase/     clients: client.ts (navegador), server.ts (RSC/API), proxy.ts (sessió)
proxy.ts          Next 16: es diu proxy, no middleware, i exporta `proxy`
supabase/migrations/
```

### Coses que costen de deduir llegint el codi

- **L'aïllament entre cases el fa la RLS de Postgres**, no els filtres de les consultes. Cada
  política crida `(select private.current_household_id())`; el SELECT que l'embolcalla fa que
  s'avaluï un cop per consulta i no un cop per fila.
- **Els helpers de RLS són SECURITY DEFINER dins de l'esquema `private`.** Han de ser-ho: una
  política sobre `profiles` que llegís `profiles` entraria en recursió infinita.
- **`activity_log` l'omplen triggers**, mai el codi de l'app, i no té polítiques d'escriptura.
- **La cerca viu a `public.search_items()`**, no a TypeScript: combina `tsvector` amb pesos i
  trigrames sobre `name_norm` en una sola consulta.
- **`f_unaccent()` i la configuració `es_unaccent`** existeixen perquè `unaccent()` és STABLE i
  Postgres no admet funcions STABLE en columnes generades ni en índexs.
- **Els codis d'ubicació els genera la BD** (`add_location`), no el client, perquè dues altes
  simultànies no es trepitgin.
- **`NEXT_PUBLIC_SITE_URL` va imprès dins de cada QR.** Canviar-la invalida els adhesius ja
  enganxats de cara a la càmera del sistema.
