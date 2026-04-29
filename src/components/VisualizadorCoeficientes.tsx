'use client';
import KaTeX from './KaTeX';

interface PropiedadesVisualizadorCoeficientes {
  a0: number;
  an: number[];
  bn: number[];
  armonicos: number;
}

export default function VisualizadorCoeficientes({ a0, an, bn, armonicos }: PropiedadesVisualizadorCoeficientes) {
  
  const exportarACSV = () => {
    let contenidoCSV = "n,an,bn\n";
    contenidoCSV += `0,${a0},0\n`;
    const limiteN = Math.min(armonicos, an.length);
    for (let i = 0; i < limiteN; i++) {
      contenidoCSV += `${i + 1},${an[i] || 0},${bn[i] || 0}\n`;
    }
    const objetoBlob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const urlDescarga = URL.createObjectURL(objetoBlob);
    const enlaceTemporal = document.createElement("a");
    enlaceTemporal.setAttribute("href", urlDescarga);
    enlaceTemporal.setAttribute("download", "coeficientes_fourier.csv");
    document.body.appendChild(enlaceTemporal);
    enlaceTemporal.click();
    document.body.removeChild(enlaceTemporal);
  };

  const formatearNumero = (numero: number) => parseFloat(numero.toFixed(6)).toString();

  return (
    <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white">Coeficientes de Fourier</h3>
        <button onClick={exportarACSV} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors text-xs font-semibold shadow-md">
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
          <span className="inline-block min-w-[80px] text-emerald-400">{formatearNumero(a0)}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div>
          <p className="text-blue-400 font-semibold mb-2">Coeficientes aₙ</p>
          <div className="bg-slate-900/50 p-3 rounded max-h-48 overflow-y-auto">
            {Array.from({ length: Math.min(armonicos, an.length) }).map((_, i) => (
              <p key={`an-${i}`} className="text-slate-300 font-mono text-xs mb-1 flex items-center">
                <span className="w-10">a<sub>{i + 1}</sub> =</span>
                <span className="inline-block min-w-[80px] text-emerald-400">{formatearNumero(an[i] || 0)}</span>
              </p>
            ))}
          </div>
        </div>

        <div>
          <p className="text-blue-400 font-semibold mb-2">Coeficientes bₙ</p>
          <div className="bg-slate-900/50 p-3 rounded max-h-48 overflow-y-auto">
            {Array.from({ length: Math.min(armonicos, bn.length) }).map((_, i) => (
              <p key={`bn-${i}`} className="text-slate-300 font-mono text-xs mb-1 flex items-center">
                <span className="w-10">b<sub>{i + 1}</sub> =</span>
                <span className="inline-block min-w-[80px] text-emerald-400">{formatearNumero(bn[i] || 0)}</span>
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Seccion integrada de formulas de calculo de coeficientes */}
      <div className="pt-6 border-t border-slate-700 space-y-4">
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4 text-center">Fórmulas de Cálculo de Coeficientes</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-300">
          <div className="bg-slate-900/80 py-4 px-2 rounded-xl text-center border border-slate-700/50 overflow-x-auto shadow-inner">
            <KaTeX expresionTex={String.raw`a_0 = \frac{2}{T}\cdot\int_{-L}^{+L}f(t)\cdot dt`} enBloque={true} />
          </div>
          <div className="bg-slate-900/80 py-4 px-2 rounded-xl text-center border border-slate-700/50 overflow-x-auto shadow-inner">
            <KaTeX expresionTex={String.raw`a_n = \frac{2}{T}\cdot\int_{-L}^{+L}f(t)\cdot \cos(n\omega t)\cdot dt`} enBloque={true} />
          </div>
          <div className="bg-slate-900/80 py-4 px-2 rounded-xl text-center border border-slate-700/50 overflow-x-auto shadow-inner">
            <KaTeX expresionTex={String.raw`b_n = \frac{2}{T}\cdot\int_{-L}^{+L}f(t)\cdot \sin(n\omega t)\cdot dt`} enBloque={true} />
          </div>
        </div>
      </div>
    </div>
  );
}