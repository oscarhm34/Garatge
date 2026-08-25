'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { apiPost } from '@/lib/fetcher'

export function BenvingudaForm() {
  const router = useRouter()
  const [nom, setNom] = useState('Casa')
  const [codi, setCodi] = useState('')
  const [armaris, setArmaris] = useState(3)
  const [portes, setPortes] = useState(3)
  const [pending, setPending] = useState(false)

  async function crear(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    try {
      await apiPost('/api/casa', { accio: 'crear', nom })
      // El muntatge del garatge va en una crida a part: si falla, la casa ja
      // està creada i no cal repetir el primer pas.
      const { creades } = await apiPost<{ creades: number }>('/api/casa/bootstrap', {
        armaris,
        portes,
      })
      toast.success(`Casa creada amb ${creades} ubicacions`)
      router.refresh()
      router.push('/mapa')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Hi ha hagut un problema')
      setPending(false)
    }
  }

  async function unir(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    try {
      await apiPost('/api/casa', { accio: 'unir', codi })
      toast.success('Ja hi ets')
      router.refresh()
      router.push('/')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Hi ha hagut un problema')
      setPending(false)
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardContent>
        <Tabs defaultValue="crear">
          <TabsList className="w-full">
            <TabsTrigger value="crear" className="flex-1">
              Crear la casa
            </TabsTrigger>
            <TabsTrigger value="unir" className="flex-1">
              Tinc un codi
            </TabsTrigger>
          </TabsList>

          <TabsContent value="crear" className="pt-4">
            <form onSubmit={crear} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="nom">Com es diu?</Label>
                <Input
                  id="nom"
                  required
                  maxLength={80}
                  value={nom}
                  onChange={(event) => setNom(event.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="armaris">Armaris</Label>
                  <Input
                    id="armaris"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={20}
                    value={armaris}
                    onChange={(event) => setArmaris(Number(event.target.value))}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="portes">Portes per armari</Label>
                  <Input
                    id="portes"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={20}
                    value={portes}
                    onChange={(event) => setPortes(Number(event.target.value))}
                  />
                </div>
              </div>

              <p className="text-muted-foreground text-xs">
                Els prestatges i les caixes els afegiràs des de dins de cada porta, quan les obris
                i vegis com estan repartides de veritat.
              </p>

              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="animate-spin" /> : null}
                Crear i muntar el garatge
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="unir" className="pt-4">
            <form onSubmit={unir} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="codi">Codi d&apos;invitació</Label>
                <Input
                  id="codi"
                  required
                  maxLength={16}
                  placeholder="A1B2C3D4"
                  className="text-center font-mono text-lg tracking-widest uppercase"
                  value={codi}
                  onChange={(event) => setCodi(event.target.value.toUpperCase())}
                />
                <p className="text-muted-foreground text-xs">
                  El troba qui hagi creat la casa, a Ajustos.
                </p>
              </div>
              <Button type="submit" disabled={pending || codi.length < 4}>
                {pending ? <Loader2 className="animate-spin" /> : null}
                Entrar a la casa
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
