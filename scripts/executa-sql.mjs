/**
 * Executa una sentencia SQL contra el projecte via la Management API.
 *
 * Existeix perque construir el JSON a ma amb `curl -d` i SQL multilinia falla
 * en silenci: els salts de linia dins d'una cadena JSON no son valids i la
 * peticio torna una llista buida, que s'assembla massa a "ha anat be".
 *
 *   node scripts/executa-sql.mjs "select 1"
 *   node scripts/executa-sql.mjs --fitxer consulta.sql
 */
import { readFileSync } from 'node:fs'

const args = process.argv.slice(2)
const token = readFileSync('.supabase-token', 'utf8').trim()
const ref = process.env.SUPABASE_PROJECT_REF ?? 'vliyimrvoeblgpzoldiv'

const sql = args[0] === '--fitxer' ? readFileSync(args[1], 'utf8') : args[0]
if (!sql) {
  console.error('Falta la sentencia SQL')
  process.exit(1)
}

const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: sql }),
})

const text = await response.text()

if (!response.ok) {
  console.error(`ERROR ${response.status}`)
  console.error(text.slice(0, 1000))
  process.exit(1)
}

try {
  const rows = JSON.parse(text)
  if (Array.isArray(rows) && rows.length > 0) console.table(rows)
  else console.log('(sense files de sortida)')
} catch {
  console.log(text.slice(0, 1000))
}
