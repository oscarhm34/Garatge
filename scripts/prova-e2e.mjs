/**
 * Prova d'extrem a extrem contra el projecte real de Supabase.
 *
 * Crea dos usuaris de mentida, els fa passar pel flux complet (crear casa,
 * muntar el garatge, afegir prestatges i objectes, cercar, moure, prestar) i
 * comprova que la RLS aïlla de veritat una casa de l'altra. Al final ho esborra
 * tot. Tot passa per PostgREST amb el token de cada usuari, exactament com fa
 * l'app: així es prova la RLS de debò i no el que faria un superusuari.
 *
 *   node --env-file=.env.local scripts/prova-e2e.mjs
 */
const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL
const PUBLICA = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const SECRETA = process.env.SUPABASE_SECRET_KEY

if (!URL_BASE || !PUBLICA || !SECRETA) {
  console.error('Falten variables. Executa amb: node --env-file=.env.local scripts/prova-e2e.mjs')
  process.exit(1)
}

let passades = 0
let fallades = 0

function comprova(descripcio, condicio, detall) {
  if (condicio) {
    passades += 1
    console.log(`  ✓ ${descripcio}`)
  } else {
    fallades += 1
    console.log(`  ✗ ${descripcio}`)
    if (detall !== undefined) console.log(`     ${JSON.stringify(detall).slice(0, 400)}`)
  }
}

async function api(cami, { token, method = 'GET', body, prefer } = {}) {
  const response = await fetch(`${URL_BASE}${cami}`, {
    method,
    headers: {
      apikey: PUBLICA,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  const text = await response.text()
  let data = null
  try {
    data = text.length > 0 ? JSON.parse(text) : null
  } catch {
    data = text
  }
  return { ok: response.ok, status: response.status, data }
}

async function creaUsuari(email) {
  const response = await fetch(`${URL_BASE}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: SECRETA,
      Authorization: `Bearer ${SECRETA}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password: 'prova-garatge-1234', email_confirm: true }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(`No s'ha pogut crear ${email}: ${JSON.stringify(data)}`)

  const login = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: PUBLICA, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'prova-garatge-1234' }),
  })
  const sessio = await login.json()
  if (!login.ok) throw new Error(`No s'ha pogut entrar amb ${email}: ${JSON.stringify(sessio)}`)

  return { id: data.id, token: sessio.access_token }
}

async function esborraUsuari(id) {
  await fetch(`${URL_BASE}/auth/v1/admin/users/${id}`, {
    method: 'DELETE',
    headers: { apikey: SECRETA, Authorization: `Bearer ${SECRETA}` },
  })
}

/**
 * Esborra la casa d'un usuari abans de treure'l.
 *
 * Cal fer-ho explicitament: profiles.household_id es 'on delete set null', o
 * sigui que esborrar l'usuari s'endu el perfil pero deixa la casa penjada amb
 * totes les seves ubicacions. Suposar que queia en cascada va omplir el
 * projecte de cases fantasma fins que algu se'n va adonar.
 */
async function esborraCasaDe(token) {
  const { data } = await api('/rest/v1/profiles?select=household_id', { token })
  const household = data?.[0]?.household_id
  if (!household) return
  await fetch(`${URL_BASE}/rest/v1/households?id=eq.${household}`, {
    method: 'DELETE',
    headers: { apikey: SECRETA, Authorization: `Bearer ${SECRETA}` },
  })
}

const marca = Date.now()
const emailA = `prova-a-${marca}@example.com`
const emailB = `prova-b-${marca}@example.com`
let usuariA = null
let usuariB = null

