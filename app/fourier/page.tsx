'use client';

import { useState, useMemo, useDeferredValue } from 'react';
import * as math from 'mathjs';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FourierChart from '@/components/FourierChart';
import CoefficientDisplay from '@/components/CoefficientDisplay';
import PiecewiseFunctionEditor, { PiecewisePart } from '@/components/PiecewiseFunctionEditor';
import PresetsDropdown, { FourierPreset } from '@/components/PresetsDropdown';
import MathInput from '@/components/MathInput';

interface FourierCoeffs { a0: number; an: number[]; bn: number[]; }

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

function periodicExt(f: (x: number) => number, L: number, x: number): number {
  const T = 2 * L;
  return f(((x + L) % T + T) % T - L);
}

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

export default function FourierPage() {
  const [mode, setMode] = useState<'simple' | 'piecewise' | 'preset'>('simple');
  
  const [expr, setExpr] = useState('sin(x)');
  const [latexExpr, setLatexExpr] = useState('\\sin(x)');
  
  const [pMinExpr, setPMinExpr] = useState('-pi');
  const [pMinLatex, setPMinLatex] = useState('-\\pi');
  
  const [pMaxExpr, setPMaxExpr] = useState('pi');
  const [pMaxLatex, setPMaxLatex] = useState('\\pi');

  const [parts, setParts] = useState<PiecewisePart[]>([
    { id: '1', condition: '-1 <= x < 0', expression: '-1', latexExpression: '-1' },
    { id: '2', condition: '0 <= x <= 1', expression: '1', latexExpression: '1' },
  ]);
  
  const [error, setError] = useState('');

  const [harmonics, setHarmonics] = useState(5);
  const deferredHarmonics = useDeferredValue(harmonics);

  const evaluatedLimits = useMemo(() => {
    try {
      const min = math.evaluate(pMinExpr.replace(/\\pi/g, 'pi'));
      const max = math.evaluate(pMaxExpr.replace(/\\pi/g, 'pi'));
      return { min, max };
    } catch {
      return { min: -Math.PI, max: Math.PI };
    }
  }, [pMinExpr, pMaxExpr]);

  const period = useMemo(() => {
    if (mode === 'piecewise') {
      const r = rangeFromParts(parts);
      const T = r.max - r.min;
      return { min: r.min, max: r.max, T, L: T / 2 };
    }
    const T = evaluatedLimits.max - evaluatedLimits.min;
    return { min: evaluatedLimits.min, max: evaluatedLimits.max, T, L: T / 2 };
  }, [mode, evaluatedLimits, parts]);

  const evaluator = useMemo<((x: number) => number) | null>(() => {
    setError('');
    if (mode === 'simple' || mode === 'preset') {
      try {
        const c = math.compile(expr);
        return (x) => { try { const v = c.evaluate({ x }); return typeof v === 'number' ? v : 0; } catch { return 0; } };
      } catch (e) {
        setError(`Función inválida`);
        return null;
      }
    }
    try { return makePiecewise(parts); }
    catch (e) { setError(`Error en función a trozos`); return null; }
  }, [mode, expr, parts]);

  const coeffs = useMemo<FourierCoeffs>(() => {
    if (!evaluator) return { a0: 0, an: [], bn: [] };
    return calcCoeffs(evaluator, period.T, deferredHarmonics);
  }, [evaluator, period.T, deferredHarmonics]);

  const chartData = useMemo(() => {
    if (!evaluator) return [];
    const { T, L } = period;
    const N = 850;
    
    return Array.from({ length: N + 1 }, (_, i) => {
      const x = parseFloat((-T + (2 * T * i) / N).toFixed(5));
      let fv = coeffs.a0 / 2;
      for (let n = 1; n <= coeffs.an.length; n++) {
        fv += coeffs.an[n - 1] * Math.cos((n * Math.PI * x) / L);
        fv += coeffs.bn[n - 1] * Math.sin((n * Math.PI * x) / L);
      }
      return {
        x,
        'f(x)': parseFloat(periodicExt(evaluator, L, x).toFixed(5)),
        'Fourier': parseFloat(fv.toFixed(5)),
      };
    });
  }, [evaluator, coeffs, period]);

  const handlePresetSelect = (p: FourierPreset) => {
    if (p.mode === 'piecewise' && p.parts) {
      setMode('piecewise');
      setParts(p.parts.map(pt => ({ ...pt, latexExpression: pt.expression })));
    } else {
      setMode('simple');
      setExpr(p.expression!);
      setLatexExpr(p.expression!);
      setPMinExpr(p.pMin?.toString() || '-1');
      setPMinLatex(p.pMin?.toString() || '-1');
      setPMaxExpr(p.pMax?.toString() || '1');
      setPMaxLatex(p.pMax?.toString() || '1');
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-[#0f172a]">
      <Header />
      <section className="flex-1 max-w-5xl mx-auto px-4 py-20 w-full space-y-8">
        
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 text-transparent bg-clip-text">
            Calculadora de Serie de Fourier
          </h1>
          <p className="text-slate-400 font-medium tracking-tight">Análisis Numérico · UTN FRLP</p>
        </div>

        <div className="bg-slate-800/50 rounded-2xl p-6 md:p-8 border border-slate-700 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-700/50 pb-5">
            <h2 className="text-2xl font-bold text-white tracking-wide">Definición de la Función</h2>
            
            <div className="flex bg-slate-900 p-1.5 rounded-xl border border-slate-700 shadow-inner">
              <button onClick={() => setMode('simple')} className={`px-5 py-2 text-xs font-black rounded-lg transition-all ${mode === 'simple' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>SIMPLE</button>
              <button onClick={() => setMode('piecewise')} className={`px-5 py-2 text-xs font-black rounded-lg transition-all ${mode === 'piecewise' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>A TROZOS</button>
              <button onClick={() => setMode('preset')} className={`px-5 py-2 text-xs font-black rounded-lg transition-all ${mode === 'preset' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>PRECARGADA</button>
            </div>
          </div>

          <div className="animate-in fade-in duration-300">
            {mode === 'simple' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-blue-300 uppercase mb-2 block tracking-widest">Expresión f(x)</label>
                  <MathInput latexValue={latexExpr} onMathChange={(l, a) => { setLatexExpr(l); setExpr(a); }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-blue-300 uppercase mb-2 block tracking-widest">x mín</label>
                    <MathInput latexValue={pMinLatex} onMathChange={(l, a) => { setPMinLatex(l); setPMinExpr(a); }} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-blue-300 uppercase mb-2 block tracking-widest">x máx</label>
                    <MathInput latexValue={pMaxLatex} onMathChange={(l, a) => { setPMaxLatex(l); setPMaxExpr(a); }} />
                  </div>
                </div>
              </div>
            )}

            {mode === 'piecewise' && <PiecewiseFunctionEditor parts={parts} onPartsChange={setParts} />}

            {mode === 'preset' && (
              <div className="py-2">
                <PresetsDropdown onSelectPreset={handlePresetSelect} />
              </div>
            )}
            
            {error && <p className="text-red-400 text-xs mt-4 font-bold bg-red-400/10 p-3 rounded-lg border border-red-400/20">{error}</p>}
          </div>
        </div>

        {/* 2. GRÁFICO Y CONTROLES (El componente maneja su propia cabecera) */}
        <FourierChart 
          data={chartData} 
          periodL={period.L} 
          periodT={period.T} 
          harmonics={harmonics}
          onHarmonicsChange={setHarmonics}
        />

        {/* 3. TABLA DE COEFICIENTES Y FÓRMULAS */}
        <CoefficientDisplay 
          a0={coeffs.a0} 
          an={coeffs.an} 
          bn={coeffs.bn} 
          harmonics={deferredHarmonics} 
        />

      </section>
      <Footer />
    </main>
  );
}