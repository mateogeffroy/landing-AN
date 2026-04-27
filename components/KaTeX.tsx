'use client';
import { useState, useEffect, useRef } from 'react';

declare global {
  interface Window {
    katex?: { renderToString: (tex: string, opts?: Record<string, unknown>) => string };
  }
}

export default function KaTeX({ tex, display = false }: { tex: string; display?: boolean }) {
  const [ready, setReady] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.katex) { setReady(true); return; }
    
    // Evitar inyectar múltiples veces si hay varios componentes
    if (!document.querySelector('#katex-css')) {
      const link = document.createElement('link');
      link.id = 'katex-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.css';
      document.head.appendChild(link);
    }
    
    if (!document.querySelector('#katex-js')) {
      const script = document.createElement('script');
      script.id = 'katex-js';
      script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.js';
      script.onload = () => setReady(true);
      document.head.appendChild(script);
    } else {
      // Si el script ya estaba pero no cargó del todo, esperamos un poco
      const checkInterval = setInterval(() => {
        if (window.katex) {
          setReady(true);
          clearInterval(checkInterval);
        }
      }, 100);
    }
  }, []);

  useEffect(() => {
    if (ready && ref.current && window.katex) {
      ref.current.innerHTML = window.katex.renderToString(tex, {
        displayMode: display,
        throwOnError: false,
      });
    }
  }, [tex, display, ready]);

  if (!ready) return <span className="text-slate-500 text-xs">...</span>;
  return <span ref={ref} />;
}