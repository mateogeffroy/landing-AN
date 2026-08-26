'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';
import { desplazarHaciaAncla } from '@/src/lib/lenis';

export default function Header() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
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

  // Cierra el menú móvil al cambiar de ruta (navegación entre proyectos).
  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

  const esHome = pathname === '/';

  // En el home, la navegación son anclas a secciones de la misma página.
  // En las vistas de proyecto, es navegación entre páginas: Inicio primero,
  // y a su derecha cada proyecto en orden.
  const enlaces = esHome
    ? [
        { href: '#proyectos', etiqueta: 'Proyectos', ancla: true, activo: false },
        { href: '#integrantes', etiqueta: 'Integrantes', ancla: true, activo: false },
      ]
    : [
        { href: '/', etiqueta: 'Inicio', ancla: false, activo: false },
        { href: '/fourier', etiqueta: 'Fourier', ancla: false, activo: pathname.startsWith('/fourier') },
        { href: '/crout', etiqueta: 'Crout', ancla: false, activo: pathname.startsWith('/crout') },
      ];

  return (
    <header
      className={`fixed w-full top-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-slate-700/50 transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center space-x-2">
              <Logo className="w-7 h-7" />
              <h1 className="text-xl font-bold text-white font-sans">Portfolio TPs AN</h1>
            </div>
          </Link>

          {/* Navegación de escritorio */}
          <nav className="hidden md:flex items-center gap-1">
            {enlaces.map((enlace) => (
              <Link
                key={enlace.href}
                href={enlace.href}
                onClick={enlace.ancla ? (evento) => desplazarHaciaAncla(evento, enlace.href) : undefined}
                className={`font-sans px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  enlace.activo ? 'text-blue-400 bg-blue-500/10' : 'text-slate-300 hover:text-blue-400 hover:bg-slate-800/60'
                }`}
              >
                {enlace.etiqueta}
              </Link>
            ))}
          </nav>

          {/* Botón de menú móvil */}
          <button
            onClick={() => setMenuAbierto((abierto) => !abierto)}
            aria-expanded={menuAbierto}
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-slate-300 hover:text-blue-400 hover:bg-slate-800/60 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
              {menuAbierto ? (
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>

        {/* Navegación móvil desplegable */}
        <div
          className={`md:hidden grid transition-[grid-template-rows] duration-300 ease-in-out ${
            menuAbierto ? 'grid-rows-[1fr] mt-3' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="overflow-hidden">
            <nav className="flex flex-col gap-1 pb-2">
              {enlaces.map((enlace) => (
                <Link
                  key={enlace.href}
                  href={enlace.href}
                  onClick={(evento) => {
                    if (enlace.ancla) desplazarHaciaAncla(evento, enlace.href);
                    setMenuAbierto(false);
                  }}
                  className={`font-sans px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    enlace.activo ? 'text-blue-400 bg-blue-500/10' : 'text-slate-300 hover:text-blue-400 hover:bg-slate-800/60'
                  }`}
                >
                  {enlace.etiqueta}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
