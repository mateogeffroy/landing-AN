'use client';
import { useState, useEffect, useRef } from 'react';

// Declaracion global para extender la interfaz Window del navegador,
// permitiendo a TypeScript reconocer la inyeccion asincrona del motor de renderizado KaTeX.
declare global {
  interface Window {
    katex?: { renderToString: (expresionTex: string, opciones?: Record<string, unknown>) => string };
  }
}

// Interfaz que define las propiedades del componente renderizador de formulas matematicas.
interface PropiedadesKaTeX {
  expresionTex: string;
  enBloque?: boolean;
}

// Componente encargado de renderizar expresiones matematicas utilizando la libreria KaTeX.
// Implementa carga asincrona (lazy loading) de los recursos estaticos (CSS y JS) 
// para optimizar el tiempo de carga inicial de la aplicacion y el rendimiento del cliente.
export default function KaTeX({ expresionTex, enBloque = false }: PropiedadesKaTeX) {
  const [estaListo, setEstaListo] = useState(false);
  const referenciaContenedor = useRef<HTMLSpanElement>(null);

  // Efecto secundario encargado de la inyeccion dinamica de los recursos de KaTeX.
  // Se asegura de que los scripts y estilos se carguen una unica vez en el documento (patron Singleton).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.katex) { 
      setEstaListo(true); 
      return; 
    }
    
    // Verificacion e inyeccion de la hoja de estilos de KaTeX en el encabezado del documento.
    if (!document.querySelector('#katex-css')) {
      const enlaceCss = document.createElement('link');
      enlaceCss.id = 'katex-css';
      enlaceCss.rel = 'stylesheet';
      enlaceCss.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.css';
      document.head.appendChild(enlaceCss);
    }
    
    // Verificacion e inyeccion del script principal de KaTeX.
    if (!document.querySelector('#katex-js')) {
      const scriptJs = document.createElement('script');
      scriptJs.id = 'katex-js';
      scriptJs.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.js';
      scriptJs.onload = () => setEstaListo(true);
      document.head.appendChild(scriptJs);
    } else {
      // Mecanismo de espera (polling) para los casos donde el script ya fue inyectado
      // por otra instancia del componente de React pero aun no ha finalizado su carga asincrona en la red.
      const intervaloVerificacion = setInterval(() => {
        if (window.katex) {
          setEstaListo(true);
          clearInterval(intervaloVerificacion);
        }
      }, 100);
    }
  }, []);

  // Efecto secundario encargado de renderizar la expresion matematica una vez
  // que la libreria esta disponible en el entorno global y el contenedor DOM ha sido montado.
  useEffect(() => {
    if (estaListo && referenciaContenedor.current && window.katex) {
      referenciaContenedor.current.innerHTML = window.katex.renderToString(expresionTex, {
        displayMode: enBloque,
        throwOnError: false,
      });
    }
  }, [expresionTex, enBloque, estaListo]);

  // Renderizado condicional de un indicador de carga ligero mientras se descargan los recursos CDN.
  if (!estaListo) return <span className="text-slate-500 text-xs">...</span>;
  
  return <span ref={referenciaContenedor} />;
}