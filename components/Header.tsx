'use client';

import { useState, useEffect } from 'react';

export default function Header() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Si bajamos y pasamos los 50px, ocultamos el header. Si subimos, lo mostramos.
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <header 
      className={`fixed w-full top-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-slate-700/50 transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <a href="/">
            <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text">∑</div>
                <h1 className="text-xl font-bold text-white">Análisis Numérico</h1>
            </div>
          </a>
          <nav className="hidden md:flex space-x-8">
            <a
              href="/#proyectos"
              className="text-slate-300 hover:text-blue-400 transition"
            >
              Proyectos
            </a>
            <a
              href="/#integrantes"
              className="text-slate-300 hover:text-blue-400 transition"
            >
              Integrantes
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}