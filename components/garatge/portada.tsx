import { cn } from '@/lib/utils'

/**
 * Il·lustracio de portada.
 *
 * Surt a les dues pantalles de fora de l'app —entrar i benvinguda— i enlloc
 * mes: un cop a dins, el que fa falta es espai per als resultats, no decoracio.
 *
 * Duu el nom escrit a dins, aixi que aquestes pantalles no hi posen cap titol
 * a sobre: repetir-lo nomes faria que es llegissin dos cops.
 */
export function Portada({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- ja esta optimitzada i versionada (scripts/prepara-portada.mjs); passar-la per l'optimitzador de Next la tornaria a comprimir i gastaria quota de Vercel per res
    <img
      src="/portada/portada-912.webp"
      srcSet="/portada/portada-480.webp 480w, /portada/portada-912.webp 912w"
      sizes="(max-width: 480px) 100vw, 480px"
      width={912}
      height={1182}
      alt="Una família ordenant el garatge: l'armari obert ple de caixes etiquetades, el pare amb el mòbil a la mà i la canalla portant-hi coses."
      // La primera pantalla que es veu; sense això el navegador la posa a la
      // cua darrere del CSS i la portada apareix a trossos.
      fetchPriority="high"
      decoding="async"
      className={cn('h-auto w-full rounded-lg', className)}
    />
  )
}
