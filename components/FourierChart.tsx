'use client';

import { useRef, useMemo } from 'react';
import html2canvas from 'html2canvas';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';

interface FourierChartProps {
  data: Array<{ x: number; 'f(x)': number; Fourier: number; }>;
  title?: string;
  periodL: number;
  periodT: number;
  harmonics: number;
  onHarmonicsChange: (n: number) => void;
}

const CustomXTick = ({ x, y, payload }: any) => {
  const isElemental = Math.abs(payload.value) < 1e-5 || Math.abs(Math.abs(payload.value) - 1) < 1e-5 || Math.abs(Math.abs(payload.value) - 2) < 1e-5;
  return (
    <g transform={`translate(${x},${y})`}>
      <text 
        x={0} y={0} dy={16} textAnchor="middle" 
        fill={isElemental ? '#ffffff' : '#64748b'} 
        fontWeight={isElemental ? 800 : 400}
        fontSize={isElemental ? 13 : 11}
      >
        {parseFloat(payload.value.toFixed(2))}
      </text>
    </g>
  );
};

export default function FourierChart({ data, title, periodL, periodT, harmonics, onHarmonicsChange }: FourierChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const forcedTicks = useMemo(() => {
    return [-periodT, -periodL, 0, periodL, periodT].map(v => parseFloat(v.toFixed(4)));
  }, [periodL, periodT]);

  const exportToPNG = async () => {
    if (chartRef.current) {
      const canvas = await html2canvas(chartRef.current, { backgroundColor: '#0f172a' });
      const link = document.createElement('a');
      link.download = 'grafico_fourier.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-5 shadow-lg">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h3 className="text-xl md:text-2xl font-bold text-white pl-4 whitespace-nowrap">
          Gráfico de la Función
        </h3>

        <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-700 w-full md:w-auto shadow-inner">
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Armónicos:</span>
          <div className="flex items-center gap-1">
            <button onClick={() => onHarmonicsChange(Math.max(1, harmonics - 1))} className="text-slate-400 hover:text-white font-bold px-2 text-lg leading-none">-</button>
            <input 
              type="number" 
              value={harmonics} 
              onChange={e => onHarmonicsChange(Math.max(1, parseInt(e.target.value) || 1))} 
              // ¡Acá está la magia para borrar las flechas nativas!
              className="w-10 bg-transparent text-center text-sm font-bold text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
            />
            <button onClick={() => onHarmonicsChange(harmonics + 1)} className="text-slate-400 hover:text-white font-bold px-2 text-lg leading-none">+</button>
          </div>
          <input 
            type="range" min="1" max="100" value={harmonics} 
            onChange={e => onHarmonicsChange(parseInt(e.target.value))} 
            className="w-24 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hidden sm:block" 
          />
        </div>

        {/* Botón con SVG */}
        <button onClick={exportToPNG} className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-md text-sm font-bold transition-all shadow-lg active:scale-95 whitespace-nowrap">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Exportar PNG
        </button>
      </div>

      <div className="flex gap-6 bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-2 mb-6 text-xs font-mono w-fit shadow-sm">
        <div><span className="text-slate-500 uppercase tracking-tighter mr-2">T:</span><span className="text-emerald-400 font-bold">{parseFloat(periodT.toFixed(4))}</span></div>
        <div><span className="text-slate-500 uppercase tracking-tighter mr-2">L:</span><span className="text-emerald-400 font-bold">{parseFloat(periodL.toFixed(4))}</span></div>
        <div><span className="text-slate-500 uppercase tracking-tighter mr-2">Rango:</span><span className="text-emerald-400 font-bold">[-{parseFloat(periodL.toFixed(2))}, {parseFloat(periodL.toFixed(2))}]</span></div>
      </div>

      <div ref={chartRef} className="p-2">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="x" type="number" domain={[-periodT, periodT]} ticks={forcedTicks} tick={<CustomXTick />} stroke="#475569" />
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