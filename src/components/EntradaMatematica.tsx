'use client';

import { useEffect, useRef, useState } from 'react';

// Declaracion global para instruir a TypeScript sobre la existencia y estructura 
// del elemento HTML personalizado <math-field> inyectado por MathLive.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        class?: string;
        'menu-button'?: string;
      };
    }
  }
}

// Interfaz que define las propiedades esperadas por el componente de entrada matematica.
interface PropiedadesEntradaMatematica {
  valorLatex: string;
  alCambiarMatematica: (latex: string, formatoAscii: string) => void;
  textoReferencia?: string;
}

// Componente envoltorio (wrapper) para la libreria MathLive.
// Provee un teclado virtual matematico y un campo de entrada renderizado visualmente en LaTeX.
export default function EntradaMatematica({ 
  valorLatex, 
  alCambiarMatematica, 
  textoReferencia 
}: PropiedadesEntradaMatematica) {
  
  const referenciaCampoMatematico = useRef<any>(null);
  const [estaMontado, setEstaMontado] = useState(false);

  // Importacion diferida (Dynamic Import) de la libreria MathLive.
  // Es estrictamente necesario en Next.js para evitar errores de hidratacion y ejecucion 
  // en el renderizado del lado del servidor (SSR), ya que MathLive depende del objeto global 'window'.
  useEffect(() => {
    setEstaMontado(true);
    import('mathlive').then(() => {
      // Configuracion del teclado virtual por defecto
      window.mathVirtualKeyboard.layouts = ['default'];
    });
  }, []);

  // Interceptor de eventos del componente web de MathLive.
  // Escucha los cambios en el input y los eventos de foco del usuario.
  useEffect(() => {
    const campoMatematico = referenciaCampoMatematico.current;
    if (campoMatematico && estaMontado) {
      
      const manejarEntrada = () => {
        const latexActual = campoMatematico.value;
        // La extraccion como 'ascii-math' convierte notacion compleja (ej: \frac{x}{2}) 
        // a texto plano procesable (ej: x/2) para alimentar al motor math.js.
        const formatoMathjs = campoMatematico.getValue('ascii-math');
        alCambiarMatematica(latexActual, formatoMathjs);
      };

      // Manejador para seleccionar todo el texto al hacer foco sobre el input,
      // facilitando la reescritura rapida de ecuaciones enteras al hacer click.
      const manejarFoco = () => {
        setTimeout(() => {
          campoMatematico.executeCommand('selectAll');
        }, 50);
      };

      campoMatematico.addEventListener('input', manejarEntrada);
      campoMatematico.addEventListener('focusin', manejarFoco);
      
      return () => {
        campoMatematico.removeEventListener('input', manejarEntrada);
        campoMatematico.removeEventListener('focusin', manejarFoco);
      };
    }
  }, [estaMontado, alCambiarMatematica]);

  // Sincronizador de estado externo.
  // Permite que el componente refleje cambios originados fuera de el, como por ejemplo
  // la seleccion de una funcion desde el menu desplegable de ejercicios precargados.
  useEffect(() => {
    const campoMatematico = referenciaCampoMatematico.current;
    if (campoMatematico && estaMontado && campoMatematico.value !== valorLatex) {
      campoMatematico.value = valorLatex;
    }
  }, [valorLatex, estaMontado]);

  // Renderizado condicional de un esqueleto (skeleton loader) previo al montaje 
  // para evitar saltos indeseados en la estructura visual (Cumulative Layout Shift) en el navegador.
  if (!estaMontado) {
    return <div className="h-[46px] w-full bg-slate-900 border border-slate-600 rounded-lg animate-pulse" />;
  }

  return (
    <div className="w-full bg-slate-900 border border-slate-600 rounded-lg overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition shadow-inner flex items-center px-2">
      <math-field
        ref={referenciaCampoMatematico}
        menu-button="none"
        class="w-full py-2 text-white text-lg outline-none"
        style={{ 
          backgroundColor: 'transparent', 
          border: 'none', 
          color: '#e2e8f0',
        }}
      >
        {valorLatex}
      </math-field>
    </div>
  );
}