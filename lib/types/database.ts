/**
 * Tipus de l'aplicacio.
 *
 * `database.generated.ts` el genera Supabase a partir de l'esquema real i no
 * s'edita mai a ma:
 *
 *   npm run db:types
 *
 * Aquest fitxer hi posa a sobre dues coses: els alies curts que fa servir l'app
 * i la correccio de nul-labilitat de les vistes.
 */
import type { Database as Generada, Json } from '@/lib/types/database.generated'

export type { Json }

type Taules = Generada['public']['Tables']
type VistesGenerades = Generada['public']['Views']
type FuncionsGenerades = Generada['public']['Functions']
type Enums = Generada['public']['Enums']

export type MemberRole = Enums['member_role']
export type LocationKind = Enums['location_kind']
export type ActivityAction = Enums['activity_action']

/** activity_log.entity_type es text amb un CHECK, no un enum de Postgres. */
export type EntityType = 'item' | 'location' | 'loan'

/**
 * Correccio de nul-labilitat de les vistes.
 *
 * Postgres no propaga el NOT NULL de les columnes a traves d'una vista, aixi
 * que el generador les marca totes com a nul-lables. Deixar-ho aixi faria que
 * `item.name` fos `string | null` a tota l'app i que calgues comprovar-ho (o
 * posar-hi un `!`) a cada component, cosa que acabaria amagant els nuls que si
 * que son reals: el cami d'un objecte sense ubicacio assignada, per exemple.
 *
 * La correccio s'injecta dins del tipus Database, i no nomes als alies, perque
 * el que retorna supabase-js ja arribi ben tipat a tot arreu.
 *
 * Les claus surten de com estan definides les vistes a
 * supabase/migrations/20260825120600_search.sql. Si aquell fitxer canvia,
 * aquestes llistes tambe han de canviar.
 */
type Concreta<Fila, Claus extends keyof Fila> = Omit<Fila, Claus> & {
  [K in Claus]-?: NonNullable<Fila[K]>
}

type ClausItem =
  | 'id' | 'household_id' | 'name' | 'quantity' | 'created_at' | 'updated_at' | 'tags'

type ClausUbicacio =
  | 'id' | 'household_id' | 'kind' | 'name' | 'code' | 'position'
  | 'path' | 'child_count' | 'item_count' | 'item_count_deep'

export type ItemDetail = Concreta<VistesGenerades['items_detail']['Row'], ClausItem>
export type LocationDetail = Concreta<VistesGenerades['locations_detail']['Row'], ClausUbicacio>

export type Database = Omit<Generada, 'public'> & {
  public: Omit<Generada['public'], 'Views' | 'Functions'> & {
    Views: Omit<VistesGenerades, 'items_detail' | 'locations_detail'> & {
      items_detail: Omit<VistesGenerades['items_detail'], 'Row'> & { Row: ItemDetail }
      locations_detail: Omit<VistesGenerades['locations_detail'], 'Row'> & { Row: LocationDetail }
    }
    Functions: Omit<FuncionsGenerades, 'search_items' | 'add_location'> & {
      search_items: Omit<FuncionsGenerades['search_items'], 'Returns'> & { Returns: ItemDetail[] }
      // El generador declara tots els parametres com a no nuls perque Postgres
      // no distingeix. Pero add_location() tracta p_parent IS NULL a posta: es
      // el cas d'una ubicacio arrel, un armari que no penja de res.
      add_location: Omit<FuncionsGenerades['add_location'], 'Args'> & {
        Args: {
          p_parent: string | null
          p_kind: LocationKind
          p_name?: string | null
          p_color?: string | null
        }
      }
    }
  }
}

export type Household = Taules['households']['Row']
export type Profile = Taules['profiles']['Row']
export type LocationRow = Taules['locations']['Row']
export type Category = Taules['categories']['Row']
export type Tag = Taules['tags']['Row']
export type Item = Taules['items']['Row']
export type Loan = Taules['loans']['Row']
export type Activity = Taules['activity_log']['Row']
