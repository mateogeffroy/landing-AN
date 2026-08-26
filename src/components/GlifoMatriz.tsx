'use client';

// Pequeño glifo que dibuja un patrón de celdas en una grilla 3x3.
// Se usa como ícono de las guías de navegación lateral: cada nodo
// dibuja una forma abstracta ligada al contenido de su sección.
export default function GlifoMatriz({ celdas, className = '' }: { celdas: boolean[][]; className?: string }) {
  return (
    <svg viewBox="0 0 29 29" className={`w-6 h-6 ${className}`} aria-hidden="true">
      {celdas.map((fila, r) =>
        fila.map((activa, c) => (
          <rect
            key={`${r}-${c}`}
            x={c * 9.5 + 1}
            y={r * 9.5 + 1}
            width={7.5}
            height={7.5}
            rx={1.5}
            fill={activa ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeOpacity={activa ? 0 : 0.35}
          />
        ))
      )}
    </svg>
  );
}
