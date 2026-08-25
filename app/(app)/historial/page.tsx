import Link from 'next/link'
import { getRecentActivity } from '@/lib/db/activity'
import type { ActivityAction, EntityType } from '@/lib/types/database'

export const metadata = { title: 'Historial' }

export default async function HistorialPage() {
  const entrades = await getRecentActivity(80)

  if (entrades.length === 0) {
    return (
      <p className="text-muted-foreground py-16 text-center text-sm">
        Encara no hi ha res a l&apos;historial.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Historial</h1>
        <p className="text-muted-foreground text-sm">Qui ha mogut què, i quan.</p>
      </div>

      <ol className="flex flex-col">
        {entrades.map((entrada) => (
          <li key={entrada.id} className="flex gap-3 border-b py-3 last:border-b-0">
            <time
              dateTime={entrada.created_at}
              className="text-muted-foreground w-16 shrink-0 pt-0.5 text-xs"
            >
              {formatRelative(entrada.created_at)}
            </time>

            <div className="min-w-0 flex-1 text-sm">
              <span className="font-medium">{entrada.actor_name ?? 'Algú'}</span>{' '}
              <span className="text-muted-foreground">{ACTION_TEXT[entrada.action]}</span>{' '}
              {entrada.entity_name ? (
                entrada.entity_type === 'location' ? (
                  <span className="font-medium">{entrada.entity_name}</span>
                ) : (
                  <Link
                    href={`/objectes/${entrada.entity_id}`}
                    className="font-medium hover:underline"
                  >
                    {entrada.entity_name}
                  </Link>
                )
              ) : (
                <span className="text-muted-foreground">{textEntitat(entrada.entity_type)}</span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

const ACTION_TEXT: Record<ActivityAction, string> = {
  create: 'va afegir',
  update: 'va editar',
  move: 'va moure',
  delete: 'va esborrar',
  borrow: 'es va endur',
  return: 'va tornar',
}

const ENTITY_TEXT: Record<EntityType, string> = {
  item: 'un objecte',
  location: 'una ubicació',
  loan: 'un préstec',
}

/**
 * entity_type és text amb un CHECK, no un enum, així que Postgres el retorna
 * com a `string`. Es tradueix amb una reserva perquè afegir un tipus nou al
 * CHECK no trenqui l'historial: sortirà genèric fins que s'afegeixi aquí.
 */
function textEntitat(tipus: string): string {
  return ENTITY_TEXT[tipus as EntityType] ?? 'alguna cosa'
}

/**
 * "avui", "ahir" o la data. El que interessa d'un historial de casa és si va
 * ser fa un moment o fa mesos, no l'hora exacta.
 */
function formatRelative(iso: string): string {
  const date = new Date(iso)
  const today = new Date()
  const days = Math.floor((today.getTime() - date.getTime()) / 86_400_000)

  if (days <= 0) return date.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })
  if (days === 1) return 'ahir'
  if (days < 7) return `fa ${days} dies`
  return date.toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' })
}
