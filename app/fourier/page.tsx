 'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

import { useState, useMemo, useEffect, useRef } from 'react';
import * as math from 'mathjs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

// ─── KaTeX (loaded from CDN once) ────────────────────────────────────────────

declare global {
  interface Window {
    katex?: { renderToString: (tex: string, opts?: Record<string, unknown>) => string };
  }
}

function useKaTeX(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.katex) { setReady(true); return; }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.js';
    script.onload = () => setReady(true);
    document.head.appendChild(script);
  }, []);
  return ready;
}

function KaTeX({ tex, display = false }: { tex: string; display?: boolean }) {
  const ready = useKaTeX();
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (ready && ref.current && window.katex) {
      ref.current.innerHTML = window.katex.renderToString(tex, {
        displayMode: display,
        throwOnError: false,
      });
    }
  }, [tex, display, ready]);
  if (!ready) return <span className="text-slate-500 text-xs">…</span>;
  return <span ref={ref} />;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface PiecewisePart { id: string; condition: string; expression: string; }
interface FourierCoeffs { a0: number; an: number[]; bn: number[]; }

// ─── Presets (exercises a–g) ──────────────────────────────────────────────────

const PRESETS = [
  {
    label: 'a)',
    description: 'f(x) = 1 si 0≤x≤1, −1 si −1<x<0',
    latexDef: String.raw`f(x)=\begin{cases}1 & 0\le x\le1\\-1 & -1<x<0\end{cases},\quad |x|\le1`,
    mode: 'piecewise' as const,
    parts: [
      { id: '1', condition: '-1 <= x < 0', expression: '-1' },
      { id: '2', condition: '0 <= x <= 1', expression: '1' },
    ],
  },
  {
    label: 'b)',
    description: 'f(x) = 1 si |x|≤½, 0 si ½<|x|≤1',
    latexDef: String.raw`f(x)=\begin{cases}1 & |x|\le\tfrac{1}{2}\\0 & \tfrac{1}{2}<|x|\le1\end{cases}`,
    mode: 'piecewise' as const,
    parts: [
      { id: '1', condition: '-1 <= x < -0.5', expression: '0' },
      { id: '2', condition: '-0.5 <= x <= 0.5', expression: '1' },
      { id: '3', condition: '0.5 < x <= 1', expression: '0' },
    ],
  },
  {
    label: 'c)',
    description: 'f(x) = x, |x|≤1',
    latexDef: String.raw`f(x)=x,\quad |x|\le1`,
    mode: 'simple' as const, expression: 'x', periodMin: -1, periodMax: 1,
  },
  {
    label: 'd)',
    description: 'f(x) = x−1, |x|≤1',
    latexDef: String.raw`f(x)=x-1,\quad |x|\le1`,
    mode: 'simple' as const, expression: 'x - 1', periodMin: -1, periodMax: 1,
  },
  {
    label: 'e)',
    description: 'f(x) = |x|, |x|≤1',
    latexDef: String.raw`f(x)=|x|,\quad |x|\le1`,
    mode: 'simple' as const, expression: 'abs(x)', periodMin: -1, periodMax: 1,
  },
  {
    label: 'f)',
    description: 'f(x) = x², |x|≤1',
    latexDef: String.raw`f(x)=x^2,\quad |x|\le1`,
    mode: 'simple' as const, expression: 'x^2', periodMin: -1, periodMax: 1,
  },
  {
    label: 'g)',
    description: 'f(x) = 3x−2x², |x|≤1',
    latexDef: String.raw`f(x)=3x-2x^2,\quad |x|\le1`,
    mode: 'simple' as const, expression: '3*x - 2*x^2', periodMin: -1, periodMax: 1,
  },
];

// ─── Fourier math ─────────────────────────────────────────────────────────────

function trap(f: (x: number) => number, a: number, b: number, n = 2000): number {
  const h = (b - a) / n;
  let s = 0.5 * (f(a) + f(b));
  for (let i = 1; i < n; i++) s += f(a + i * h);
  return s * h;
}

function calcCoeffs(f: (x: number) => number, T: number, N: number): FourierCoeffs {
  const L = T / 2, a = -L, b = L;
  const a0 = (1 / L) * trap(f, a, b);
  const an: number[] = [], bn: number[] = [];
  for (let n = 1; n <= N; n++) {
    an.push((1 / L) * trap((x) => f(x) * Math.cos((n * Math.PI * x) / L), a, b));
    bn.push((1 / L) * trap((x) => f(x) * Math.sin((n * Math.PI * x) / L), a, b));
  }
  return { a0, an, bn };
}

