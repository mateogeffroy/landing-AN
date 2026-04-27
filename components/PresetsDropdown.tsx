'use client';
import { useState, useRef, useEffect } from 'react';
import KaTeX from './KaTeX';
import { PiecewisePart } from './PiecewiseFunctionEditor';

export interface FourierPreset {
  label: string;
  latexDef: string;
  mode: 'simple' | 'piecewise';
  expression?: string;
  pMin?: number;
  pMax?: number;
  parts?: PiecewisePart[];
}

export const FOURIER_PRESETS: FourierPreset[] = [
  {
    label: 'a)',
    latexDef: String.raw`f(x)=\begin{cases}1, & 0\le x\le1\\-1, & -1<x\le0\end{cases}`,
    mode: 'piecewise',
    parts: [
      { id: '1', condition: '-1 < x <= 0', expression: '-1' },
      { id: '2', condition: '0 <= x <= 1', expression: '1' },
    ],
  },
  {
    label: 'b)',
    latexDef: String.raw`f(x)=\begin{cases}1, & |x|\le\tfrac{1}{2}\\0, & \tfrac{1}{2}<|x|\le1\end{cases}`,
    mode: 'piecewise',
    parts: [
      { id: '1', condition: '-1 <= x < -0.5', expression: '0' },
      { id: '2', condition: '-0.5 <= x <= 0.5', expression: '1' },
      { id: '3', condition: '0.5 < x <= 1', expression: '0' },
    ],
  },
  {
    label: 'c)',
    latexDef: String.raw`f(x)=x, \quad |x|\le1`,
    mode: 'simple', expression: 'x', pMin: -1, pMax: 1,
  },
  {
    label: 'd)',
    latexDef: String.raw`f(x)=x-1, \quad |x|\le1`,
    mode: 'simple', expression: 'x - 1', pMin: -1, pMax: 1,
  },
  {
    label: 'e)',
    latexDef: String.raw`f(x)=|x|, \quad |x|\le1`,
    mode: 'simple', expression: 'abs(x)', pMin: -1, pMax: 1,
  },
  {
    label: 'f)',
    latexDef: String.raw`f(x)=x^2, \quad |x|\le1`,
    mode: 'simple', expression: 'x^2', pMin: -1, pMax: 1,
  },
  {
    label: 'g)',
    latexDef: String.raw`f(x)=3x-2x^2, \quad |x|\le1`,
    mode: 'simple', expression: '3*x - 2*x^2', pMin: -1, pMax: 1,
  },
];

interface PresetsDropdownProps {
  onSelectPreset: (preset: FourierPreset) => void;
}

export default function PresetsDropdown({ onSelectPreset }: PresetsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700 relative h-full flex flex-col justify-center" ref={dropdownRef}>
      {/* Título con SVG */}
      <h3 className="flex items-center gap-2 text-sm font-semibold text-blue-400 mb-3 uppercase tracking-wider">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        Ejercicios del TP
      </h3>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-3 bg-slate-900 border border-slate-600 rounded-lg hover:border-blue-500 transition text-slate-300"
      >
        <span>Seleccionar inciso...</span>
        <span className="text-xs">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="absolute top-[90px] left-0 w-full bg-slate-900 border border-slate-600 rounded-lg shadow-2xl z-50 max-h-96 overflow-y-auto">
          {FOURIER_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                onSelectPreset(preset);
                setIsOpen(false);
              }}
              className="w-full text-left py-4 px-5 hover:bg-slate-800 border-b border-slate-700/50 transition group flex items-center gap-4"
            >
              <span className="text-blue-400 font-bold text-lg min-w-[20px]">{preset.label}</span>
              {/* Le bajamos un 10% el tamaño para asegurar que las fracciones y cases entren bien */}
              <div className="text-slate-300 group-hover:text-white pointer-events-none scale-[0.9] origin-left py-2">
                <KaTeX tex={preset.latexDef} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}