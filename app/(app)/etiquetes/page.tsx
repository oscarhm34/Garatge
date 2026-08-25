import { Printer } from 'lucide-react'
import { BotoImprimir } from '@/components/garatge/boto-imprimir'
import { createClient } from '@/lib/supabase/server'
import { qrSvgBatch } from '@/lib/qr'
import type { LocationDetail } from '@/lib/types/database'

export const metadata = { title: 'Etiquetes' }

/**
 * Full d'etiquetes per imprimir.
 *
 * Les mides estan quadrades per a fulls adhesius Avery L7159 i equivalents:
 * 63,5 × 33,9 mm, 3 columnes × 8 files. Es podria fer una graella qualsevol i
 * retallar amb tisores, però enganxar 40 etiquetes retallades a mà a la paret
 * del garatge és exactament la mena de feina que fa abandonar el projecte.
 */
export default async function EtiquetesPage({ searchParams }: PageProps<'/etiquetes'>) {
  const params = await searchParams
  const filtre = typeof params.codi === 'string' ? params.codi.toUpperCase() : null

  const supabase = await createClient()
  const query = supabase
    .from('locations_detail')
    .select('*')
    .order('code', { ascending: true })

  const { data } = filtre === null ? await query : await query.eq('code', filtre)
  const ubicacions: LocationDetail[] = data ?? []
  const qrs = await qrSvgBatch(ubicacions.map((location) => location.code))

  return (
    <div className="flex flex-col gap-4">
      <div className="print:hidden">
        <h1 className="text-xl font-semibold">Etiquetes QR</h1>
        <p className="text-muted-foreground text-sm">
          {filtre === null
            ? `${ubicacions.length} etiquetes, una per ubicació.`
            : `Etiqueta de ${filtre}.`}{' '}
          Imprimeix-les en fulls adhesius de 24 (63,5 × 33,9 mm) i enganxa cadascuna al seu lloc.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <BotoImprimir />
        </div>
        <p className="text-muted-foreground mt-3 text-xs">
          Al quadre d&apos;impressió: mida real (100 %), sense marges i sense capçaleres.
        </p>
      </div>

      {ubicacions.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center text-sm print:hidden">
          Encara no hi ha cap ubicació per etiquetar.
        </p>
      ) : null}

      <div className="full-d-etiquetes">
        {ubicacions.map((location) => (
          <div key={location.id} className="etiqueta">
            <div
              className="etiqueta-qr"
              // El SVG el genera qrcode al servidor a partir del codi de la
              // ubicació; no hi entra res escrit per cap usuari.
              dangerouslySetInnerHTML={{ __html: qrs.get(location.code) ?? '' }}
            />
            <div className="etiqueta-text">
              <span className="etiqueta-codi">{location.code}</span>
              <span className="etiqueta-nom">{location.name}</span>
              {location.path ? <span className="etiqueta-cami">{location.path}</span> : null}
            </div>
          </div>
        ))}
      </div>

      <div className="text-muted-foreground flex items-center gap-2 text-xs print:hidden">
        <Printer className="size-4" aria-hidden />
        Consell: enganxa primer les de les portes. Els prestatges i les caixes, quan els creïs.
      </div>
    </div>
  )
}