function fourierVal(x: number, c: FourierCoeffs, L: number): number {
  let v = c.a0 / 2;
  for (let n = 1; n <= c.an.length; n++) {
    v += c.an[n - 1] * Math.cos((n * Math.PI * x) / L);
    v += c.bn[n - 1] * Math.sin((n * Math.PI * x) / L);
  }
  return v;
}

function periodicExt(f: (x: number) => number, L: number, x: number): number {
  const T = 2 * L;
  return f(((x + L) % T + T) % T - L);
}

// ─── Piecewise ────────────────────────────────────────────────────────────────

function condMatch(cond: string, x: number): boolean {
  const m = cond.replace(/\s+/g, '').match(/^(-?[\d.]+)(<=|<)(x)(<=|<)(-?[\d.]+)$/);
  if (!m) return false;
  const lo = parseFloat(m[1]), loOp = m[2], hiOp = m[4], hi = parseFloat(m[5]);
  return (loOp === '<=' ? x >= lo : x > lo) && (hiOp === '<=' ? x <= hi : x < hi);
}

function makePiecewise(parts: PiecewisePart[]): (x: number) => number {
  const compiled = parts.map((p) => ({ cond: p.condition, fn: math.compile(p.expression) }));
  return (x) => {
    for (const p of compiled) {
      if (condMatch(p.cond, x)) {
        try { const v = p.fn.evaluate({ x }); return typeof v === 'number' ? v : 0; }
        catch { return 0; }
      }
    }
    return 0;
  };
}

function rangeFromParts(parts: PiecewisePart[]): { min: number; max: number } {
  let min = Infinity, max = -Infinity;
  for (const p of parts) {
    const m = p.condition.replace(/\s+/g, '').match(/^(-?[\d.]+)(<=|<)(x)(<=|<)(-?[\d.]+)$/);
    if (m) { const lo = parseFloat(m[1]), hi = parseFloat(m[5]); if (lo < min) min = lo; if (hi > max) max = hi; }
  }
  return { min: isFinite(min) ? min : -1, max: isFinite(max) ? max : 1 };
}


function buildLatex(c: FourierCoeffs, L: number, N: number): string {
  const lStr = Math.abs(L - Math.PI) < 1e-5 ? '\\pi' : n2s(L, 4);
  const terms: string[] = [];

  const half = c.a0 / 2;
  if (Math.abs(half) > 1e-9) terms.push(n2s(half));

  for (let n = 1; n <= N; n++) {
    const an = c.an[n - 1], bn = c.bn[n - 1];
    const carg = `\\dfrac{${n === 1 ? '' : n}\\pi x}{${lStr}}`;
    const sarg = `\\dfrac{${n === 1 ? '' : n}\\pi x}{${lStr}}`;
    if (Math.abs(an) > 1e-9) terms.push(`${n2s(an)}\\cos\\!\\left(${carg}\\right)`);
    if (Math.abs(bn) > 1e-9) terms.push(`${n2s(bn)}\\sin\\!\\left(\\smash{${sarg}}\\right)`);
  }

  if (terms.length === 0) return 'f(x) \\approx 0';
  let joined = terms[0];
  for (let i = 1; i < terms.length; i++) {
    joined += terms[i].startsWith('-') ? ` ${terms[i]}` : ` + ${terms[i]}`;
  }
  return `f(x) \\approx ${joined}`;
}

// ─── Chart tooltip ────────────────────────────────────────────────────────────

