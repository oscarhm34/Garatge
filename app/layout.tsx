import type { Metadata, Viewport } from 'next'
import { Archivo, IBM_Plex_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

/**
 * Archivo per a la interficie: grotesca de senyaletica, amb l'alcada d'x alta
 * que cal per llegir de reull i amb poca llum.
 *
 * IBM Plex Mono per als codis d'ubicacio. Es una lletra d'enginyeria, amb el
 * zero barrat i l'u amb peu, i aixo importa quan el que fas es comparar el que
 * hi ha a la pantalla amb el que hi ha imprès a l'adhesiu de l'armari.
 */
const archivo = Archivo({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
})

const plexMono = IBM_Plex_Mono({
  variable: '--font-plex-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'OrganizApp Garaje', template: '%s · OrganizApp Garaje' },
  description: 'On és cada cosa del garatge de casa.',
  applicationName: 'OrganizApp Garaje',
  appleWebApp: { capable: true, title: 'OrganizApp', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f3f1ed' },
    { media: '(prefers-color-scheme: dark)', color: '#14161a' },
  ],
  width: 'device-width',
  initialScale: 1,
  // L'escàner de QR i els formularis d'alta es fan servir amb una mà; el zoom
  // accidental en fer doble toc molesta més del que ajuda.
  maximumScale: 5,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ca" className={`${archivo.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="bg-background text-foreground flex min-h-full flex-col">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
