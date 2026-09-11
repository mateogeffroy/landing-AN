'use client';

import { useEffect, useState } from 'react';

// Script inyectado antes de la hidratación: evita el flash de tema
// incorrecto leyendo la preferencia guardada antes del primer paint.
export const scriptInicialTema = `
(function () {
  try {
    var guardado = localStorage.getItem('theme');
    if (guardado === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function ThemeToggle() {
  const [esOscuro, setEsOscuro] = useState(false);

  useEffect(() => {
    setEsOscuro(document.documentElement.classList.contains('dark'));
  }, []);

  const alternar = () => {
    const oscuro = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', oscuro ? 'dark' : 'light');
    setEsOscuro(oscuro);
  };

  return (
    <button
      onClick={alternar}
      aria-label={esOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-blue-400 dark:hover:bg-slate-800/60 transition-colors"
    >
      {esOscuro ? (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
          <path
            d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
          <path
            d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
