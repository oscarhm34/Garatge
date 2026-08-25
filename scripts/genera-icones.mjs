/**
 * Genera les icones de la PWA sense cap dependència.
 *
 * Es dibuixen píxel a píxel i es codifiquen en PNG a mà amb el zlib de Node.
 * Podria fer-se amb sharp o amb un rasteritzador d'SVG, però afegir 30 MB de
 * dependències natives per a tres fitxers que no canviaran mai no surt a compte.
 *
 *   node scripts/genera-icones.mjs
 */
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const FONS = [10, 10, 10]
const TINTA = [250, 250, 250]

/** Taula CRC-32, la que demana l'especificació del PNG. */
const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buffer) {
  let c = 0xffffffff
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([length, body, crc])
}

function encodePng(width, height, rgb) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bits per canal
  ihdr[9] = 2 // color de tipus truecolor
  // 10, 11 i 12 queden a zero: compressió, filtre i entrellaçat estàndard.

  // Cada fila d'un PNG va precedida pel byte de filtre; 0 vol dir "sense filtre".
  const stride = width * 3
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0
    rgb.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/**
 * Dibuixa un armari de tres portes: és literalment el que hi ha al garatge, i
 * es reconeix a 48 px, que és la mida real a la pantalla d'inici d'un mòbil.
 */
function dibuixa(size, padding) {
  const pixels = Buffer.alloc(size * size * 3)
  for (let i = 0; i < size * size; i += 1) {
    pixels[i * 3] = FONS[0]
    pixels[i * 3 + 1] = FONS[1]
    pixels[i * 3 + 2] = FONS[2]
  }

  const set = (x, y) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const i = (y * size + x) * 3
    pixels[i] = TINTA[0]
    pixels[i + 1] = TINTA[1]
    pixels[i + 2] = TINTA[2]
  }

  const rect = (x0, y0, x1, y1, thickness) => {
    for (let t = 0; t < thickness; t += 1) {
      for (let x = x0; x <= x1; x += 1) {
        set(x, y0 + t)
        set(x, y1 - t)
      }
      for (let y = y0; y <= y1; y += 1) {
        set(x0 + t, y)
        set(x1 - t, y)
      }
    }
  }

  const vline = (x, y0, y1, thickness) => {
    for (let t = 0; t < thickness; t += 1) {
      for (let y = y0; y <= y1; y += 1) set(x + t, y)
    }
  }

  const fill = (x0, y0, x1, y1) => {
    for (let y = y0; y <= y1; y += 1) for (let x = x0; x <= x1; x += 1) set(x, y)
  }

  const inset = Math.round(size * padding)
  const left = inset
  const right = size - inset - 1
  const top = Math.round(size * (padding + 0.04))
  const bottom = size - inset - 1
  const thickness = Math.max(2, Math.round(size * 0.035))

  rect(left, top, right, bottom, thickness)

  // Dues divisions verticals -> tres portes.
  const width = right - left
  vline(left + Math.round(width / 3), top, bottom, thickness)
  vline(left + Math.round((width * 2) / 3), top, bottom, thickness)

  // Manetes: un traç curt a la banda dreta de cada porta. La separació es mesura
  // des del muntant de la porta i ha de superar el gruix del marc, o la maneta
  // de la porta de la dreta es fon amb la vora de l'armari.
  const handleY = Math.round(top + (bottom - top) * 0.55)
  const handleH = Math.max(2, Math.round(size * 0.085))
  const handleW = Math.max(2, Math.round(size * 0.022))
  const handleGap = thickness + Math.round(size * 0.045)
  for (let door = 1; door <= 3; door += 1) {
    const x = left + Math.round((width * door) / 3) - handleGap
    fill(x, handleY, x + handleW - 1, handleY + handleH)
  }

  return pixels
}

const outDir = join(process.cwd(), 'public', 'icones')
mkdirSync(outDir, { recursive: true })

const fitxers = [
  // El maskable necessita més marge: Android hi retalla un cercle o un
  // rectangle arrodonit i menja el 20 % exterior.
  { nom: 'icona-192.png', size: 192, padding: 0.14 },
  { nom: 'icona-512.png', size: 512, padding: 0.14 },
  { nom: 'icona-maskable-512.png', size: 512, padding: 0.24 },
]

for (const { nom, size, padding } of fitxers) {
  const png = encodePng(size, size, dibuixa(size, padding))
  writeFileSync(join(outDir, nom), png)
  console.log(`${nom} — ${size}×${size}, ${(png.length / 1024).toFixed(1)} kB`)
}
