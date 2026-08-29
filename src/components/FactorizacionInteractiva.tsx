'use client';

import { useState } from 'react';
import KaTeX from './KaTeX';

interface Celda {
  r: number;
  c: number;
}

interface EcuacionCrout {
  id: string;
  num: number;
  r: number;
  c: number;
  matriz: 'L' | 'U';
  partida: string;
  nota: string;
  despeje?: string[];
  final: string;
}

export default function FactorizacionInteractiva() {
  const [hovered, setHovered] = useState<Celda | null>(null);
  const [locked, setLocked] = useState<Celda | null>(null);
  // Sólo un desarrollo abierto a la vez: se despliega como panel flotante sobre las tarjetas
  // de abajo, así abrir uno no empuja ni estira al resto de la fila de la grilla.
  const [abierta, setAbierta] = useState<string | null>(null);

  // El elemento activo es el que está bloqueado, o en su defecto, el que tiene hover.
  const active = locked || hovered;

  const toggleLock = (r: number, c: number) => {
    if (locked?.r === r && locked?.c === c) {
      setLocked(null); // Desbloquea si se hace clic en el mismo
    } else {
      setLocked({ r, c }); // Bloquea el nuevo elemento
    }
  };

  const toggleDesarrollo = (id: string, evento: React.MouseEvent) => {
    evento.stopPropagation();
    setAbierta((previa) => (previa === id ? null : id));
  };

  // Colores en formato Hex para KaTeX: Rojo (A), Amarillo (L), Verde (U)
  const cA = '#f87171'; // red-400
  const cL = '#facc15'; // yellow-400
  const cU = '#4ade80'; // green-400

  const matrizA = [
    [`\\textcolor{${cA}}{a_{11}}`, `\\textcolor{${cA}}{a_{12}}`, `\\textcolor{${cA}}{a_{13}}`],
    [`\\textcolor{${cA}}{a_{21}}`, `\\textcolor{${cA}}{a_{22}}`, `\\textcolor{${cA}}{a_{23}}`],
    [`\\textcolor{${cA}}{a_{31}}`, `\\textcolor{${cA}}{a_{32}}`, `\\textcolor{${cA}}{a_{33}}`],
  ];

  const matrizL = [
    [`\\textcolor{${cL}}{l_{11}}`, '0', '0'],
    [`\\textcolor{${cL}}{l_{21}}`, `\\textcolor{${cL}}{l_{22}}`, '0'],
    [`\\textcolor{${cL}}{l_{31}}`, `\\textcolor{${cL}}{l_{32}}`, `\\textcolor{${cL}}{l_{33}}`],
  ];

  const matrizU = [
    ['1', `\\textcolor{${cU}}{u_{12}}`, `\\textcolor{${cU}}{u_{13}}`],
    ['0', '1', `\\textcolor{${cU}}{u_{23}}`],
    ['0', '0', '1'],
  ];

  // Cada ecuación surge de igualar una celda de A con el producto (fila de L) . (columna de U).
  // "partida" es esa igualdad tal cual sale de multiplicar las matrices; "despeje" son los pasos
  // algebraicos para aislar la incógnita; "final" es la fórmula de cálculo ya utilizada por la calculadora.
  const ecuacionesOrdenadas: EcuacionCrout[] = [
    {
      id: '0-0', num: 1, r: 0, c: 0, matriz: 'L',
      partida: `\\textcolor{${cL}}{l_{11}} \\cdot 1 = \\textcolor{${cA}}{a_{11}}`,
      nota: 'Fila 1 de L por columna 1 de U: como esa columna vale (1, 0, 0), el producto tiene un solo término.',
      final: `\\textcolor{${cL}}{l_{11}} = \\textcolor{${cA}}{a_{11}}`,
    },
    {
      id: '1-0', num: 2, r: 1, c: 0, matriz: 'L',
      partida: `\\textcolor{${cL}}{l_{21}} \\cdot 1 = \\textcolor{${cA}}{a_{21}}`,
      nota: 'Fila 2 de L por columna 1 de U: mismo caso, un único término no nulo.',
      final: `\\textcolor{${cL}}{l_{21}} = \\textcolor{${cA}}{a_{21}}`,
    },
    {
      id: '2-0', num: 3, r: 2, c: 0, matriz: 'L',
      partida: `\\textcolor{${cL}}{l_{31}} \\cdot 1 = \\textcolor{${cA}}{a_{31}}`,
      nota: 'Fila 3 de L por columna 1 de U: se repite el patrón de la primera columna.',
      final: `\\textcolor{${cL}}{l_{31}} = \\textcolor{${cA}}{a_{31}}`,
    },
    {
      id: '0-1', num: 4, r: 0, c: 1, matriz: 'U',
      partida: `\\textcolor{${cL}}{l_{11}} \\cdot \\textcolor{${cU}}{u_{12}} = \\textcolor{${cA}}{a_{12}}`,
      nota: 'Fila 1 de L por columna 2 de U.',
      despeje: [`\\textcolor{${cU}}{u_{12}} = \\frac{\\textcolor{${cA}}{a_{12}}}{\\textcolor{${cL}}{l_{11}}}`],
      final: `\\textcolor{${cU}}{u_{12}} = \\frac{\\textcolor{${cA}}{a_{12}}}{\\textcolor{${cL}}{l_{11}}}`,
    },
    {
      id: '0-2', num: 5, r: 0, c: 2, matriz: 'U',
      partida: `\\textcolor{${cL}}{l_{11}} \\cdot \\textcolor{${cU}}{u_{13}} = \\textcolor{${cA}}{a_{13}}`,
      nota: 'Fila 1 de L por columna 3 de U.',
      despeje: [`\\textcolor{${cU}}{u_{13}} = \\frac{\\textcolor{${cA}}{a_{13}}}{\\textcolor{${cL}}{l_{11}}}`],
      final: `\\textcolor{${cU}}{u_{13}} = \\frac{\\textcolor{${cA}}{a_{13}}}{\\textcolor{${cL}}{l_{11}}}`,
    },
    {
      id: '1-1', num: 6, r: 1, c: 1, matriz: 'L',
      partida: `\\textcolor{${cL}}{l_{21}}\\textcolor{${cU}}{u_{12}} + \\textcolor{${cL}}{l_{22}} \\cdot 1 = \\textcolor{${cA}}{a_{22}}`,
      nota: 'Fila 2 de L por columna 2 de U: ahora aparecen dos términos porque ambas filas/columnas ya tienen dos entradas no nulas.',
      despeje: [`\\textcolor{${cL}}{l_{22}} = \\textcolor{${cA}}{a_{22}} - \\textcolor{${cL}}{l_{21}}\\textcolor{${cU}}{u_{12}}`],
      final: `\\textcolor{${cL}}{l_{22}} = \\textcolor{${cA}}{a_{22}} - \\textcolor{${cL}}{l_{21}}\\textcolor{${cU}}{u_{12}}`,
    },
    {
      id: '2-1', num: 7, r: 2, c: 1, matriz: 'L',
      partida: `\\textcolor{${cL}}{l_{31}}\\textcolor{${cU}}{u_{12}} + \\textcolor{${cL}}{l_{32}} = \\textcolor{${cA}}{a_{32}}`,
      nota: 'Fila 3 de L por columna 2 de U.',
      despeje: [`\\textcolor{${cL}}{l_{32}} = \\textcolor{${cA}}{a_{32}} - \\textcolor{${cL}}{l_{31}}\\textcolor{${cU}}{u_{12}}`],
      final: `\\textcolor{${cL}}{l_{32}} = \\textcolor{${cA}}{a_{32}} - \\textcolor{${cL}}{l_{31}}\\textcolor{${cU}}{u_{12}}`,
    },
    {
      id: '1-2', num: 8, r: 1, c: 2, matriz: 'U',
      partida: `\\textcolor{${cL}}{l_{21}}\\textcolor{${cU}}{u_{13}} + \\textcolor{${cL}}{l_{22}}\\textcolor{${cU}}{u_{23}} = \\textcolor{${cA}}{a_{23}}`,
      nota: 'Fila 2 de L por columna 3 de U. Acá la incógnita queda multiplicada por l_{22}, así que hace falta despejar.',
      despeje: [
        `\\textcolor{${cL}}{l_{22}}\\textcolor{${cU}}{u_{23}} = \\textcolor{${cA}}{a_{23}} - \\textcolor{${cL}}{l_{21}}\\textcolor{${cU}}{u_{13}}`,
        `\\textcolor{${cU}}{u_{23}} = \\frac{\\textcolor{${cA}}{a_{23}} - \\textcolor{${cL}}{l_{21}}\\textcolor{${cU}}{u_{13}}}{\\textcolor{${cL}}{l_{22}}}`,
      ],
      final: `\\textcolor{${cU}}{u_{23}} = \\frac{\\textcolor{${cA}}{a_{23}} - \\textcolor{${cL}}{l_{21}}\\textcolor{${cU}}{u_{13}}}{\\textcolor{${cL}}{l_{22}}}`,
    },
    {
      id: '2-2', num: 9, r: 2, c: 2, matriz: 'L',
      partida: `\\textcolor{${cL}}{l_{31}}\\textcolor{${cU}}{u_{13}} + \\textcolor{${cL}}{l_{32}}\\textcolor{${cU}}{u_{23}} + \\textcolor{${cL}}{l_{33}} \\cdot 1 = \\textcolor{${cA}}{a_{33}}`,
      nota: 'Fila 3 de L por columna 3 de U: es la última celda, por eso combina todos los términos calculados antes.',
      despeje: [`\\textcolor{${cL}}{l_{33}} = \\textcolor{${cA}}{a_{33}} - \\textcolor{${cL}}{l_{31}}\\textcolor{${cU}}{u_{13}} - \\textcolor{${cL}}{l_{32}}\\textcolor{${cU}}{u_{23}}`],
      final: `\\textcolor{${cL}}{l_{33}} = \\textcolor{${cA}}{a_{33}} - \\textcolor{${cL}}{l_{31}}\\textcolor{${cU}}{u_{13}} - \\textcolor{${cL}}{l_{32}}\\textcolor{${cU}}{u_{23}}`,
    },
  ];

  return (
    <div className="w-full space-y-8">
      {/* Visualizador de Matrices */}
      <div className="bg-slate-900/80 p-8 rounded-xl border border-slate-700/50 shadow-inner flex flex-col md:flex-row items-center justify-center gap-6">

        {/* Matriz A (Interactiva) */}
        <div className="flex flex-col items-center">
          <p className="text-[10px] font-black text-red-400 mb-3 uppercase tracking-widest">Matriz A</p>
          <div className="grid grid-rows-3 gap-2 border-l-2 border-r-2 border-slate-500 p-2 rounded-[4px] bg-slate-900/50">
            {matrizA.map((fila, r) => (
              <div key={r} className="grid grid-cols-3 gap-2">
                {fila.map((celda, c) => {
                  const isActive = active?.r === r && active?.c === c;
                  const isLocked = locked?.r === r && locked?.c === c;
                  return (
                    <div
                      key={c}
                      onMouseEnter={() => setHovered({ r, c })}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => toggleLock(r, c)}
                      className={`w-14 h-14 flex items-center justify-center rounded-lg cursor-pointer transition-all duration-300 ${
                        isActive
                          ? `bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.4)] ${isLocked ? 'ring-2 ring-blue-500 bg-blue-500/30 scale-110' : 'scale-105'}`
                          : 'bg-slate-800 hover:bg-slate-700'
                      }`}
                    >
                      <KaTeX expresionTex={celda} />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="text-3xl text-slate-500 font-black hidden md:block">=</div>

        {/* Matriz L */}
        <div className="flex flex-col items-center">
          <p className="text-[10px] font-black text-yellow-400 mb-3 uppercase tracking-widest">Matriz L</p>
          <div className="grid grid-rows-3 gap-2 border-l-2 border-r-2 border-slate-500 p-2 rounded-[4px] bg-slate-900/50">
            {matrizL.map((fila, r) => (
              <div key={r} className="grid grid-cols-3 gap-2">
                {fila.map((celda, c) => (
                  <div
                    key={c}
                    className={`w-14 h-14 flex items-center justify-center rounded-lg transition-all duration-300 ${
                      active?.r === r
                        ? 'bg-blue-500/20 ring-1 ring-blue-400/50'
                        : 'bg-slate-800'
                    }`}
                  >
                    <KaTeX expresionTex={celda} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="text-3xl text-slate-500 font-black hidden md:block">×</div>

        {/* Matriz U */}
        <div className="flex flex-col items-center">
          <p className="text-[10px] font-black text-green-400 mb-3 uppercase tracking-widest">Matriz U</p>
          <div className="grid grid-rows-3 gap-2 border-l-2 border-r-2 border-slate-500 p-2 rounded-[4px] bg-slate-900/50">
            {matrizU.map((fila, r) => (
              <div key={r} className="grid grid-cols-3 gap-2">
                {fila.map((celda, c) => (
                  <div
                    key={c}
                    className={`w-14 h-14 flex items-center justify-center rounded-lg transition-all duration-300 ${
                      active?.c === c
                        ? 'bg-blue-500/20 ring-1 ring-blue-400/50'
                        : 'bg-slate-800'
                    }`}
                  >
                    <KaTeX expresionTex={celda} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fórmulas para calcular L y U */}
      <div className="bg-slate-800/80 rounded-xl border border-slate-700 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-slate-700/50 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white border-l-4 border-blue-500 pl-3 mb-1">
              Fórmulas para calcular L y U
            </h3>
            <p className="text-sm text-slate-400">
              Presione sobre una celda de la Matriz A o sobre una ecuación para <strong className="text-blue-400">fijar la selección</strong>, o abra
              <span className="text-blue-300 font-bold"> el desarrollo ▸ </span>
              de cada fórmula para ver de dónde sale.
            </p>
          </div>
          {locked && (
            <button
              onClick={() => setLocked(null)}
              className="px-4 py-2 text-xs font-bold bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Quitar selección
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          {ecuacionesOrdenadas.map((eq) => {
            const isActive = active?.r === eq.r && active?.c === eq.c;
            const isLocked = locked?.r === eq.r && locked?.c === eq.c;
            const estaAbierta = abierta === eq.id;
            const colorMatriz = eq.matriz === 'L' ? 'border-yellow-500/60' : 'border-green-500/60';
            return (
              <div
                key={eq.id}
                onMouseEnter={() => setHovered({ r: eq.r, c: eq.c })}
                onMouseLeave={() => setHovered(null)}
                onClick={() => toggleLock(eq.r, eq.c)}
                className={`relative rounded-lg border border-l-4 cursor-pointer transition-colors duration-300 ${colorMatriz} ${
                  estaAbierta ? 'z-20' : 'z-0'
                } ${
                  isActive
                    ? `bg-blue-900/30 border-blue-500/50 shadow-[0_4px_15px_rgba(59,130,246,0.15)] ${isLocked ? 'ring-2 ring-blue-500' : ''}`
                    : 'bg-slate-900/50 border-slate-700/50 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="p-4 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className={`block text-[11px] uppercase font-black tracking-widest mb-2 ${isActive ? 'text-blue-400' : 'text-slate-500'}`}>
                      Ecuación {eq.num} · {eq.matriz}
                    </span>
                    <div className="text-sm md:text-base">
                      <KaTeX expresionTex={eq.final} />
                    </div>
                  </div>

                  <button
                    onClick={(evento) => toggleDesarrollo(eq.id, evento)}
                    aria-expanded={estaAbierta}
                    aria-label={estaAbierta ? 'Ocultar desarrollo' : 'Ver desarrollo'}
                    className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300 ease-out hover:bg-blue-500/10 hover:ring-2 hover:ring-blue-400/40 ${
                      estaAbierta ? 'text-blue-300 bg-blue-500/10 ring-2 ring-blue-400/40' : 'text-slate-400'
                    }`}
                  >
                    <svg viewBox="0 0 20 20" fill="none" className={`w-4 h-4 transition-transform duration-300 ease-out ${estaAbierta ? 'rotate-180' : ''}`}>
                      <path d="M4.5 7.5l5.5 5.5 5.5-5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>

                <div
                  className={`absolute -left-2 -right-2 top-full pt-2 grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                    estaAbierta ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div
                      onClick={(evento) => evento.stopPropagation()}
                      className="relative cursor-default rounded-xl border border-blue-500/40 bg-slate-950 p-4 space-y-3 shadow-2xl shadow-black/70"
                    >
                      {/* Pico que ancla el panel a la flecha que lo abrió. */}
                      <span className="absolute -top-[7px] right-8 w-3 h-3 rotate-45 border-t border-l border-blue-500/40 bg-slate-950" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">1. Producto (fila de L) · (columna de U)</p>
                        <div className="text-sm"><KaTeX expresionTex={eq.partida} /></div>
                        <p className="text-xs text-slate-400 mt-2">{eq.nota}</p>
                      </div>

                      {eq.despeje && (
                        <div className="border-t border-slate-700/50 pt-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">2. Despeje de la incógnita</p>
                          <div className="space-y-2">
                            {eq.despeje.map((paso, indice) => (
                              <div key={indice} className="text-sm">
                                <KaTeX expresionTex={paso} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="border-t border-slate-700/50 pt-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">Fórmula de cálculo</p>
                        <div className="text-sm"><KaTeX expresionTex={eq.final} /></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
