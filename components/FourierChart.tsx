'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface FourierChartProps {
  data: Array<{
    x: number;
    original: number;
    fourier: number;
  }>;
  title: string;
}

export default function FourierChart({ data, title }: FourierChartProps) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
      <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
          <XAxis
            dataKey="x"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            stroke="#64748b"
          />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} stroke="#64748b" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#e2e8f0' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Line
            type="monotone"
            dataKey="original"
            stroke="#ef4444"
            dot={false}
            strokeWidth={2}
            name="Función Original"
            isAnimationActive={true}
          />
          <Line
            type="monotone"
            dataKey="fourier"
            stroke="#3b82f6"
            dot={false}
            strokeWidth={2}
            name="Serie de Fourier"
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
