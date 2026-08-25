/**
 * Aplica les migracions al projecte de Supabase mitjançant la Management API.
 *
 * Es fa per API i no amb `supabase db push` perquè push demana la contrasenya
 * de la base de dades, mentre que aquí n'hi ha prou amb el token personal.
 *
 *   node scripts/aplica-migracions.mjs <project-ref> [--nomes=<fitxer>]
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const [ref, ...flags] = process.argv.slice(2)
if (!ref) {
  console.error('Falta la referència del projecte')
  process.exit(1)
}

const nomes = flags.find((flag) => flag.startsWith('--nomes='))?.slice('--nomes='.length)
const token = readFileSync('.supabase-token', 'utf8').trim()
const dir = join('supabase', 'migrations')

async function executa(sql) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  })
  const text = await response.text()
  return { ok: response.ok, status: response.status, text }
}

const fitxers = readdirSync(dir)
  .filter((name) => name.endsWith('.sql'))
  .filter((name) => (nomes ? name.includes(nomes) : true))
  .sort()

// Les migracions no són idempotents (creen tipus, taules i configuracions de
// cerca). Rellançar-ne una que ja hi és no és inofensiu: falla i amaga l'estat
// real. Per això es consulta abans què hi ha registrat.
const aplicades = new Set()
{
  const { ok, text } = await executa(
    'select version from supabase_migrations.schema_migrations',
  )
  if (ok) {
    try {
      for (const row of JSON.parse(text)) aplicades.add(row.version)
    } catch {
      // Encara no hi ha taula de migracions: totes són noves.
    }
  }
}

let fallades = 0

for (const fitxer of fitxers) {
  const versio0 = fitxer.split('_')[0]
  if (aplicades.has(versio0) && !nomes) {
    console.log(`· ${fitxer} (ja aplicada)`)
    continue
  }

  const sql = readFileSync(join(dir, fitxer), 'utf8')
  const { ok, status, text } = await executa(sql)

  if (ok) {
    console.log(`✓ ${fitxer}`)
    // Queda registrada perquè un `supabase db push` futur no la torni a executar.
    const versio = fitxer.split('_')[0]
    await executa(
      `insert into supabase_migrations.schema_migrations (version, name)
       values ('${versio}', '${fitxer.replace(/'/g, "''")}')
       on conflict (version) do nothing`,
    )
  } else {
    fallades += 1
    let detall = text
    try {
      const parsed = JSON.parse(text)
      detall = parsed.message ?? parsed.error ?? text
    } catch {
      // El cos no era JSON; es mostra tal qual.
    }
    console.log(`✗ ${fitxer}  [${status}]`)
    console.log(`  ${String(detall).slice(0, 600)}`)
    // S'atura al primer error: les migracions depenen les unes de les altres i
    // seguir endavant només generaria errors en cascada que amaguen la causa.
    break
  }
}

console.log(fallades === 0 ? `\nTotes aplicades (${fitxers.length}).` : '\nAturat per un error.')
process.exit(fallades === 0 ? 0 : 1)
