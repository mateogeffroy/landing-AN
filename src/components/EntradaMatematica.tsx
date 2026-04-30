'use client';

import { useEffect, useRef, useState } from 'react';

// Declaracion global para instruir a TypeScript sobre la existencia de <math-field>
// y el teclado virtual inyectado globalmente por la libreria.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        class?: string;
        'menu-button'?: string;
      };
    }
  }
  interface Window {
    mathVirtualKeyboard?: any;
  }
}

interface PropiedadesEntradaMatematica {
  valorLatex: string;
  alCambiarMatematica: (latex: string, formatoAscii: string) => void;
  textoReferencia?: string;
}

export default function EntradaMatematica({ 
  valorLatex, 
  alCambiarMatematica, 
}: PropiedadesEntradaMatematica) {
  
  const referenciaCampoMatematico = useRef<any>(null);
  const [estaMontado, setEstaMontado] = useState(false);

  // 1. Inyeccion dinamica desde CDN (Bypass a Webpack)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!document.querySelector('#mathlive-cdn')) {
        const script = document.createElement('script');
        script.id = 'mathlive-cdn';
        script.src = 'https://cdn.jsdelivr.net/npm/mathlive/dist/mathlive.min.js';
        script.defer = true;
        
        script.onload = () => {
          if (window.mathVirtualKeyboard) {
            window.mathVirtualKeyboard.layouts = ['default'];
          }
          setEstaMontado(true);
        };
        
        document.head.appendChild(script);
      } else {
        const intervaloVerificacion = setInterval(() => {
          if (customElements.get('math-field')) {
            clearInterval(intervaloVerificacion);
            setEstaMontado(true);
          }
        }, 100);
      }
    }
  }, []);

  // 2. Manejadores de eventos de escritura
  useEffect(() => {
    const campoMatematico = referenciaCampoMatematico.current;
    if (campoMatematico && estaMontado) {
      
      const manejarEntrada = () => {
        const latexActual = campoMatematico.value;
        let formatoMathjs = latexActual;
        
        // Bloque try-catch de seguridad: evita que la aplicacion colapse 
        // si el usuario deja una ecuacion por la mitad (ej: raiz sin numero)
        try {
          formatoMathjs = campoMatematico.getValue('ascii-math') || latexActual;
        } catch (error) {
          console.warn("Expresión matemática en construcción");
        }

        alCambiarMatematica(latexActual, formatoMathjs);
      };

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

  // 3. Sincronizador de estado EXTERNO (Cuando seleccionas una precargada)
  useEffect(() => {
    const campoMatematico = referenciaCampoMatematico.current;
    if (campoMatematico && estaMontado && campoMatematico.value !== valorLatex) {
      // Forzamos el valor a traves de la API del componente en lugar de usar React Children
      campoMatematico.value = valorLatex;
    }
  }, [valorLatex, estaMontado]);

  if (!estaMontado) {
    return <div className="h-[46px] w-full bg-slate-900 border border-slate-600 rounded-lg animate-pulse" />;
  }

  return (
    <div className="w-full bg-slate-900 border border-slate-600 rounded-lg overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition shadow-inner flex items-center px-2">
      {/* 
        EL FIX ESTÁ ACÁ: La etiqueta se cierra a sí misma y no recibe {valorLatex}. 
        Esto evita que React intente re-escribir el DOM de MathLive y congele el input. 
      */}
      <math-field
        ref={referenciaCampoMatematico}
        menu-button="none"
        class="w-full py-2 text-white text-lg outline-none"
        style={{ 
          backgroundColor: 'transparent', 
          border: 'none', 
          color: '#e2e8f0',
        }}
      />
    </div>
  );
}