# Garatge

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

I tot seguit regenera els tipus, que ara mateix estan escrits a mà:

```bash
npx supabase gen types typescript --linked > lib/types/database.ts
```

### 4. Correu d'entrada

A **Authentication → Providers → Email** del panell de Supabase, deixa activat *Email OTP*.
L'app entra amb un codi de sis xifres i no amb enllaç màgic, perquè el codi funciona encara que
el correu s'obri en un navegador diferent del que té l'app: al mòbil passa constantment.

### 5. Arrencar

```bash
npm install
npm run dev
```

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
npm run build        # compilació de producció
npm run lint         # ESLint
npx tsc --noEmit     # comprovació de tipus
npx next typegen     # regenera els tipus de rutes després d'afegir una pàgina
```

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
