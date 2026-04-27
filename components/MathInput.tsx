'use client';

import { useEffect, useRef, useState } from 'react';

// Le decimos a TypeScript que existe un elemento HTML personalizado llamado <math-field>
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        class?: string;
      };
    }
  }
}

interface MathInputProps {
  latexValue: string;
  onMathChange: (latex: string, mathjsReady: string) => void;
  placeholder?: string;
}

export default function MathInput({ latexValue, onMathChange, placeholder }: MathInputProps) {
  const mathFieldRef = useRef<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  // 1. Carga diferida (Dynamic Import) para evitar errores de SSR en Next.js
  useEffect(() => {
    setIsMounted(true);
    import('mathlive').then(() => {
      // Configuración global opcional para el teclado
      window.mathVirtualKeyboard.layouts = ['default'];
    });
  }, []);

  // 2. Escuchamos los cambios del usuario en el teclado
  useEffect(() => {
    const mf = mathFieldRef.current;
    if (mf && isMounted) {
      const handleInput = () => {
        const currentLatex = mf.value;
        // Convertimos el LaTeX hermoso a texto plano para Math.js
        // Ej: \frac{x}{2} -> x/2
        const mathjsReady = mf.getValue('ascii-math');
        onMathChange(currentLatex, mathjsReady);
      };

      mf.addEventListener('input', handleInput);
      return () => mf.removeEventListener('input', handleInput);
    }
  }, [isMounted, onMathChange]);

  // 3. Sincronizamos si el valor cambia desde afuera (ej: cuando tocás un Preset)
  useEffect(() => {
    const mf = mathFieldRef.current;
    if (mf && isMounted && mf.value !== latexValue) {
      mf.value = latexValue;
    }
  }, [latexValue, isMounted]);

  // Mostrar un "esqueleto" mientras carga para que no pegue saltos la pantalla
  if (!isMounted) {
    return <div className="h-[46px] w-full bg-slate-900 border border-slate-600 rounded-lg animate-pulse" />;
  }

  return (
    <div className="w-full bg-slate-900 border border-slate-600 rounded-lg overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition shadow-inner flex items-center px-2">
      <math-field
        ref={mathFieldRef}
        menu-button="none"
        class="w-full py-2 text-white text-lg outline-none"
        style={{ 
          backgroundColor: 'transparent', 
          border: 'none', 
          color: '#e2e8f0',
        }}
      >
        {latexValue}
      </math-field>
    </div>
  );
}