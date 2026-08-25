import { Suspense } from 'react'
import { Portada } from '@/components/garatge/portada'
import { LoginForm } from './login-form'

export const metadata = { title: 'Entrar' }

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const params = await searchParams
  const raw = params.next
  const next = typeof raw === 'string' ? raw : '/'

  // Només rutes internes. Sense aquesta comprovació, un enllaç
  // /login?next=https://... convertiria la pàgina d'entrada en un redirector obert.
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/'

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-5 py-8">
      {/* La il·lustració ja duu el nom escrit a dins, així que aquesta pantalla
          no hi posa cap títol a sobre: es llegiria dues vegades. */}
      <Portada />

      <Suspense>
        <LoginForm next={safeNext} />
      </Suspense>
    </main>
  )
}
