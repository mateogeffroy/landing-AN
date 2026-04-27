'use client';

import { useState } from 'react';
import MathInput from './MathInput';

export interface PiecewisePart {
  id: string;
  condition: string; // ej: "-1 <= x <= 0"
  expression: string; // ascii-math para mathjs
  latexExpression?: string; // visual para el input
}

interface PiecewiseFunctionEditorProps {
  parts: PiecewisePart[];
  onPartsChange: (parts: PiecewisePart[]) => void;
}

export default function PiecewiseFunctionEditor({
  parts,
  onPartsChange,
}: PiecewiseFunctionEditorProps) {
  const [expandedEditor, setExpandedEditor] = useState(false);

  const addPart = () => {
    const newPart: PiecewisePart = {
      id: Date.now().toString(),
      condition: '-1 <= x < 0',
      expression: 'x',
      latexExpression: 'x',
    };
    onPartsChange([...parts, newPart]);
  };

  const removePart = (id: string) => {
    onPartsChange(parts.filter((p) => p.id !== id));
  };

  const updateCondition = (id: string, value: string) => {
    onPartsChange(parts.map((p) => (p.id === id ? { ...p, condition: value } : p)));
  };

  const updateExpression = (id: string, latex: string, ascii: string) => {
    onPartsChange(
      parts.map((p) => (p.id === id ? { ...p, expression: ascii, latexExpression: latex } : p))
    );
  };

  return (
    <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white">Función a Trozos</h3>
        <button
          onClick={() => setExpandedEditor(!expandedEditor)}
          className="text-xs font-semibold bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded transition shadow"
        >
          {expandedEditor ? 'Contraer Editor' : 'Expandir Editor'}
        </button>
      </div>

      {expandedEditor ? (
        <div className="space-y-4">
          {parts.map((part, index) => (
            <div key={part.id} className="bg-slate-900/50 p-4 rounded-lg border border-slate-600">
              <div className="flex justify-between items-start mb-3">
                <p className="text-sm font-semibold text-slate-300">Tramo {index + 1}</p>
                {parts.length > 1 && (
                  <button
                    onClick={() => removePart(part.id)}
                    className="text-red-400 hover:text-red-300 text-xs font-semibold transition bg-red-400/10 px-2 py-1 rounded"
                  >
                    ✕ Eliminar
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-blue-300 mb-1 uppercase tracking-wider">
                    Condición (Intervalo)
                  </label>
                  <input
                    type="text"
                    value={part.condition}
                    onChange={(e) => updateCondition(part.id, e.target.value)}
                    placeholder="Ej: 0 <= x <= 1"
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500 transition text-sm shadow-inner"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Operadores válidos: &lt; o &lt;=
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-blue-300 mb-1 uppercase tracking-wider">
                    Expresión f(x)
                  </label>
                  {/* Acá inyectamos la magia del teclado */}
                  <MathInput
                    latexValue={part.latexExpression || part.expression}
                    onMathChange={(latex, ascii) => updateExpression(part.id, latex, ascii)}
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addPart}
            className="w-full py-3 border border-dashed border-blue-500 text-blue-400 hover:bg-blue-500/10 rounded-lg font-semibold transition text-sm"
          >
            + Agregar Tramo
          </button>
        </div>
      ) : (
        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-600 max-h-40 overflow-y-auto space-y-2">
          {parts.map((part, index) => (
            <p key={part.id} className="text-sm text-slate-300 font-mono">
              <span className="text-blue-400 font-bold">{index + 1}.</span> f(x) = {part.expression}, cuando {part.condition}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}