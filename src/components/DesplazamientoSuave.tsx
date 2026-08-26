'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { registrarLenis } from '@/src/lib/lenis';

// Envoltorio que activa un scroll suave e inercial en toda la aplicación.
// Se monta una única vez en el layout raíz; no renderiza nada propio.
export default function DesplazamientoSuave() {
  useEffect(() => {
    const prefiereMovimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefiereMovimientoReducido) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    registrarLenis(lenis);

    let frame: number;
    function loopAnimacion(tiempo: number) {
      lenis.raf(tiempo);
      frame = requestAnimationFrame(loopAnimacion);
    }
    frame = requestAnimationFrame(loopAnimacion);

    return () => {
      cancelAnimationFrame(frame);
      registrarLenis(null);
      lenis.destroy();
    };
  }, []);

  return null;
}
