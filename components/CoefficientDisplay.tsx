'use client';

interface CoefficientDisplayProps {
  a0: number;
  an: number[];
  bn: number[];
  harmonics: number;
}

export default function CoefficientDisplay({
  a0,
  an,
  bn,
  harmonics,
}: CoefficientDisplayProps) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
      <h3 className="text-lg font-bold text-white mb-4">Coeficientes de Fourier</h3>
      
      <div className="mb-6">
        <p className="text-blue-400 font-semibold mb-2">a₀ (Componente DC)</p>
        <p className="text-slate-300 font-mono text-sm bg-slate-900/50 p-3 rounded">
          a₀ = {a0.toFixed(6)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-blue-400 font-semibold mb-2">Coeficientes aₙ (Cosenos)</p>
          <div className="bg-slate-900/50 p-3 rounded max-h-40 overflow-y-auto">
            {Array.from({ length: Math.min(harmonics, an.length - 1) }).map(
              (_, i) => (
                <p key={`an-${i}`} className="text-slate-300 font-mono text-xs mb-1">
                  a<sub>{i + 1}</sub> = {an[i + 1]?.toFixed(6) || '0.000000'}
                </p>
              )
            )}
          </div>
        </div>

        <div>
          <p className="text-blue-400 font-semibold mb-2">Coeficientes bₙ (Senos)</p>
          <div className="bg-slate-900/50 p-3 rounded max-h-40 overflow-y-auto">
            {Array.from({ length: Math.min(harmonics, bn.length - 1) }).map(
              (_, i) => (
                <p key={`bn-${i}`} className="text-slate-300 font-mono text-xs mb-1">
                  b<sub>{i + 1}</sub> = {bn[i + 1]?.toFixed(6) || '0.000000'}
                </p>
              )
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded">
        <p className="text-slate-300 text-sm">
          <span className="text-blue-400 font-semibold">Fórmula:</span>
        </p>
        <p className="text-slate-300 font-mono text-xs mt-2">
          f(x) = a₀/2 + Σ(aₙ·cos(nπx/L) + bₙ·sin(nπx/L))
        </p>
      </div>
    </div>
  );
}
