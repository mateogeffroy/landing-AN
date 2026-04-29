'use client';

import { useState, useRef, useEffect } from 'react';
import KaTeX from './KaTeX';
import { TramoFuncion } from './EditorFuncionTrozos';

// Interfaz que define la estructura de datos para un ejercicio predefinido del trabajo practico.
// Permite inicializar el sistema con funciones continuas o funciones definidas por partes.
export interface EjercicioPredefinido {
  etiqueta: string;
  definicionLatex: string;
  modo: 'simple' | 'piecewise';
  expresion?: string;
  minimo?: number;
  maximo?: number;
  tramos?: TramoFuncion[];
}

// Arreglo estatico y constante que almacena los parametros matematicos de cada inciso del TP.
// Contiene tanto la representacion visual (LaTeX) como las instrucciones ejecutables (ASCII) para math.js.
export const EJERCICIOS_PREDEFINIDOS: EjercicioPredefinido[] = [
  {
    etiqueta: 'a)',
    definicionLatex: String.raw`f(x)=\begin{cases}1, & 0\le x\le1\\-1, & -1<x\le0\end{cases}`,
    modo: 'piecewise',
    tramos: [
      { id: '1', condicion: '-1 < x <= 0', expresion: '-1' },
      { id: '2', condicion: '0 <= x <= 1', expresion: '1' },
    ],
  },
  {
    etiqueta: 'b)',
    definicionLatex: String.raw`f(x)=\begin{cases}1, & |x|\le\tfrac{1}{2}\\0, & \tfrac{1}{2}<|x|\le1\end{cases}`,
    modo: 'piecewise',
    tramos: [
      { id: '1', condicion: '-1 <= x < -0.5', expresion: '0' },
      { id: '2', condicion: '-0.5 <= x <= 0.5', expresion: '1' },
      { id: '3', condicion: '0.5 < x <= 1', expresion: '0' },
    ],
  },
  {
    etiqueta: 'c)',
    definicionLatex: String.raw`f(x)=x, \quad |x|\le1`,
    modo: 'simple', expresion: 'x', minimo: -1, maximo: 1,
  },
  {
    etiqueta: 'd)',
    definicionLatex: String.raw`f(x)=x-1, \quad |x|\le1`,
    modo: 'simple', expresion: 'x - 1', minimo: -1, maximo: 1,
  },
  {
    etiqueta: 'e)',
    definicionLatex: String.raw`f(x)=|x|, \quad |x|\le1`,
    modo: 'simple', expresion: 'abs(x)', minimo: -1, maximo: 1,
  },
  {
    etiqueta: 'f)',
    definicionLatex: String.raw`f(x)=x^2, \quad |x|\le1`,
    modo: 'simple', expresion: 'x^2', minimo: -1, maximo: 1,
  },
  {
    etiqueta: 'g)',
    definicionLatex: String.raw`f(x)=3x-2x^2, \quad |x|\le1`,
    modo: 'simple', expresion: '3*x - 2*x^2', minimo: -1, maximo: 1,
  },
];

// Interfaz para las propiedades del componente del menu desplegable.
interface PropiedadesMenuEjercicios {
  alSeleccionarEjercicio: (ejercicio: EjercicioPredefinido) => void;
}

// Componente de interfaz de usuario (UI) para seleccionar configuraciones matematicas precargadas.
export default function MenuDesplegableEjercicios({ alSeleccionarEjercicio }: PropiedadesMenuEjercicios) {
  const [estaAbierto, setEstaAbierto] = useState(false);
  const referenciaMenu = useRef<HTMLDivElement>(null);

  // Efecto secundario que implementa el patron "Click Outside" (Clic afuera).
  // Registra un evento global a nivel del documento para cerrar el menu si el usuario hace clic fuera de su contenedor DOM.
  useEffect(() => {
    const manejarClickAfuera = (evento: MouseEvent) => {
      if (referenciaMenu.current && !referenciaMenu.current.contains(evento.target as Node)) {
        setEstaAbierto(false);
      }
    };
    
    document.addEventListener('mousedown', manejarClickAfuera);
    
    // Limpieza (cleanup) del oyente de eventos al desmontar el componente para evitar fugas de memoria.
    return () => document.removeEventListener('mousedown', manejarClickAfuera);
  }, []);

  return (
    <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700 relative h-full flex flex-col justify-center" ref={referenciaMenu}>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-blue-400 mb-3 uppercase tracking-wider">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        Ejercicios del TP
      </h3>
      
      <button
        onClick={() => setEstaAbierto(!estaAbierto)}
        className="w-full flex justify-between items-center p-3 bg-slate-900 border border-slate-600 rounded-lg hover:border-blue-500 transition text-slate-300"
      >
        <span>Seleccionar inciso...</span>
        <span className="text-xs">{estaAbierto ? '▲' : '▼'}</span>
      </button>

      {estaAbierto && (
        <div className="absolute top-[90px] left-0 w-full bg-slate-900 border border-slate-600 rounded-lg shadow-2xl z-50 max-h-96 overflow-y-auto">
          {EJERCICIOS_PREDEFINIDOS.map((ejercicio) => (
            <button
              key={ejercicio.etiqueta}
              onClick={() => {
                alSeleccionarEjercicio(ejercicio);
                setEstaAbierto(false);
              }}
              className="w-full text-left py-4 px-5 hover:bg-slate-800 border-b border-slate-700/50 transition group flex items-center gap-4"
            >
              <span className="text-blue-400 font-bold text-lg min-w-[20px]">{ejercicio.etiqueta}</span>
              {/* Reduccion del 10% en el escalado para asegurar que los bloques LaTeX grandes encajen correctamente */}
              <div className="text-slate-300 group-hover:text-white pointer-events-none scale-[0.9] origin-left py-2">
                <KaTeX expresionTex={ejercicio.definicionLatex} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}