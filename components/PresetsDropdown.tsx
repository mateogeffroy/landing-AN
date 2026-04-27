'use client';

import { PiecewisePart } from './PiecewiseFunctionEditor';

export interface FourierPreset {
  name: string;
  description: string;
  parts: PiecewisePart[];
}

export const FOURIER_PRESETS: FourierPreset[] = [
  {
    name: 'Onda Cuadrada',
    description: 'f(x) = {1 para 0≤x≤1; -1 para -1≤x<0}',
    parts: [
      {
        id: '1',
        condition: '-1 <= x < 0',
        expression: '-1',
      },
      {
        id: '2',
        condition: '0 <= x <= 1',
        expression: '1',
      },
    ],
  },
  {
    name: 'Pulso Rectangular',
    description: 'f(x) = {1 para |x|≤1/2; 0 para 1/2<|x|≤1}',
    parts: [
      {
        id: '1',
        condition: 'abs(x) <= 0.5',
        expression: '1',
      },
      {
        id: '2',
        condition: '0.5 < abs(x) <= 1',
        expression: '0',
      },
    ],
  },
  {
    name: 'Función Lineal',
    description: 'f(x) = x, |x| ≤ 1',
    parts: [
      {
        id: '1',
        condition: '-1 <= x <= 1',
        expression: 'x',
      },
    ],
  },
  {
    name: 'Función Lineal Desplazada',
    description: 'f(x) = x - 1, |x| ≤ 1',
    parts: [
      {
        id: '1',
        condition: '-1 <= x <= 1',
        expression: 'x - 1',
      },
    ],
  },
  {
    name: 'Valor Absoluto',
    description: 'f(x) = |x|, |x| ≤ 1',
    parts: [
      {
        id: '1',
        condition: '-1 <= x <= 1',
        expression: 'abs(x)',
      },
    ],
  },
];

interface PresetsDropdownProps {
  onSelectPreset: (preset: FourierPreset) => void;
}

export default function PresetsDropdown({ onSelectPreset }: PresetsDropdownProps) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
      <h3 className="text-sm font-semibold text-blue-400 mb-3">
        📚 Ejemplos Predefinidos
      </h3>
      <div className="space-y-2">
        {FOURIER_PRESETS.map((preset) => (
          <button
            key={preset.name}
            onClick={() => onSelectPreset(preset)}
            className="w-full text-left p-3 bg-slate-900/50 hover:bg-slate-900 border border-slate-600 hover:border-blue-500 rounded-lg transition group"
          >
            <p className="font-semibold text-white group-hover:text-blue-400 transition">
              {preset.name}
            </p>
            <p className="text-xs text-slate-400 mt-1">{preset.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
