'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Loader2, PackageOpen, Search, X } from 'lucide-react'
import { ItemCard } from '@/components/garatge/item-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiFetch } from '@/lib/fetcher'
import type { ItemDetail } from '@/lib/types/database'

interface SearchResponse {
  resultats: ItemDetail[]
  fotos: Record<string, string>
}

/** Resultats d'una consulta concreta, amb la consulta a dins. */
interface SearchState {
  query: string
  items: ItemDetail[]
  photos: Record<string, string>
  error: string | null
}

/**
 * Cercador de la pàgina d'inici.
 *
 * Els `children` són el contingut renderitzat al servidor (últims objectes,
 * coses que té algú) i es mostren mentre no s'ha escrit res. Així la pàgina és
 * útil des del primer instant i no una caixa buida.
 */
export function Cercador({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState('')
  const [state, setState] = useState<SearchState | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const trimmed = query.trim()

  // Els resultats porten la consulta que els va produir. Comparar-la amb el que
  // hi ha escrit ara evita haver de netejar l'estat des de dins de l'efecte
  // —que provocaria renders en cascada— i alhora impedeix ensenyar els
  // resultats de "mar" mentre ja s'ha acabat d'escriure "martell".
  const fresh = state !== null && state.query === trimmed ? state : null
  const loading = trimmed.length > 0 && fresh === null

  useEffect(() => {
    if (trimmed.length === 0) return

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const data = await apiFetch<SearchResponse>(
          `/api/cerca?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        )
        setState({ query: trimmed, items: data.resultats, photos: data.fotos, error: null })
      } catch (caught) {
        if (controller.signal.aborted) return
        setState({
          query: trimmed,
          items: [],
          photos: {},
          error: caught instanceof Error ? caught.message : 'No s’ha pogut cercar',
        })
      }
    }, 180)

    return () => {
      // Es cancel·la la petició anterior a cada tecla: sense això, una resposta
      // lenta podria arribar quan ja no interessa i gastar dades per res.
      controller.abort()
      clearTimeout(timer)
    }
  }, [trimmed])

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2"
          aria-hidden
        />
        <Input
          ref={inputRef}
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          aria-label="Cerca un objecte"
          placeholder="Què busques? Un martell, la cinta aïllant..."
          className="h-14 pr-12 pl-11 text-base"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {trimmed.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Esborrar la cerca"
            className="absolute top-1/2 right-2 -translate-y-1/2"
            onClick={() => {
              setQuery('')
              inputRef.current?.focus()
            }}
          >
            {loading ? <Loader2 className="animate-spin" /> : <X />}
          </Button>
        ) : null}
      </div>

      {trimmed.length === 0 ? (
        children
      ) : fresh === null ? (
        <p className="text-muted-foreground py-8 text-center text-sm">Buscant…</p>
      ) : fresh.error !== null ? (
        <p className="text-destructive py-8 text-center text-sm">{fresh.error}</p>
      ) : fresh.items.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-3 py-12 text-center">
          <PackageOpen className="size-10" aria-hidden />
          <div>
            <p className="font-medium">Cap resultat per a «{trimmed}»</p>
            <p className="text-sm">
              Potser encara no està inventariat. Escaneja el QR de l&apos;armari on és i afegeix-lo.
            </p>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {fresh.items.map((item) => (
            <li key={item.id}>
              <ItemCard
                item={item}
                photoUrl={item.photo_url ? fresh.photos[item.photo_url] : undefined}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
