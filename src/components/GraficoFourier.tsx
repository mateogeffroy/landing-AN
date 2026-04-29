'use client';

import { useRef, useMemo } from 'react';
import html2canvas from 'html2canvas';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';

interface PropiedadesGraficoFourier {
  datos: Array<{ x: number; 'f(x)': number; Fourier: number; }>;
  titulo?: string;
  periodoL: number;
  periodoT: number;
  armonicos: number;
  paridad: 'par' | 'impar' | 'ninguna';
  alCambiarArmonicos: (n: number) => void;
}

const MarcaEjeXPersonalizada = ({ x, y, payload }: any) => {
  const esValorElemental = Math.abs(payload.value) < 1e-5 || Math.abs(Math.abs(payload.value) - 1) < 1e-5 || Math.abs(Math.abs(payload.value) - 2) < 1e-5;
  
  return (
    <g transform={`translate(${x},${y})`}>
      <text 
        x={0} y={0} dy={16} textAnchor="middle" 
        fill={esValorElemental ? '#ffffff' : '#64748b'} 
        fontWeight={esValorElemental ? 800 : 400}
        fontSize={esValorElemental ? 13 : 11}
      >
        {parseFloat(payload.value.toFixed(2))}
      </text>
    </g>
  );
};

export default function GraficoFourier({ datos, titulo, periodoL, periodoT, armonicos, paridad, alCambiarArmonicos }: PropiedadesGraficoFourier) {
  const referenciaGrafico = useRef<HTMLDivElement>(null);

  const marcasEjeXForzadas = useMemo(() => {
    return [-periodoT, -periodoL, 0, periodoL, periodoT].map(valor => parseFloat(valor.toFixed(4)));
  }, [periodoL, periodoT]);

  const exportarComoPNG = async () => {
    if (referenciaGrafico.current) {
      const lienzo = await html2canvas(referenciaGrafico.current, { backgroundColor: '#0f172a' });
      const enlaceDescarga = document.createElement('a');
      enlaceDescarga.download = 'grafico_fourier.png';
      enlaceDescarga.href = lienzo.toDataURL('image/png');
      enlaceDescarga.click();
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-5 shadow-lg">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h3 className="text-xl md:text-2xl font-bold text-white pl-4 whitespace-nowrap">
          {titulo || 'Gráfico de la Función'}
        </h3>

        <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-700 w-full md:w-auto shadow-inner">
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Armónicos:</span>
          <div className="flex items-center gap-1">
            <button onClick={() => alCambiarArmonicos(Math.max(1, armonicos - 1))} className="text-slate-400 hover:text-white font-bold px-2 text-lg leading-none">-</button>
            <input 
              type="number" 
              value={armonicos} 
              onChange={evento => alCambiarArmonicos(Math.max(1, parseInt(evento.target.value) || 1))} 
              className="w-10 bg-transparent text-center text-sm font-bold text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
            />
            <button onClick={() => alCambiarArmonicos(armonicos + 1)} className="text-slate-400 hover:text-white font-bold px-2 text-lg leading-none">+</button>
          </div>
          <input 
            type="range" min="1" max="100" value={armonicos} 
            onChange={evento => alCambiarArmonicos(parseInt(evento.target.value))} 
            className="w-24 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hidden sm:block" 
          />
        </div>

        <button onClick={exportarComoPNG} className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-md text-sm font-bold transition-all shadow-lg active:scale-95 whitespace-nowrap">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Exportar PNG
        </button>
      </div>

      {/* Seccion de informacion tecnica del periodo y paridad */}
      <div className="flex flex-wrap gap-4 md:gap-6 bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-2 mb-6 text-xs font-mono w-fit shadow-sm items-center">
        <div><span className="text-slate-500 uppercase tracking-tighter mr-2">T:</span><span className="text-emerald-400 font-bold">{parseFloat(periodoT.toFixed(4))}</span></div>
        <div><span className="text-slate-500 uppercase tracking-tighter mr-2">L:</span><span className="text-emerald-400 font-bold">{parseFloat(periodoL.toFixed(4))}</span></div>
        <div><span className="text-slate-500 uppercase tracking-tighter mr-2">Rango:</span><span className="text-emerald-400 font-bold">[-{parseFloat(periodoL.toFixed(2))}, {parseFloat(periodoL.toFixed(2))}]</span></div>
        
        {/* Badge de Paridad integrado a la derecha de los datos del periodo */}
        <div className="border-l border-slate-700 pl-4 ml-2">
          {paridad === 'par' && <span className="text-blue-400 font-bold uppercase tracking-widest text-[10px]">Función Par</span>}
          {paridad === 'impar' && <span className="text-emerald-400 font-bold uppercase tracking-widest text-[10px]">Función Impar</span>}
          {paridad === 'ninguna' && <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Sin Paridad</span>}
        </div>
      </div>

      <div ref={referenciaGrafico} className="p-2">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={datos} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="x" type="number" domain={[-periodoT, periodoT]} ticks={marcasEjeXForzadas} tick={<MarcaEjeXPersonalizada />} stroke="#475569" />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} stroke="#475569" width={45} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '12px' }} itemStyle={{ fontWeight: 'bold' }} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <ReferenceLine x={0} stroke="#64748b" strokeWidth={2} />
            <ReferenceLine y={0} stroke="#64748b" strokeWidth={2} />
            <Line type="monotone" dataKey="f(x)" stroke="#3b82f6" dot={false} strokeWidth={3} name="Función Original" isAnimationActive={false} />
            <Line type="monotone" dataKey="Fourier" stroke="#f59e0b" dot={false} strokeWidth={2} name="Aproximación" isAnimationActive={true} animationDuration={400} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}