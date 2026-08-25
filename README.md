# OrganizApp Garaje

Inventari del garatge de casa. Busques «martell» al mòbil i et diu **Armari 2 · Porta 1 ·
Prestatge 3 · Caixa blava**, amb foto i amb qui se l'ha endut si no hi és.

La idea de fons: **s'etiqueten els llocs, no les coses**. Enganxar un QR a un martell és
inviable; enganxar-ne un a cada porta, prestatge i caixa es fa un cop i dura anys. El QR conté
una adreça web normal, així que la càmera del mòbil ja l'obre sense instal·lar res.

## Com està fet

| Peça | Tecnologia |
|---|---|
| App | Next.js 16 (App Router) · React 19 · TypeScript estricte |
| Estils | Tailwind CSS 4 · shadcn/ui |
| Dades, sessió i fotos | Supabase (Postgres + Auth + Storage) |
| QR | `qrcode` per generar · `BarcodeDetector` natiu amb `@zxing/browser` de reserva |
| Alta per foto | Claude (`claude-opus-5`) amb sortida estructurada |

## Posar-lo en marxa

> **Estat actual:** ja hi ha projecte de Supabase creat i amb l'esquema aplicat
> (`vliyimrvoeblgpzoldiv`, regió `eu-west-1`, Postgres 17.6). Les 11 migracions estan
> registrades a `supabase_migrations.schema_migrations`. Si només vols arrencar-lo en local,
> salta al pas 5.

### 1. Projecte de Supabase

Crea un projecte a [supabase.com](https://supabase.com) (el pla gratuït va sobrat) i apunta't
la referència del projecte i les claus de **Project Settings → API**.

### 2. Variables d'entorn

```bash
cp .env.example .env.local
```

Omple `.env.local`:

| Variable | Què hi va |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del projecte |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clau publicable (`sb_publishable_…`) |
| `NEXT_PUBLIC_SITE_URL` | Adreça pública. **És la que va dins dels QR** |
| `ANTHROPIC_API_KEY` | Opcional: sense ella, l'alta per foto queda desactivada i la resta funciona igual |

> `NEXT_PUBLIC_SITE_URL` s'ha de fixar **abans** d'imprimir cap etiqueta. Si canvia després,
> els adhesius ja enganxats deixen d'obrir l'app des de la càmera del sistema (des de dins de
> l'app sí que seguirien funcionant, perquè l'escàner també accepta el codi solt).

### 3. Aplicar l'esquema

```bash
npx supabase login
npx supabase link --project-ref <la-teva-referencia>
npx supabase db push
```

I tot seguit regenera els tipus a partir de l'esquema:

```bash
npm run db:types
```

Això reescriu `lib/types/database.generated.ts`, que **no s'edita mai a mà**.
`lib/types/database.ts` sí que és manual: hi viuen els àlies curts i la correcció de
nul·labilitat de les vistes (Postgres no propaga el NOT NULL a través d'una vista, així que el
generador marca totes les seves columnes com a nul·lables).

### 4. Correu d'entrada

A **Authentication → Providers → Email** del panell de Supabase, deixa activat *Email OTP*.
L'app entra amb un codi de sis xifres i no amb enllaç màgic, perquè el codi funciona encara que
el correu s'obri en un navegador diferent del que té l'app: al mòbil passa constantment.

### 5. Arrencar

```bash
npm install
npm run dev
```

## Publicar-ho a Vercel

1. A [vercel.com/new](https://vercel.com/new), importa el repositori. Next.js es detecta sol i
   no cal tocar cap ordre de compilació.
2. Copia-hi les variables d'entorn de `.env.local`, **canviant `NEXT_PUBLIC_SITE_URL` pel domini
   definitiu**. Aquest és el pas que no es pot desfer després: aquesta adreça queda impresa dins
   de cada QR.
3. A Supabase, **Authentication → URL Configuration**, afegeix el domini a *Site URL* i a
   *Redirect URLs*; si no, l'enllaç del correu retorna a `localhost`.
4. `vercel.json` ja porta un cron diari cap a `/api/salut`. **Cal que hi sigui:** el pla gratuït
   de Supabase pausa els projectes després d'una setmana sense activitat, i un inventari de
   garatge pot passar mesos sense que ningú l'obri. La ruta fa una consulta de veritat contra
   Postgres; una resposta estàtica no comptaria com a activitat.

> El pla Hobby de Vercel és per a ús **no comercial**. Per a l'inventari de casa hi encaixa; per
> a una empresa, no.

## El primer dia

1. Entra amb el teu correu i tria **Crear la casa**. Es creen els 3 armaris i les 9 portes.
2. Ves a **Etiquetes** i imprimeix el full en adhesius de 24 per pàgina (63,5 × 33,9 mm, tipus
   Avery L7159). Imprimeix a mida real, sense marges.
3. Enganxa les 9 etiquetes de les portes.
4. Obre una porta, escaneja el seu QR i crea els prestatges que hi vegis. Torna a imprimir.
5. A partir d'aquí, cada cosa que guardis: escaneja el lloc → *Guardar una cosa aquí*.
6. Passa el codi d'invitació (a **Ajustos**) a la resta de la família.

## Ordre de comandaments

```bash
npm run dev          # servidor de desenvolupament
node --env-file=.env.local scripts/prova-e2e.mjs   # 36 comprovacions contra la BD real
npm run build        # compilació de producció
npm run lint         # ESLint
npx tsc --noEmit     # comprovació de tipus
npx next typegen     # regenera els tipus de rutes després d'afegir una pàgina
```

## Imatges

Els originals viuen a `assets/` i **no** es serveixen: les versions per a web es
generen i es versionen al repositori.

```bash
npm run icones      # icones de la PWA, apple-icon i favicon
npm run portada     # il·lustració de la pantalla d'entrada
```

Torna-les a executar només si canvies els fitxers d'`assets/`. Les icones es desen
amb paleta de 256 colors: en una il·lustració de zones planes no s'hi nota i el fitxer
baixa de mig mega a unes desenes de kB.

## Decisions que val la pena conèixer

- **L'aïllament entre cases el fa Postgres**, no el codi. Totes les taules tenen RLS filtrant per
  `household_id`; encara que una ruta d'API s'oblidés del filtre, no en sortiria ni una fila.
- **La cerca combina dues vies** dins d'una sola consulta: `tsvector` amb pesos (el nom pesa més
  que les notes) i trigrames sobre el nom sense accents, que és el que fa que «martel» trobi el
  martell.
- **El registre d'activitat l'omplen triggers**, no l'app. Així no hi ha cap camí d'escriptura que
  se'l pugui saltar.
- **Un objecte està «fora»** si té una fila a `loans` sense `returned_at`. Un índex únic parcial
  impedeix dos préstecs oberts alhora; no cal cap columna d'estat que es pugui desincronitzar.
- **Les fotos són privades.** El bucket no és públic i es serveixen amb URL signades d'una hora.
