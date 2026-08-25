'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { Camera, ChevronDown, Loader2, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { apiPost } from '@/lib/fetcher'
import { prepareImage, type PreparedImage } from '@/lib/image'
import { PHOTO_BUCKET, photoPath } from '@/lib/photo-path'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/lib/types/database'

interface Suggeriment {
  nom: string
  categoria: string
  etiquetes: string[]
  quantitat: number
  confianca: number
}

interface Props {
  householdId: string
  locationId: string | null
  /** Codi de la ubicació, per poder-hi tornar després de desar. */
  locationCode: string | null
  categories: Category[]
}

/**
 * Alta d'un objecte.
 *
 * El cami normal es un sol camp: el nom. El lloc ja el sap perque s'hi ha
 * arribat escanejant el QR, i tota la resta —quantitat, categoria, etiquetes,
 * descripcio— viu plegada darrere de "Mes detalls".
 *
 * Es aixi perque desar una cosa al garatge ha de costar menys que deixar-la
 * en un racó. Sis camps per apuntar un martell garanteixen que a la tercera
 * eina ja ningu no ho fa.
 */
export function NouObjecteForm({ householdId, locationId, locationCode, categories }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [foto, setFoto] = useState<PreparedImage | null>(null)
  const [fotoUrl, setFotoUrl] = useState<string | null>(null)
  const [suggeriments, setSuggeriments] = useState<Suggeriment[] | null>(null)
  const [triats, setTriats] = useState<Set<number>>(new Set())

  const [nom, setNom] = useState('')
  const [descripcio, setDescripcio] = useState('')
  const [quantitat, setQuantitat] = useState(1)
  const [categoriaId, setCategoriaId] = useState('')
  const [etiquetes, setEtiquetes] = useState('')

  const [analitzant, setAnalitzant] = useState(false)
  const [desant, setDesant] = useState(false)

  async function triarFoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const prepared = await prepareImage(file)
      setFoto(prepared)
      setFotoUrl((previous) => {
        // Alliberar la URL anterior; si no, cada foto nova deixa un blob penjat
        // a memòria fins que es recarregui la pàgina.
        if (previous) URL.revokeObjectURL(previous)
        return URL.createObjectURL(prepared.blob)
      })
      setSuggeriments(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No s’ha pogut llegir la foto')
    }
  }

  async function analitzar() {
    if (!foto) return
    setAnalitzant(true)
    try {
      const { objectes } = await apiPost<{ objectes: Suggeriment[] }>('/api/ia/identificar', {
        imatge: foto.base64,
        tipus: foto.mediaType,
      })
      setSuggeriments(objectes)
      // Es marquen només els que la IA veu clars. La resta es queden a la
      // llista per si algú els reconeix, però no s'alten sense mirar-los.
      setTriats(new Set(objectes.map((_, i) => i).filter((i) => objectes[i].confianca >= 0.6)))
      if (objectes.length === 0) toast.info('No s’ha reconegut res clarament en aquesta foto')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No s’ha pogut analitzar')
    } finally {
      setAnalitzant(false)
    }
  }

  /** Puja la foto un sol cop i retorna la ruta que es desarà a la fila. */
  async function pujarFoto(): Promise<string | null> {
    if (!foto) return null
    const extension = foto.mediaType === 'image/webp' ? 'webp' : 'jpg'
    const path = photoPath(householdId, 'items', crypto.randomUUID(), extension)

    const supabase = createClient()
    const { error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(path, foto.blob, { contentType: foto.mediaType, upsert: false })

    if (error) {
      // La foto no és imprescindible: val més desar l'objecte sense imatge que
      // perdre el que la persona acaba d'escriure.
      toast.warning('L’objecte es desarà sense foto', { description: error.message })
      return null
    }
    return path
  }

  function categoriaIdPerNom(nomCategoria: string): string | null {
    const trobada = categories.find(
      (category) => category.name.toLowerCase() === nomCategoria.trim().toLowerCase(),
    )
    return trobada?.id ?? null
  }

  function tornar() {
    router.push(locationCode === null ? '/' : `/l/${locationCode}`)
    router.refresh()
  }

  async function desarSuggeriments() {
    if (!suggeriments) return
    const seleccionats = [...triats].map((index) => suggeriments[index]).filter(Boolean)
    if (seleccionats.length === 0) return

    setDesant(true)
    try {
      const path = await pujarFoto()
      for (const item of seleccionats) {
        await apiPost('/api/objectes', {
          nom: item.nom,
          descripcio: null,
          ubicacio: locationId,
          categoria: categoriaIdPerNom(item.categoria),
          quantitat: item.quantitat,
          foto: path,
          notes: null,
          etiquetes: item.etiquetes,
        })
      }
      toast.success(`${seleccionats.length} objectes desats`)
      // Es torna a la ubicació per poder encadenar caixes: qui està inventariant
      // un prestatge en fa quatre fotos seguides, no una.
      tornar()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No s’han pogut desar')
      setDesant(false)
    }
  }

  async function desar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setDesant(true)
    try {
      const path = await pujarFoto()
      await apiPost('/api/objectes', {
        nom: nom.trim(),
        descripcio: descripcio.trim() === '' ? null : descripcio.trim(),
        ubicacio: locationId,
        categoria: categoriaId === '' ? null : categoriaId,
        quantitat,
        foto: path,
        notes: null,
        etiquetes: etiquetes
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0),
      })
      toast.success(`${nom.trim()} desat`)
      tornar()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No s’ha pogut desar')
      setDesant(false)
    }
  }

  return (
    <form onSubmit={desar} className="flex flex-col gap-4">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        // capture obre directament la càmera del darrere al mòbil en comptes de
        // la galeria, que és el que es vol mentre s'està davant del prestatge.
        capture="environment"
        className="hidden"
        onChange={triarFoto}
      />

      <div className="flex flex-col gap-2">
        <Label htmlFor="nom" className="text-base">
          Què hi guardes?
        </Label>
        <Input
          id="nom"
          required
          maxLength={120}
          autoFocus
          enterKeyHint="done"
          placeholder="Martell"
          className="h-16 text-lg"
          value={nom}
          onChange={(event) => setNom(event.target.value)}
        />
      </div>

      {fotoUrl ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element -- blob local, no passa per l'optimitzador */}
          <img src={fotoUrl} alt="Foto triada" className="max-h-56 w-full rounded-lg object-cover" />
          <Button
            type="button"
            size="icon"
            variant="secondary"
            aria-label="Treure la foto"
            className="absolute top-2 right-2 size-11"
            onClick={() => {
              URL.revokeObjectURL(fotoUrl)
              setFoto(null)
              setFotoUrl(null)
              setSuggeriments(null)
              if (fileRef.current) fileRef.current.value = ''
            }}
          >
            <X />
          </Button>
        </div>
      ) : null}

      <Button type="submit" size="lg" className="h-16 text-base" disabled={desant || nom.trim().length === 0}>
        {desant ? <Loader2 className="animate-spin" /> : null}
        Desar
      </Button>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-12 flex-1"
          onClick={() => fileRef.current?.click()}
        >
          <Camera />
          {foto ? 'Una altra foto' : 'Foto'}
        </Button>

        {foto && suggeriments === null ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-12 flex-1"
            onClick={analitzar}
            disabled={analitzant}
          >
            {analitzant ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {analitzant ? 'Mirant…' : 'Què hi ha?'}
          </Button>
        ) : null}
      </div>

      {suggeriments !== null && suggeriments.length > 0 ? (
        <section className="flex flex-col gap-2 rounded-lg border p-3">
          <h2 className="text-sm font-semibold">Hi he vist això</h2>
          <ul className="flex flex-col gap-1">
            {suggeriments.map((item, index) => (
              <li key={`${item.nom}-${index}`}>
                <label className="hover:bg-accent flex min-h-12 cursor-pointer items-center gap-3 rounded-md px-2">
                  <Checkbox
                    checked={triats.has(index)}
                    onCheckedChange={(checked) =>
                      setTriats((previous) => {
                        const next = new Set(previous)
                        if (checked === true) next.add(index)
                        else next.delete(index)
                        return next
                      })
                    }
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {item.nom}
                    {item.quantitat > 1 ? (
                      <span className="text-muted-foreground"> ×{item.quantitat}</span>
                    ) : null}
                  </span>
                  {item.confianca < 0.6 ? (
                    <Badge variant="outline" className="shrink-0 text-xs">
                      dubtós
                    </Badge>
                  ) : null}
                </label>
              </li>
            ))}
          </ul>

          <Button
            type="button"
            size="lg"
            className="h-14"
            onClick={desarSuggeriments}
            disabled={desant || triats.size === 0}
          >
            {desant ? <Loader2 className="animate-spin" /> : null}
            Desar {triats.size} {triats.size === 1 ? 'objecte' : 'objectes'}
          </Button>
        </section>
      ) : null}

      {/* Plegat a proposit. Aquests camps ajuden a buscar mes endavant, pero
          demanar-los abans de desar es el que fa que no es desi res. */}
      <details className="group rounded-lg border">
        <summary className="text-muted-foreground flex min-h-12 cursor-pointer items-center justify-between px-4 text-sm font-medium">
          Més detalls
          <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
        </summary>

        <div className="flex flex-col gap-4 border-t p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="quantitat">Quantitat</Label>
              <Input
                id="quantitat"
                type="number"
                inputMode="numeric"
                min={1}
                max={9999}
                value={quantitat}
                onChange={(event) => setQuantitat(Math.max(1, Number(event.target.value)))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="categoria">Categoria</Label>
              {/* select natiu i no el component: al mòbil obre la roda del
                  sistema, que es fa servir molt més ràpid amb una mà */}
              <select
                id="categoria"
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                value={categoriaId}
                onChange={(event) => setCategoriaId(event.target.value)}
              >
                <option value="">Cap</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="etiquetes">Etiquetes</Label>
            <Input
              id="etiquetes"
              placeholder="fusteria, mà"
              value={etiquetes}
              onChange={(event) => setEtiquetes(event.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              Separades per comes. Serveixen per buscar-lo després.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="descripcio">Detalls</Label>
            <Textarea
              id="descripcio"
              rows={2}
              maxLength={2000}
              placeholder="El de mànec de fusta, 300 g"
              value={descripcio}
              onChange={(event) => setDescripcio(event.target.value)}
            />
          </div>
        </div>
      </details>
    </form>
  )
}
