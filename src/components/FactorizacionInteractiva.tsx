'use client';

import { useState } from 'react';
import KaTeX from './KaTeX';

export default function FactorizacionInteractiva() {
  const [hovered, setHovered] = useState<{ r: number; c: number } | null>(null);
  const [locked, setLocked] = useState<{ r: number; c: number } | null>(null);

  // El elemento activo es el que está bloqueado, o en su defecto, el que tiene hover.
  const active = locked || hovered;

  const toggleLock = (r: number, c: number) => {
    if (locked?.r === r && locked?.c === c) {
      setLocked(null); // Desbloquea si se hace clic en el mismo
    } else {
      setLocked({ r, c }); // Bloquea el nuevo elemento
    }
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

  const ecuacionesOrdenadas = [
    { id: '0-0', num: 1, r: 0, c: 0, tex: `\\textcolor{${cL}}{l_{11}} = \\textcolor{${cA}}{a_{11}}` },
    { id: '1-0', num: 2, r: 1, c: 0, tex: `\\textcolor{${cL}}{l_{21}} = \\textcolor{${cA}}{a_{21}}` },
    { id: '2-0', num: 3, r: 2, c: 0, tex: `\\textcolor{${cL}}{l_{31}} = \\textcolor{${cA}}{a_{31}}` },
    { id: '0-1', num: 4, r: 0, c: 1, tex: `\\textcolor{${cU}}{u_{12}} = \\frac{\\textcolor{${cA}}{a_{12}}}{\\textcolor{${cL}}{l_{11}}}` },
    { id: '0-2', num: 5, r: 0, c: 2, tex: `\\textcolor{${cU}}{u_{13}} = \\frac{\\textcolor{${cA}}{a_{13}}}{\\textcolor{${cL}}{l_{11}}}` },
    { id: '1-1', num: 6, r: 1, c: 1, tex: `\\textcolor{${cL}}{l_{22}} = \\textcolor{${cA}}{a_{22}} - \\textcolor{${cL}}{l_{21}}\\textcolor{${cU}}{u_{12}}` },
    { id: '2-1', num: 7, r: 2, c: 1, tex: `\\textcolor{${cL}}{l_{32}} = \\textcolor{${cA}}{a_{32}} - \\textcolor{${cL}}{l_{31}}\\textcolor{${cU}}{u_{12}}` },
    { id: '1-2', num: 8, r: 1, c: 2, tex: `\\textcolor{${cU}}{u_{23}} = \\frac{\\textcolor{${cA}}{a_{23}} - \\textcolor{${cL}}{l_{21}}\\textcolor{${cU}}{u_{13}}}{\\textcolor{${cL}}{l_{22}}}` },
    { id: '2-2', num: 9, r: 2, c: 2, tex: `\\textcolor{${cL}}{l_{33}} = \\textcolor{${cA}}{a_{33}} - \\textcolor{${cL}}{l_{31}}\\textcolor{${cU}}{u_{13}} - \\textcolor{${cL}}{l_{32}}\\textcolor{${cU}}{u_{23}}` },
  ];

  return (
    <div className="w-full space-y-8">
      {/* Visualizador de Matrices */}
      <div className="bg-slate-900/80 p-8 rounded-xl border border-slate-700/50 shadow-inner flex flex-col md:flex-row items-center justify-center gap-6">
        
        {/* Matriz A (Interactiva) */}
        <div className="flex flex-col items-center">
          <p className="text-xs font-black text-red-400 mb-3 uppercase tracking-widest">Matriz A</p>
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
          <p className="text-xs font-black text-yellow-400 mb-3 uppercase tracking-widest">Matriz L</p>
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
          <p className="text-xs font-black text-green-400 mb-3 uppercase tracking-widest">Matriz U</p>
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
              Presione sobre una celda de la Matriz A o sobre una ecuación para <strong className="text-blue-400">fijar la selección</strong>.
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ecuacionesOrdenadas.map((eq) => {
            const isActive = active?.r === eq.r && active?.c === eq.c;
            const isLocked = locked?.r === eq.r && locked?.c === eq.c;
            return (
              <div 
                key={eq.id}
                onMouseEnter={() => setHovered({ r: eq.r, c: eq.c })}
                onMouseLeave={() => setHovered(null)}
                onClick={() => toggleLock(eq.r, eq.c)}
                className={`p-4 rounded-lg border cursor-pointer transition-all duration-300 flex flex-col items-center justify-center ${
                  isActive 
                    ? `bg-blue-900/30 border-blue-500/50 shadow-[0_4px_15px_rgba(59,130,246,0.15)] ${isLocked ? 'ring-2 ring-blue-500 scale-105' : 'scale-105'}` 
                    : 'bg-slate-900/50 border-slate-700/50 opacity-80 hover:opacity-100'
                }`}
              >
                <span className={`text-[11px] uppercase font-black tracking-widest mb-3 ${isActive ? 'text-blue-400' : 'text-slate-500'}`}>
                  Ecuación {eq.num}
                </span>
                <div className="text-sm md:text-base">
                  <KaTeX expresionTex={eq.tex} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}