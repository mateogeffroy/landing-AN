'use client';
import KaTeX from './KaTeX';

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
  
  const exportToCSV = () => {
    let csvContent = "n,an,bn\n";
    csvContent += `0,${a0},0\n`;
    const maxN = Math.min(harmonics, an.length);
    for (let i = 0; i < maxN; i++) {
      csvContent += `${i + 1},${an[i] || 0},${bn[i] || 0}\n`;
    }
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "coeficientes_fourier.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trunca ceros pero mantiene el número
  const formatNum = (num: number) => parseFloat(num.toFixed(6)).toString();

  return (
    <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white">Coeficientes de Fourier</h3>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors text-xs font-semibold shadow-md"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Exportar CSV
        </button>
      </div>
      
      <div className="mb-6">
        <p className="text-blue-400 font-semibold mb-2">a₀ (Componente DC)</p>
        <p className="text-slate-300 font-mono text-sm bg-slate-900/50 p-3 rounded flex items-center">
          <span className="w-8">a₀ =</span>
          <span className="inline-block min-w-[80px] text-emerald-400">{formatNum(a0)}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-blue-400 font-semibold mb-2">Coeficientes aₙ</p>
          <div className="bg-slate-900/50 p-3 rounded max-h-40 overflow-y-auto">
            {Array.from({ length: Math.min(harmonics, an.length) }).map((_, i) => (
              <p key={`an-${i}`} className="text-slate-300 font-mono text-xs mb-1 flex items-center">
                <span className="w-10">a<sub>{i + 1}</sub> =</span>
                <span className="inline-block min-w-[80px] text-emerald-400">{formatNum(an[i] || 0)}</span>
              </p>
            ))}
          </div>
        </div>

        <div>
          <p className="text-blue-400 font-semibold mb-2">Coeficientes bₙ</p>
          <div className="bg-slate-900/50 p-3 rounded max-h-40 overflow-y-auto">
            {Array.from({ length: Math.min(harmonics, bn.length) }).map((_, i) => (
              <p key={`bn-${i}`} className="text-slate-300 font-mono text-xs mb-1 flex items-center">
                <span className="w-10">b<sub>{i + 1}</sub> =</span>
                <span className="inline-block min-w-[80px] text-emerald-400">{formatNum(bn[i] || 0)}</span>
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-slate-900/80 border border-slate-700 rounded overflow-x-auto space-y-6">
        <div>
          <p className="text-slate-400 text-xs mb-3 uppercase tracking-wider">Fórmula General</p>
          <div className="text-slate-200 bg-slate-950/50 py-3 rounded text-center">
            <KaTeX tex={String.raw`f(x) = \frac{a_0}{2} + \sum_{n=1}^{N}\left[a_n\cos\left(\frac{n\pi x}{L}\right) + b_n\sin\left(\frac{n\pi x}{L}\right)\right]`} display={true} />
          </div>
        </div>
        
        <div>
          <p className="text-slate-400 text-xs mb-3 uppercase tracking-wider">Cálculo de Coeficientes</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-300">
            <div className="bg-slate-950/50 py-3 rounded text-center overflow-x-auto">
              <KaTeX tex={String.raw`a_0 = \frac{1}{L}\int_{-L}^{L} f(x)\,dx`} display={true} />
            </div>
            <div className="bg-slate-950/50 py-3 rounded text-center overflow-x-auto">
              <KaTeX tex={String.raw`a_n = \frac{1}{L}\int_{-L}^{L} f(x)\cos\left(\frac{n\pi x}{L}\right)dx`} display={true} />
            </div>
            <div className="bg-slate-950/50 py-3 rounded text-center overflow-x-auto">
              <KaTeX tex={String.raw`b_n = \frac{1}{L}\int_{-L}^{L} f(x)\sin\left(\frac{n\pi x}{L}\right)dx`} display={true} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}