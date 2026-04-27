'use client';

import { useState } from 'react';

export interface PiecewisePart {
  id: string;
  condition: string; // ej: "0 <= x <= 1"
  expression: string; // ej: "x^2"
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
    };
    onPartsChange([...parts, newPart]);
  };

  const removePart = (id: string) => {
    onPartsChange(parts.filter((p) => p.id !== id));
  };

  const updatePart = (
    id: string,
    field: 'condition' | 'expression',
    value: string
  ) => {
    onPartsChange(
      parts.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  return (
    <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white">Funciones a Trozos</h3>
        <button
          onClick={() => setExpandedEditor(!expandedEditor)}
          className="text-xs bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition"
        >
          {expandedEditor ? 'Contraer' : 'Expandir'}
        </button>
      </div>

      {expandedEditor ? (
        <div className="space-y-4">
          {parts.map((part, index) => (
            <div key={part.id} className="bg-slate-900/50 p-4 rounded border border-slate-600">
              <div className="flex justify-between items-start mb-3">
                <p className="text-sm text-slate-400">Parte {index + 1}</p>
                {parts.length > 1 && (
                  <button
                    onClick={() => removePart(part.id)}
                    className="text-red-400 hover:text-red-300 text-sm transition"
                  >
                    Eliminar
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-blue-300 mb-1">
                    Condición
                  </label>
                  <input
                    type="text"
                    value={part.condition}
                    onChange={(e) => updatePart(part.id, 'condition', e.target.value)}
                    placeholder="Ej: 0 <= x <= 1"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Ej: -1 &lt; x &lt;= 0, 0 &lt;= x &lt;= 1, |x| &lt;= 1/2
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-blue-300 mb-1">
                    Expresión f(x)
                  </label>
                  <input
                    type="text"
                    value={part.expression}
                    onChange={(e) => updatePart(part.id, 'expression', e.target.value)}
                    placeholder="Ej: x^2, sin(x), 1"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition text-sm"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addPart}
            className="w-full py-2 border border-dashed border-blue-500 text-blue-400 hover:bg-blue-500/10 rounded transition text-sm"
          >
            + Agregar parte
          </button>
        </div>
      ) : (
        <div className="bg-slate-900/50 p-3 rounded border border-slate-600 max-h-32 overflow-y-auto">
          {parts.map((part, index) => (
            <p key={part.id} className="text-xs text-slate-300 mb-1 font-mono">
              {index + 1}. f(x) = {part.expression}, cuando {part.condition}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
