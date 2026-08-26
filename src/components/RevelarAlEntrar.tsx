'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';

interface PropiedadesRevelar {
  children: ReactNode;
  retraso?: number; // milisegundos de retraso antes de animar, para escalonar listas
  className?: string;
}

// Envuelve contenido y lo revela con un fundido + desplazamiento sutil
// la primera vez que entra en el viewport. Respeta prefers-reduced-motion
// y no vuelve a ocultar el contenido una vez mostrado (no distrae al leer).
export default function RevelarAlEntrar({ children, retraso = 0, className = '' }: PropiedadesRevelar) {
  const referencia = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }
    const nodo = referencia.current;
    if (!nodo) return;

    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas[0].isIntersecting) {
          setVisible(true);
          observador.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    observador.observe(nodo);
    return () => observador.disconnect();
  }, []);

  return (
    <div
      ref={referencia}
      className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}
      style={{ transitionDelay: visible ? `${retraso}ms` : '0ms' }}
    >
      {children}
    </div>
  );
}
