import type Lenis from 'lenis';

// Registro de la instancia activa de Lenis en `window` (global real del navegador)
// en vez de una variable de módulo: Next.js puede empaquetar este archivo en
// más de un chunk de cliente (el layout raíz por un lado, cada página 'use client'
// por otro), y una variable de módulo normal terminaría duplicada —cada chunk con
// su propia copia, nunca sincronizadas—. `window` es el único lugar realmente
// compartido entre todos los bundles.
declare global {
  interface Window {
    __lenis?: Lenis | null;
  }
}

export function registrarLenis(instancia: Lenis | null) {
  if (typeof window !== 'undefined') window.__lenis = instancia;
}

export function obtenerLenis(): Lenis | null {
  if (typeof window === 'undefined') return null;
  return window.__lenis ?? null;
}

// Alto aproximado del header fijo: se resta al destino para que la sección
// no quede tapada al llegar por scroll suave.
export const ALTO_HEADER = 88;

// Manejador de click reutilizable para anclas (navbar, guías laterales de
// /crout y /fourier): en vez del salto nativo del navegador, anima el scroll.
// Usa Lenis si ya está montado; si no (recién cargó la página, o el usuario
// prefiere menos movimiento), cae a un scroll nativo que igual respeta esa
// preferencia. En ambos casos se cancela el salto brusco del navegador.
export function desplazarHaciaAncla(
  evento: React.MouseEvent<HTMLAnchorElement>,
  href: string,
  offset: number = ALTO_HEADER
) {
  const destino = document.getElementById(href.replace('#', ''));
  if (!destino) return;
  evento.preventDefault();

  const lenis = obtenerLenis();
  if (lenis) {
    lenis.scrollTo(destino, { offset: -offset });
    return;
  }

  const prefiereMovimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const destinoY = destino.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: destinoY, behavior: prefiereMovimientoReducido ? 'auto' : 'smooth' });
}