const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#07101e] border border-[#1e3a5f] rounded-md p-3 text-sm">
      <p className="text-sky-400 mb-1">x = {Number(label).toFixed(3)}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color, margin: '2px 0' }}>
          {p.name}: {Number(p.value).toFixed(4)}
        </p>
      ))}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function FourierPage() {
  // State
  const [mode, setMode] = useState<'simple' | 'piecewise'>('piecewise');
  const [expr, setExpr] = useState('sin(x)');
  const [pMin, setPMin] = useState(-Math.PI);
  const [pMax, setPMax] = useState(Math.PI);
  const [parts, setParts] = useState<PiecewisePart[]>([
    { id: '1', condition: '-1 <= x < 0', expression: '-1' },
    { id: '2', condition: '0 <= x <= 1', expression: '1' },
  ]);
  const [harmonics, setHarmonics] = useState(5);
  const [selectedPreset, setSelectedPreset] = useState<number>(0); // 0 = preset a) loaded by default
  const [dropOpen, setDropOpen] = useState(false);
  const [error, setError] = useState('');
  const dropRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => { if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Period
  const period = useMemo(() => {
    if (mode === 'piecewise') {
      const r = rangeFromParts(parts);
      const T = r.max - r.min;
      return { min: r.min, max: r.max, T, L: T / 2 };
    }
    const T = pMax - pMin;
    return { min: pMin, max: pMax, T, L: T / 2 };
  }, [mode, pMin, pMax, parts]);

  // Evaluator
  const evaluator = useMemo<((x: number) => number) | null>(() => {
    setError('');
    if (mode === 'simple') {
      try {
        const c = math.compile(expr);
        return (x) => { try { const v = c.evaluate({ x }); return typeof v === 'number' ? v : 0; } catch { return 0; } };
      } catch (e) {
        setError(`Función inválida: ${e instanceof Error ? e.message : ''}`);
        return null;
      }
    }
    try { return makePiecewise(parts); }
    catch (e) { setError(`Error: ${e instanceof Error ? e.message : ''}`); return null; }
  }, [mode, expr, parts]);

  // Coefficients
  const coeffs = useMemo<FourierCoeffs>(() => {
    if (!evaluator) return { a0: 0, an: [], bn: [] };
    return calcCoeffs(evaluator, period.T, harmonics);
  }, [evaluator, period.T, harmonics]);

  // Chart data from -T to +T
  const chartData = useMemo(() => {
    if (!evaluator) return [];
    const { T, L } = period;
    const N = 900;
    return Array.from({ length: N + 1 }, (_, i) => {
      const x = parseFloat((-T + (2 * T * i) / N).toFixed(5));
      return {
        x,
        'f(x)': parseFloat(periodicExt(evaluator, L, x).toFixed(5)),
        'Fourier': parseFloat(fourierVal(x, coeffs, L).toFixed(5)),
      };
    });
  }, [evaluator, coeffs, period]);

  // LaTeX formula
  const latexFormula = useMemo(() => buildLatex(coeffs, period.L, harmonics), [coeffs, period.L, harmonics]);

  // X ticks: -T, -L, 0, L, T
  const xTicks = useMemo(() => {
    const { T, L } = period;
    return [-T, -L, 0, L, T].map((v) => parseFloat(v.toFixed(6)));
  }, [period]);

  const fmtTick = (v: number) => {
    const { T, L } = period;
    if (Math.abs(v) < 1e-6) return '0';
    if (Math.abs(Math.abs(v) - L) < 1e-4) return v < 0 ? '−L' : 'L';
    if (Math.abs(Math.abs(v) - T) < 1e-4) return v < 0 ? '−T' : 'T';
    return v.toFixed(2);
  };

  // Apply preset
  const applyPreset = (idx: number) => {
    const p = PRESETS[idx];
    setSelectedPreset(idx);
    setDropOpen(false);
    if (p.mode === 'piecewise') { setMode('piecewise'); setParts(p.parts.map((pt) => ({ ...pt }))); }
    else { setMode('simple'); setExpr(p.expression); setPMin(p.periodMin); setPMax(p.periodMax); }
  };

  // Piecewise helpers
  const addPart = () => setParts((prev) => [...prev, { id: Date.now().toString(), condition: '0 <= x <= 1', expression: '0' }]);
  const removePart = (id: string) => setParts((prev) => prev.filter((p) => p.id !== id));
  const updatePart = (id: string, f: 'condition' | 'expression', val: string) =>
    setParts((prev) => prev.map((p) => (p.id === id ? { ...p, [f]: val } : p)));

  const currentPreset = selectedPreset >= 0 ? PRESETS[selectedPreset] : null;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <section className="flex-1 max-w-6xl mx-auto px-4 py-20 sm:px-6 lg:px-8 w-full">
        {/* ── Header ── */}
        <div style={{ marginBottom: 36 }}>
          <a href="/" className="text-sky-500 text-sm inline-block mb-2">← Volver</a>
          <h1 style={{
            fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-1px', margin: 0,
            background: 'linear-gradient(130deg,#60a5fa 0%,#a78bfa 55%,#34d399 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Serie de Fourier
          </h1>
          <p className="text-[#334155] text-sm mt-1">Calculadora interactiva · Visualización en tiempo real</p>
        </div>

        {/* ── Controls row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: 14, marginBottom: 16, alignItems: 'start' }}>

          {/* Preset dropdown */}
          <div ref={dropRef} className="relative">
            <p style={lbl}>Ejercicio precargado</p>
            <button
              onClick={() => setDropOpen((o) => !o)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                padding: '9px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                border: '1px solid #1e3a5f', background: '#080f1c',
                color: '#93c5fd', fontFamily: 'inherit', minWidth: 240,
              }}
            >
              <span>
                {currentPreset
                  ? <><b style={{ color: '#60a5fa' }}>{currentPreset.label}</b> {currentPreset.description}</>
                  : <span style={{ color: '#475569' }}>Personalizado</span>}
              </span>
              <span className="text-[9px] text-[#334155]">{dropOpen ? '▲' : '▼'}</span>
            </button>

            {dropOpen && (
              <div className="absolute top-[calc(100%+4px)] left-0 z-50 bg-[#0a1628] border border-[#1e3a5f] rounded-lg shadow-[0_20px_48px_rgba(0,0,0,.7)] min-w-[300px] overflow-hidden">
                {PRESETS.map((p, i) => (
                  <button key={p.label} onClick={() => applyPreset(i)} style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '10px 16px', border: 'none', cursor: 'pointer',
                    background: selectedPreset === i ? '#1a2f4e' : 'transparent',
                    color: selectedPreset === i ? '#93c5fd' : '#64748b',
                    fontSize: 13, fontFamily: 'inherit',
                    borderBottom: i < PRESETS.length - 1 ? '1px solid #111f35' : 'none',
                    transition: 'background .1s',
                  }}>
                    <b className="text-sky-400 mr-2">{p.label}</b>
                    {p.description}
                  </button>
                ))}
                <button onClick={() => { setSelectedPreset(-1); setDropOpen(false); setMode('simple'); setExpr('sin(x)'); setPMin(-Math.PI); setPMax(Math.PI); }}
                  className="block w-full text-left px-4 py-2 border-t border-[#111f35] text-[#334155] text-sm">
                  + Función personalizada
                </button>
              </div>
            )}
          </div>

          {/* Mode toggle */}
          <div>
            <p style={lbl}>Tipo de función</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
              {(['simple', 'piecewise'] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)} style={{
                  padding: '9px 16px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  background: mode === m ? '#1d4ed8' : '#0d1a2d',
                  color: mode === m ? '#fff' : '#334155',
                  fontSize: 13, fontFamily: 'inherit', fontWeight: mode === m ? 700 : 400,
                  transition: 'all .15s',
                }}>
                  {m === 'simple' ? 'Simple' : 'A trozos'}
                </button>
              ))}
            </div>
          </div>

          {/* Harmonics */}
          <div>
            <p style={lbl}>Armónicos N = <span style={{ color: '#60a5fa', fontWeight: 700 }}>{harmonics}</span></p>
            <input type="range" min={1} max={50} value={harmonics}
              onChange={(e) => setHarmonics(+e.target.value)}
              style={{ width: '100%', marginTop: 8, accentColor: '#3b82f6', cursor: 'pointer' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#1e293b', marginTop: 2 }}>
              <span>1</span><span>50</span>
            </div>
          </div>
        </div>

        {/* ── Function definition ── */}
        {mode === 'simple' ? (
          <div className="bg-[#0a1628] border border-[#111f35] rounded-xl p-4 mb-4">
            <p style={lbl}>Definición de f(x)</p>
            <div className="grid grid-cols-[1fr_100px_100px] gap-3 mt-2">
              <div>
                <p style={sublbl}>Expresión</p>
                <input value={expr} onChange={(e) => { setExpr(e.target.value); setSelectedPreset(-1); }}
                  placeholder="ej: sin(x), x^2, abs(x)" className="w-full px-3 py-2 bg-[#06101d] border border-[#111f35] rounded-md text-slate-100 text-sm font-mono outline-none" />
              </div>
              <div>
                <p style={sublbl}>x mín</p>
                <input type="number" value={pMin} onChange={(e) => setPMin(parseFloat(e.target.value) || -Math.PI)} className="w-full px-3 py-2 bg-[#06101d] border border-[#111f35] rounded-md text-slate-100 text-sm font-mono outline-none" />
              </div>
              <div>
                <p style={sublbl}>x máx</p>
                <input type="number" value={pMax} onChange={(e) => setPMax(parseFloat(e.target.value) || Math.PI)} className="w-full px-3 py-2 bg-[#06101d] border border-[#111f35] rounded-md text-slate-100 text-sm font-mono outline-none" />
              </div>
            </div>
            {error && <p style={{ color: '#f87171', fontSize: 12, marginTop: 8 }}>{error}</p>}
          </div>
        ) : (
          <div style={{ ...card, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <p style={lbl}>Función a trozos</p>
              <button onClick={addPart} className="px-3 py-2 rounded-md border border-[#1e3a5f] bg-[#080f1c] text-sky-400 text-sm">+ Agregar tramo</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, fontSize: 10, color: '#1e293b', marginBottom: 6 }}>
              <span>Condición &nbsp;(a &lt;= x &lt; b)</span><span>Expresión f(x)</span><span />
            </div>
            {parts.map((p) => (
              <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, marginBottom: 6 }}>
                <input value={p.condition} onChange={(e) => updatePart(p.id, 'condition', e.target.value)}
                  placeholder="-1 <= x < 0" className="w-full px-3 py-2 bg-[#06101d] border border-[#111f35] rounded-md text-slate-100 text-sm font-mono outline-none" />
                <input value={p.expression} onChange={(e) => updatePart(p.id, 'expression', e.target.value)}
                  placeholder="ej: -1" className="w-full px-3 py-2 bg-[#06101d] border border-[#111f35] rounded-md text-slate-100 text-sm font-mono outline-none" />
                <button onClick={() => removePart(p.id)} disabled={parts.length <= 1}
                  className={`px-3 py-2 rounded-md border ${parts.length <= 1 ? 'opacity-30' : ''}`} style={{ background: '#120808', color: '#f87171', borderColor: '#3d0606' }}>✕</button>
              </div>
            ))}
            {error && <p style={{ color: '#f87171', fontSize: 12, marginTop: 8 }}>{error}</p>}
          </div>
        )}

        {/* ── Period info bar ── */}
        <div className="flex gap-7 flex-wrap bg-[#080f1c] border border-[#111f35] rounded-lg px-4 py-2 mb-5 text-sm">
          {[
            ['Período T', period.T.toFixed(4)],
            ['Semi-período L', period.L.toFixed(4)],
            ['Rango base', `[${period.min.toFixed(3)}, ${period.max.toFixed(3)}]`],
            ['Gráfica', `[−T, +T] = [${(-period.T).toFixed(3)}, ${period.T.toFixed(3)}]`],
          ].map(([k, v]) => (
            <div key={k}>
              <span style={{ color: '#1e3a5f' }}>{k}: </span>
              <span style={{ color: '#7dd3fc', fontWeight: 700 }}>{v}</span>
            </div>
          ))}
        </div>

        {/* ── Chart ── */}
        <div className="bg-[#0a1628] border border-[#111f35] rounded-xl p-4 mb-5">
          <p className="uppercase tracking-widest text-xs text-[#334155] mb-3">
            Extensión periódica · −T a +T
            &nbsp;<span style={{ color: '#1e293b', fontWeight: 400, fontSize: 9 }}>
              (líneas punteadas = límites ±L del período base)
            </span>
          </p>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 4, right: 12, bottom: 4, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0d1a2d" />
              <XAxis dataKey="x" type="number"
                domain={[-period.T, period.T]}
                ticks={xTicks} tickFormatter={fmtTick}
                tick={{ fill: '#334155', fontSize: 11, fontFamily: 'inherit' }}
                stroke="#111f35" />
              <YAxis tick={{ fill: '#334155', fontSize: 11, fontFamily: 'inherit' }}
                stroke="#111f35" width={44} />
              <Tooltip content={<ChartTip />} />
              <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'inherit', paddingTop: 10, color: '#64748b' }} />
              <ReferenceLine x={0} stroke="#1e3a5f" strokeWidth={1.5} />
              <ReferenceLine y={0} stroke="#1e3a5f" strokeWidth={1.5} />
              <ReferenceLine x={-period.L} stroke="#1e293b" strokeDasharray="5 3" label={{ value: '−L', fill: '#334155', fontSize: 10 }} />
              <ReferenceLine x={period.L} stroke="#1e293b" strokeDasharray="5 3" label={{ value: 'L', fill: '#334155', fontSize: 10 }} />
              <Line type="monotone" dataKey="f(x)" stroke="#60a5fa" strokeWidth={2.5} dot={false} activeDot={{ r: 3 }} />
              <Line type="monotone" dataKey="Fourier" stroke="#f59e0b" strokeWidth={1.8} dot={false} activeDot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* ── LaTeX formula panel ── */}
        <div className="bg-[#060d1a] border border-[#1e3a5f] rounded-xl px-6 py-5 mb-5 overflow-auto">
          <p className="uppercase tracking-widest text-xs text-[#334155] mb-3">Fórmula de la serie calculada</p>

          {/* Preset definition */}
          {currentPreset && (
            <div style={{ marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid #0d1a2d' }}>
              <p style={sublbl}>Función del ejercicio {currentPreset.label}</p>
              <div style={{ marginTop: 8 }}>
                <KaTeX tex={currentPreset.latexDef} display />
              </div>
            </div>
          )}

          {/* Approximation */}
          <p style={sublbl}>Aproximación con N = {harmonics} armónico{harmonics !== 1 ? 's' : ''}</p>
          <div style={{ marginTop: 10, lineHeight: 2.2 }}>
            <KaTeX tex={latexFormula} display />
          </div>
        </div>

        {/* ── Coefficients table ── */}
        <div className="bg-[#0a1628] border border-[#111f35] rounded-xl p-4 mb-5">
          <div className="flex items-center gap-5 mb-3 flex-wrap">
            <p className="uppercase tracking-widest text-xs text-[#334155]">Coeficientes de Fourier</p>
            <KaTeX tex={`a_0 = ${n2s(coeffs.a0, 6)}`} />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {['n', 'aₙ', 'bₙ'].map((h) => (
                    <th key={h} style={{
                      padding: '6px 14px', textAlign: 'center',
                      color: '#334155', borderBottom: '1px solid #111f35', fontWeight: 600,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coeffs.an.map((_, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#080f1c' : 'transparent' }}>
                    <td style={{ padding: '5px 14px', textAlign: 'center', color: '#334155' }}>{i + 1}</td>
                    <td style={{ padding: '5px 14px', textAlign: 'center', color: '#34d399', fontFamily: 'inherit' }}>
                      {n2s(coeffs.an[i], 6)}
                    </td>
                    <td style={{ padding: '5px 14px', textAlign: 'center', color: '#a78bfa', fontFamily: 'inherit' }}>
                      {n2s(coeffs.bn[i], 6)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── General formula reference ── */}
        <div className="bg-[#0a1628] border border-[#111f35] rounded-xl p-4 opacity-75">
          <p className="uppercase tracking-widest text-xs text-[#334155] mb-3">Fórmula general</p>
          <div style={{ overflowX: 'auto', marginBottom: 18 }}>
            <KaTeX display tex={String.raw`f(x) \approx \frac{a_0}{2} + \sum_{n=1}^{N}\!\left[a_n\cos\!\left(\frac{n\pi x}{L}\right)+b_n\sin\!\left(\frac{n\pi x}{L}\right)\right]`} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
            {[
              String.raw`a_0 = \frac{1}{L}\int_{-L}^{L} f(x)\,dx`,
              String.raw`a_n = \frac{1}{L}\int_{-L}^{L} f(x)\cos\!\left(\tfrac{n\pi x}{L}\right)dx`,
              String.raw`b_n = \frac{1}{L}\int_{-L}^{L} f(x)\sin\!\left(\tfrac{n\pi x}{L}\right)dx`,
            ].map((tex, i) => (
              <div key={i} style={{ background: '#080f1c', borderRadius: 8, padding: '12px 14px', overflowX: 'auto' }}>
                <KaTeX tex={tex} display />
              </div>
            ))}
          </div>
        </div>

      </section>

      <Footer />

    </main>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: '#0a1628',
  border: '1px solid #111f35',
  borderRadius: 12,
  padding: '18px 22px',
};

const lbl: React.CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.15em',
  color: '#334155',
  margin: 0,
};

const sublbl: React.CSSProperties = {
  fontSize: 10,
  color: '#1e3a5f',
  marginBottom: 4,
};


function n2s(v: number, d = 5): string {
  if (Math.abs(v) < 1e-9) return '0';
  return parseFloat(v.toFixed(d)).toString();
}