try {
  console.log('\n[1] Alta d’usuaris i creació del perfil pel trigger')
  usuariA = await creaUsuari(emailA)
  usuariB = await creaUsuari(emailB)

  const perfil = await api('/rest/v1/profiles?select=*', { token: usuariA.token })
  comprova('el trigger ha creat el perfil', perfil.ok && perfil.data.length === 1, perfil.data)
  comprova('el perfil neix sense casa', perfil.data?.[0]?.household_id === null, perfil.data?.[0])

  console.log('\n[2] Crear casa i muntar el garatge')
  const casa = await api('/rest/v1/rpc/create_household', {
    token: usuariA.token,
    method: 'POST',
    body: { p_name: 'Casa de prova' },
  })
  comprova('create_household torna un uuid', casa.ok && typeof casa.data === 'string', casa.data)

  const bootstrap = await api('/rest/v1/rpc/bootstrap_garage', {
    token: usuariA.token,
    method: 'POST',
    body: { p_cabinets: 3, p_compartments: 2 },
  })
  comprova('bootstrap_garage crea 9 ubicacions (3 armaris + 6 espais)', bootstrap.data === 9, bootstrap.data)

  const repetit = await api('/rest/v1/rpc/bootstrap_garage', {
    token: usuariA.token,
    method: 'POST',
    body: { p_cabinets: 3, p_compartments: 2 },
  })
  comprova('no es pot muntar el garatge dos cops', !repetit.ok, repetit.data)

  console.log('\n[3] Codis correlatius generats per la base de dades')
  const espais = await api('/rest/v1/locations?select=id,code,name&code=eq.A2-M1', {
    token: usuariA.token,
  })
  comprova('existeix l’espai A2-M1', espais.ok && espais.data.length === 1, espais.data)
  const portaId = espais.data?.[0]?.id

  const prestatge = await api('/rest/v1/rpc/add_location', {
    token: usuariA.token,
    method: 'POST',
    body: { p_parent: portaId, p_kind: 'prestatge', p_name: null, p_color: null },
  })
  comprova('add_location hereta el codi del pare', prestatge.data?.code === 'A2-M1-E1', prestatge.data)
  comprova('i li posa nom sol', prestatge.data?.name === 'Prestatge 1', prestatge.data?.name)

  const prestatge3 = await (async () => {
    await api('/rest/v1/rpc/add_location', {
      token: usuariA.token, method: 'POST',
      body: { p_parent: portaId, p_kind: 'prestatge', p_name: null, p_color: null },
    })
    return api('/rest/v1/rpc/add_location', {
      token: usuariA.token, method: 'POST',
      body: { p_parent: portaId, p_kind: 'prestatge', p_name: null, p_color: null },
    })
  })()
  comprova('el tercer prestatge és A2-M1-E3', prestatge3.data?.code === 'A2-M1-E3', prestatge3.data)

  const caixa = await api('/rest/v1/rpc/add_location', {
    token: usuariA.token,
    method: 'POST',
    body: { p_parent: prestatge3.data.id, p_kind: 'caixa', p_name: 'Caixa blava', p_color: '#3b82f6' },
  })
  comprova('les caixes es numeren amb dos dígits', caixa.data?.code === 'A2-M1-E3-C01', caixa.data)

  console.log('\n[4] Afegir un objecte amb etiquetes')
  const { data: perfilA } = await api('/rest/v1/profiles?select=household_id', { token: usuariA.token })
  const householdA = perfilA[0].household_id

  const objecte = await api('/rest/v1/items', {
    token: usuariA.token,
    method: 'POST',
    prefer: 'return=representation',
    body: {
      household_id: householdA,
      location_id: caixa.data.id,
      name: 'Martell de bola',
      description: 'El de mànec de fusta, 300 g',
      quantity: 1,
    },
  })
  comprova('objecte creat', objecte.ok && objecte.data?.[0]?.id, objecte.data)
  const itemId = objecte.data?.[0]?.id

  const etiqueta = await api('/rest/v1/tags', {
    token: usuariA.token, method: 'POST', prefer: 'return=representation',
    body: { household_id: householdA, name: 'fusteria' },
  })
  await api('/rest/v1/item_tags', {
    token: usuariA.token, method: 'POST',
    body: { item_id: itemId, tag_id: etiqueta.data[0].id },
  })

  const ambEtiqueta = await api(`/rest/v1/items?select=tags_text&id=eq.${itemId}`, { token: usuariA.token })
  comprova('el trigger sincronitza tags_text', ambEtiqueta.data?.[0]?.tags_text === 'fusteria', ambEtiqueta.data)

  console.log('\n[5] Cerca — el motiu de tot plegat')
  for (const [consulta, ha_de_trobar] of [
    ['martell', true],
    ['martel', true],
    ['MARTELL', true],
    ['mar', true],
    ['fusteria', true],
    ['fusta', true],
    ['bicicleta', false],
  ]) {
    const resultat = await api('/rest/v1/rpc/search_items', {
      token: usuariA.token, method: 'POST', body: { p_query: consulta, p_limit: 10 },
    })
    const trobat = Array.isArray(resultat.data) && resultat.data.some((r) => r.id === itemId)
    comprova(
      `cercar «${consulta}» ${ha_de_trobar ? 'troba' : 'no troba'} el martell`,
      trobat === ha_de_trobar,
      resultat.data,
    )
  }

  const ambCami = await api('/rest/v1/rpc/search_items', {
    token: usuariA.token, method: 'POST', body: { p_query: 'martell', p_limit: 5 },
  })
  const cami = ambCami.data?.[0]?.location_path
  comprova(
    'el resultat porta el camí complet',
    cami === 'Armari 2 · Espai 1 · Prestatge 3 · Caixa blava',
    cami,
  )

  console.log('\n[6] Moure i prestar')
  const mogut = await api(`/rest/v1/items?id=eq.${itemId}`, {
    token: usuariA.token, method: 'PATCH', prefer: 'return=representation',
    body: { location_id: prestatge.data.id },
  })
  comprova('objecte mogut', mogut.ok && mogut.data?.[0]?.location_id === prestatge.data.id, mogut.data)

  const prestec = await api('/rest/v1/loans', {
    token: usuariA.token, method: 'POST', prefer: 'return=representation',
    body: { household_id: householdA, item_id: itemId, borrowed_by: usuariA.id },
  })
  comprova('préstec obert', prestec.ok, prestec.data)

  const segon = await api('/rest/v1/loans', {
    token: usuariA.token, method: 'POST',
    body: { household_id: householdA, item_id: itemId, borrowed_by: usuariA.id },
  })
  comprova('no es pot prestar dos cops alhora', !segon.ok, segon.data)

  const vista = await api(`/rest/v1/items_detail?select=borrowed_by_name,open_loan_id&id=eq.${itemId}`, {
    token: usuariA.token,
  })
  comprova('la vista mostra qui el té', vista.data?.[0]?.open_loan_id !== null, vista.data)

  console.log('\n[7] Historial omplert pels triggers')
  const historial = await api('/rest/v1/activity_log?select=action,entity_type&order=id.asc', {
    token: usuariA.token,
  })
  const accions = (historial.data ?? []).map((row) => row.action)
  comprova('hi ha entrades de creació', accions.includes('create'), accions.slice(0, 5))
  comprova('hi ha entrada de moviment', accions.includes('move'), accions)
  comprova('hi ha entrada de préstec', accions.includes('borrow'), accions)

  const intrusio = await api('/rest/v1/activity_log', {
    token: usuariA.token, method: 'POST',
    body: { household_id: householdA, entity_type: 'item', entity_id: itemId, action: 'create' },
  })
  comprova('el client no pot escriure a l’historial', !intrusio.ok, intrusio.data)

  console.log('\n[8] Aïllament entre cases (RLS)')
  await api('/rest/v1/rpc/create_household', {
    token: usuariB.token, method: 'POST', body: { p_name: 'Una altra casa' },
  })

  const espia = await api('/rest/v1/items?select=id,name', { token: usuariB.token })
  comprova('l’usuari B no veu cap objecte de la casa A', espia.ok && espia.data.length === 0, espia.data)

  const espiaUbi = await api('/rest/v1/locations?select=id,code', { token: usuariB.token })
  comprova('ni cap ubicació', espiaUbi.ok && espiaUbi.data.length === 0, espiaUbi.data)

  const espiaDirecte = await api(`/rest/v1/items?select=*&id=eq.${itemId}`, { token: usuariB.token })
  comprova('ni encara que en sàpiga l’uuid', espiaDirecte.data?.length === 0, espiaDirecte.data)

  const espiaCerca = await api('/rest/v1/rpc/search_items', {
    token: usuariB.token, method: 'POST', body: { p_query: 'martell', p_limit: 10 },
  })
  comprova('ni cercant-lo', Array.isArray(espiaCerca.data) && espiaCerca.data.length === 0, espiaCerca.data)

  const espiaCami = await api('/rest/v1/rpc/location_path', {
    token: usuariB.token, method: 'POST', body: { p_id: caixa.data.id },
  })
  comprova('ni demanant el camí d’una ubicació seva', espiaCami.data === null, espiaCami.data)

  const escriure = await api(`/rest/v1/items?id=eq.${itemId}`, {
    token: usuariB.token, method: 'PATCH', prefer: 'return=representation',
    body: { name: 'Segrestat' },
  })
  comprova('ni modificar-lo', !escriure.ok || escriure.data?.length === 0, escriure.data)

  console.log('\n[9] Escalada de privilegis')
  const autoAdmin = await api(`/rest/v1/profiles?id=eq.${usuariB.id}`, {
    token: usuariB.token, method: 'PATCH', prefer: 'return=representation',
    body: { household_id: householdA },
  })
  const saltat = Array.isArray(autoAdmin.data) && autoAdmin.data.length > 0
  comprova('ningú es pot canviar de casa editant el seu perfil', !saltat, autoAdmin.data)

  console.log('\n[10] Batec')
  const ping = await api('/rest/v1/rpc/ping', { token: usuariA.token, method: 'POST', body: {} })
  comprova('ping() respon', ping.ok && typeof ping.data === 'string', ping.data)
} catch (error) {
  fallades += 1
  console.error('\nError no controlat:', error.message)
} finally {
  console.log('\n[neteja]')
  // La casa primer i l'usuari despres: si es fa a l'inreves, el token amb que
  // es localitza la casa ja no val i queda penjada al projecte per sempre.
  if (usuariA) {
    await esborraCasaDe(usuariA.token)
    await esborraUsuari(usuariA.id)
  }
  if (usuariB) {
    await esborraCasaDe(usuariB.token)
    await esborraUsuari(usuariB.id)
  }
  console.log('  usuaris i cases de prova esborrats')
}

console.log(`\n${passades} passades, ${fallades} fallades`)
process.exit(fallades === 0 ? 0 : 1)
