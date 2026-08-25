import type { MetadataRoute } from 'next'

/**
 * Manifest de la PWA: permet "Afegir a la pantalla d'inici" al mòbil i que
 * l'app s'obri sense la barra del navegador. No cal passar per cap botiga.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'OrganizApp Garaje',
    short_name: 'OrganizApp',
    description: 'Busca qualsevol cosa del garatge i mira en quin armari és.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f3f1ed',
    theme_color: '#17181a',
    lang: 'ca',
    categories: ['productivity', 'utilities'],
    icons: [
      { src: '/icones/icona-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icones/icona-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icones/icona-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Escanejar un QR', short_name: 'Escanejar', url: '/escanejar' },
      { name: 'Afegir un objecte', short_name: 'Afegir', url: '/objectes/nou' },
    ],
  }
}
