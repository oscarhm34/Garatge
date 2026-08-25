import { colorArmari } from '@/lib/armari'
import { cn } from '@/lib/utils'

interface PlacaProps {
  /** Codi de la ubicacio: A2-M1-E3-C01. */
  codi: string
  /** Cami llegible: "Armari 2 · Doble porta · Prestatge 3". */
  cami: string | null
  mida?: 'fila' | 'gran'
  /** Sense marc, per quan ja va dins d'una targeta. */
  encastada?: boolean
  className?: string
}

/**
 * La placa d'ubicacio.
 *
 * Es l'element central de l'app i apareix a tot arreu: als resultats de cerca,
 * a la fitxa d'un objecte, al capcal d'una ubicacio i al full d'etiquetes.
 *
 * Imita l'adhesiu que hi ha enganxat a l'armari, amb la mateixa banda de color
 * i el mateix codi monoespaiat. Aixo es el que la fa util i no decorativa: qui
 * busca una cosa no ha de traduir una frase de la pantalla a un moble, sino
 * trobar a la paret el mateix rectangle que te a la ma.
 *
 * El codi va per davant del cami perque es el que es compara amb l'adhesiu de
 * reull; el cami hi es per als qui encara no s'han apres els codis.
 */
export function Placa({ codi, cami, mida = 'fila', encastada = false, className }: PlacaProps) {
  const color = colorArmari(codi)
  const gran = mida === 'gran'

  return (
    <div
      className={cn(
        'flex items-stretch overflow-hidden rounded-md',
        encastada ? 'bg-muted/60' : 'bg-card border',
        className,
      )}
    >
      {/* La banda de color es l'unica cosa que es reconeix a un metre de
          distancia, i es la mateixa que duu l'adhesiu de l'armari. */}
      <div
        className={cn('shrink-0', gran ? 'w-2.5' : 'w-1.5')}
        style={{ backgroundColor: color }}
        aria-hidden
      />

      <div className={cn('min-w-0 flex-1', gran ? 'px-4 py-3' : 'px-3 py-2')}>
        <p className={cn('codi truncate', gran ? 'text-2xl' : 'text-base')}>{codi}</p>
        {cami ? (
          <p
            className={cn(
              'text-muted-foreground truncate',
              gran ? 'mt-1 text-sm' : 'text-xs',
            )}
          >
            {cami}
          </p>
        ) : null}
      </div>
    </div>
  )
}

/**
 * Variant per a quan un objecte no te lloc assignat.
 *
 * Es una invitacio a arreglar-ho, no un buit: dir "sense lloc" i prou deixaria
 * l'objecte perdut per sempre, perque ningu sabria que se n'espera.
 */
export function PlacaSenseLloc({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'border-muted-foreground/40 text-muted-foreground flex items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm',
        className,
      )}
    >
      Encara no te lloc assignat
    </div>
  )
}
