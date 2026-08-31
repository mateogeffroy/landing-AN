import { ReactNode } from 'react';

interface PropiedadesRevelar {
  children: ReactNode;
  retraso?: number;
  className?: string;
}

// Wrapper de compatibilidad: antes animaba una aparición al entrar en el viewport,
// pero si el usuario frenaba el scroll antes de que el IntersectionObserver disparara
// el contenido quedaba invisible, dando la falsa sensación de haber llegado al final
// de la página. Se retiró la animación; el contenido queda siempre visible.
export default function RevelarAlEntrar({ children, className = '' }: PropiedadesRevelar) {
  return <div className={className}>{children}</div>;
}
