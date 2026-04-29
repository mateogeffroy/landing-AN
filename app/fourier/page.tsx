'use client';

import { useState, useMemo, useDeferredValue } from 'react';
import * as math from 'mathjs';
import Header from '@/src/components/Header';
import Footer from '@/src/components/Footer';
import GraficoFourier from '@/src/components/GraficoFourier';
import VisualizadorCoeficientes from '@/src/components/VisualizadorCoeficientes';
import EditorFuncionTrozos, { TramoFuncion } from '@/src/components/EditorFuncionTrozos';
import MenuDesplegableEjercicios, { EjercicioPredefinido } from '@/src/components/MenuDesplegableEjercicios';
import EntradaMatematica from '@/src/components/EntradaMatematica';
import KaTeX from '@/src/components/KaTeX';

//Definicion de la estructura de los coeficientes de Fourier
interface CoeficientesFourier { 
  a0: number; 
  an: number[]; 
  bn: number[]; 
}

//Implementacion de la regla del trapecio para la aproximacion numerica de integrales definidas.
function integrarTrapecio(funcion: (x: number) => number, limiteInferior: number, limiteSuperior: number, particiones = 2000): number {
  const anchoPaso = (limiteSuperior - limiteInferior) / particiones;
  let sumaAreas = 0.5 * (funcion(limiteInferior) + funcion(limiteSuperior));
  for (let i = 1; i < particiones; i++) {
    sumaAreas += funcion(limiteInferior + i * anchoPaso);
  }
  return sumaAreas * anchoPaso;
}

//Calculo de coeficientes aplicando tolerancia a errores de punto flotante
//y forzando resultados teoricos segun la paridad detectada de la funcion.
function calcularCoeficientes(
  funcion: (x: number) => number, 
  periodoT: number, 
  cantidadArmonicos: number,
  paridad: 'par' | 'impar' | 'ninguna'
): CoeficientesFourier {
  const L = periodoT / 2;
  const omega = (2 * Math.PI) / periodoT;
  const limiteInf = -L;
  const limiteSup = L;
  
  //Umbral de tolerancia para considerar un valor numerico como cero absoluto (limpieza de ruido).
  const EPSILON = 1e-3;

  let a0 = (1 / L) * integrarTrapecio(funcion, limiteInf, limiteSup);
  
  //Forzado teorico: en funciones impares, a0=0.
  if (paridad === 'impar' || Math.abs(a0) < EPSILON) a0 = 0;
  
  const listaAn: number[] = [];
  const listaBn: number[] = [];

  for (let n = 1; n <= cantidadArmonicos; n++) {
    let an_calc = (1 / L) * integrarTrapecio((t) => funcion(t) * Math.cos(n * omega * t), limiteInf, limiteSup);
    let bn_calc = (1 / L) * integrarTrapecio((t) => funcion(t) * Math.sin(n * omega * t), limiteInf, limiteSup);

    //Aplicacion de simetrias: an=0 para funciones impares, bn=0 para funciones pares.
    if (paridad === 'impar') an_calc = 0;
    if (paridad === 'par') bn_calc = 0;

    //Limpieza de residuos numericos resultantes por el calculo de integrales por el metodo del trapecio.
    if (Math.abs(an_calc) < EPSILON) an_calc = 0;
    if (Math.abs(bn_calc) < EPSILON) bn_calc = 0;

    listaAn.push(an_calc);
    listaBn.push(bn_calc);
  }
  
  return { a0, an: listaAn, bn: listaBn };
}

//Genera la extension periodica de la funcion base para su correcta visualizacion en el grafico.
function extensionPeriodica(funcion: (x: number) => number, L: number, x: number): number {
  const periodoT = 2 * L;
  return funcion(((x + L) % periodoT + periodoT) % periodoT - L);
}

//Validador de intervalos para funciones a trozos mediante expresiones regulares.
function verificarCondicion(condicion: string, x: number): boolean {
  const coincidencia = condicion.replace(/\s+/g, '').match(/^(-?[\d.]+)(<=|<)(x)(<=|<)(-?[\d.]+)$/);
  if (!coincidencia) return false;
  const limiteInf = parseFloat(coincidencia[1]);
  const opInf = coincidencia[2];
  const opSup = coincidencia[4];
  const limiteSup = parseFloat(coincidencia[5]);
  return (opInf === '<=' ? x >= limiteInf : x > limiteInf) && (opSup === '<=' ? x <= limiteSup : x < limiteSup);
}

//Compilador de logica para funciones definidas por partes.
function crearFuncionTrozos(tramos: TramoFuncion[]): (x: number) => number {
  const compilados = tramos.map((t) => ({ condicion: t.condicion, fn: math.compile(t.expresion) }));
  return (x) => {
    for (const tramo of compilados) {
      if (verificarCondicion(tramo.condicion, x)) {
        try { const valor = tramo.fn.evaluate({ x }); return typeof valor === 'number' ? valor : 0; }
        catch { return 0; }
      }
    }
    return 0;
  };
}

//Analisis dinamico del dominio total basado en los tramos ingresados.
function rangoDesdeTramos(tramos: TramoFuncion[]): { min: number; max: number } {
  let minVal = Infinity, maxVal = -Infinity;
  for (const t of tramos) {
    const m = t.condicion.replace(/\s+/g, '').match(/^(-?[\d.]+)(<=|<)(x)(<=|<)(-?[\d.]+)$/);
    if (m) { const l = parseFloat(m[1]), h = parseFloat(m[5]); if (l < minVal) minVal = l; if (h > maxVal) maxVal = h; }
  }
  return { min: isFinite(minVal) ? minVal : -1, max: isFinite(maxVal) ? maxVal : 1 };
}

export default function PaginaFourier() {
  const [modoIngreso, setModoIngreso] = useState<'simple' | 'piecewise' | 'preset'>('simple');
  const [expresion, setExpresion] = useState('sin(x)');
  const [latexExpresion, setLatexExpresion] = useState('\\sin(x)');
  const [minimoExpr, setMinimoExpr] = useState('-pi');
  const [minimoLatex, setMinimoLatex] = useState('-\\pi');
  const [maximoExpr, setMaximoExpr] = useState('pi');
  const [maximoLatex, setMaximoLatex] = useState('\\pi');
  const [tramos, setTramos] = useState<TramoFuncion[]>([
    { id: '1', condicion: '-1 <= x < 0', expresion: '-1', expresionLatex: '-1' },
    { id: '2', condicion: '0 <= x <= 1', expresion: '1', expresionLatex: '1' },
  ]);
  const [errorMatematico, setErrorMatematico] = useState('');
  const [armonicos, setArmonicos] = useState(5);
  const armonicosDiferidos = useDeferredValue(armonicos);

  const limitesEvaluados = useMemo(() => {
    try {
      const min = math.evaluate(minimoExpr.replace(/\\pi/g, 'pi'));
      const max = math.evaluate(maximoExpr.replace(/\\pi/g, 'pi'));
      return { min, max };
    } catch {
      return { min: -Math.PI, max: Math.PI };
    }
  }, [minimoExpr, maximoExpr]);

  const periodoCalculado = useMemo(() => {
    if (modoIngreso === 'piecewise') {
      const rango = rangoDesdeTramos(tramos);
      const T = rango.max - rango.min;
      return { min: rango.min, max: rango.max, T, L: T / 2 };
    }
    const T = limitesEvaluados.max - limitesEvaluados.min;
    return { min: limitesEvaluados.min, max: limitesEvaluados.max, T, L: T / 2 };
  }, [modoIngreso, limitesEvaluados, tramos]);

  const evaluador = useMemo<((x: number) => number) | null>(() => {
    setErrorMatematico('');
    if (modoIngreso === 'simple' || modoIngreso === 'preset') {
      try {
        const c = math.compile(expresion);
        return (x) => { try { const v = c.evaluate({ x }); return typeof v === 'number' ? v : 0; } catch { return 0; } };
      } catch {
        setErrorMatematico('Función inválida');
        return null;
      }
    }
    try { return crearFuncionTrozos(tramos); }
    catch { setErrorMatematico('Error en tramos'); return null; }
  }, [modoIngreso, expresion, tramos]);

  //Analisis de Paridad mediante evaluacion de puntos de prueba en el dominio.
  const paridadFuncion = useMemo<'par' | 'impar' | 'ninguna'>(() => {
    if (!evaluador) return 'ninguna';
    const { L } = periodoCalculado;
    let esPar = true;
    let esImpar = true;
    const toleranciaError = 1e-5;
    const puntosPrueba = [L * 0.12, L * 0.34, L * 0.56, L * 0.78, L * 0.91];

    for (const x of puntosPrueba) {
      const valorPositivo = evaluador(x);
      const valorNegativo = evaluador(-x);
      if (Math.abs(valorPositivo - valorNegativo) > toleranciaError) esPar = false;
      if (Math.abs(valorNegativo + valorPositivo) > toleranciaError) esImpar = false;
    }
    if (esPar) return 'par';
    if (esImpar) return 'impar';
    return 'ninguna';
  }, [evaluador, periodoCalculado.L]);

  const coeficientesObtenidos = useMemo<CoeficientesFourier>(() => {
    if (!evaluador) return { a0: 0, an: [], bn: [] };
    return calcularCoeficientes(evaluador, periodoCalculado.T, armonicosDiferidos, paridadFuncion);
  }, [evaluador, periodoCalculado.T, armonicosDiferidos, paridadFuncion]);

  const datosParaGrafico = useMemo(() => {
    if (!evaluador) return [];
    const { T, L } = periodoCalculado;
    const omega = (2 * Math.PI) / T;
    const resolucion = 850;
    
    return Array.from({ length: resolucion + 1 }, (_, i) => {
      const t = parseFloat((-T + (2 * T * i) / resolucion).toFixed(5));
      let valorSerie = coeficientesObtenidos.a0 / 2;
      for (let n = 1; n <= coeficientesObtenidos.an.length; n++) {
        valorSerie += coeficientesObtenidos.an[n - 1] * Math.cos(n * omega * t);
        valorSerie += coeficientesObtenidos.bn[n - 1] * Math.sin(n * omega * t);
      }
      return {
        x: t,
        'f(x)': parseFloat(extensionPeriodica(evaluador, L, t).toFixed(5)),
        'Fourier': parseFloat(valorSerie.toFixed(5)),
      };
    });
  }, [evaluador, coeficientesObtenidos, periodoCalculado]);

  //Generacion de la sumatoria matematica analitica con un limite visual de 5 terminos significativos.
  const sumatoriaFinalTex = useMemo(() => {
    if (!coeficientesObtenidos) return '';
    const { a0, an, bn } = coeficientesObtenidos;
    const limiteTerminos = 5;
    let terminosEncontrados = 0;
    const umbralCero = 1e-4;

    let latex = 'f(t) \\approx ';

    if (Math.abs(a0) > umbralCero) {
      latex += `${parseFloat((a0 / 2).toFixed(4))}`;
      terminosEncontrados++;
    }

    for (let n = 1; n <= an.length && terminosEncontrados < limiteTerminos; n++) {
      const valAn = an[n - 1];
      const valBn = bn[n - 1];
      const arg = n === 1 ? '\\omega t' : `${n}\\omega t`;

      if (Math.abs(valAn) > umbralCero) {
        const signo = valAn > 0 ? (terminosEncontrados > 0 ? '+' : '') : '';
        latex += ` ${signo}${parseFloat(valAn.toFixed(4))} \\cdot \\cos(${arg})`;
        terminosEncontrados++;
      }

      if (terminosEncontrados < limiteTerminos && Math.abs(valBn) > umbralCero) {
        const signo = valBn > 0 ? (terminosEncontrados > 0 ? '+' : '') : '';
        latex += ` ${signo}${parseFloat(valBn.toFixed(4))} \\cdot \\sin(${arg})`;
        terminosEncontrados++;
      }
    }

    const totalTerminosReales = (an.filter(v => Math.abs(v) > umbralCero).length + 
                                bn.filter(v => Math.abs(v) > umbralCero).length + 
                                (Math.abs(a0) > umbralCero ? 1 : 0));

    if (totalTerminosReales > limiteTerminos) latex += ' + \\dots';
    if (terminosEncontrados === 0) latex += '0';

    return latex;
  }, [coeficientesObtenidos]);

  const seleccionarPredefinida = (ejercicio: EjercicioPredefinido) => {
    setModoIngreso(ejercicio.modo);
    if (ejercicio.modo === 'piecewise' && ejercicio.tramos) {
      setTramos(ejercicio.tramos.map(tramo => ({ ...tramo, expresionLatex: tramo.expresion })));
    } else if (ejercicio.modo === 'simple' && ejercicio.expresion) {
      setExpresion(ejercicio.expresion);
      setLatexExpresion(ejercicio.expresion);
      setMinimoExpr(ejercicio.minimo?.toString() || '-1');
      setMinimoLatex(ejercicio.minimo?.toString() || '-1');
      setMaximoExpr(ejercicio.maximo?.toString() || '1');
      setMaximoLatex(ejercicio.maximo?.toString() || '1');
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-[#0f172a]">
      <Header />
      <section className="flex-1 max-w-5xl mx-auto px-4 py-24 w-full space-y-8">
        
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-[3.5rem] font-extrabold mb-4 bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 text-transparent bg-clip-text leading-tight">
            Calculadora de Serie de Fourier
          </h1>
          <p className="text-slate-400 font-medium tracking-tight">Análisis Numérico · UTN FRLP</p>
        </div>

        <div className="bg-slate-800/50 rounded-2xl p-6 md:p-8 border border-slate-700 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-700/50 pb-5">
            <h2 className="text-2xl font-bold text-white tracking-wide">Definición de la Función</h2>
            <div className="flex bg-slate-900 p-1.5 rounded-xl border border-slate-700 shadow-inner">
              <button onClick={() => setModoIngreso('simple')} className={`px-5 py-2 text-xs font-black rounded-lg transition-all ${modoIngreso === 'simple' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>SIMPLE</button>
              <button onClick={() => setModoIngreso('piecewise')} className={`px-5 py-2 text-xs font-black rounded-lg transition-all ${modoIngreso === 'piecewise' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>A TROZOS</button>
              <button onClick={() => setModoIngreso('preset')} className={`px-5 py-2 text-xs font-black rounded-lg transition-all ${modoIngreso === 'preset' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>PRECARGADA</button>
            </div>
          </div>

          <div className="animate-in fade-in duration-300">
            {modoIngreso === 'simple' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-blue-300 uppercase mb-2 block tracking-widest">Expresión f(x)</label>
                  <EntradaMatematica valorLatex={latexExpresion} alCambiarMatematica={(l, a) => { setLatexExpresion(l); setExpresion(a); }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-blue-300 uppercase mb-2 block tracking-widest">x mín</label>
                    <EntradaMatematica valorLatex={minimoLatex} alCambiarMatematica={(l, a) => { setMinimoLatex(l); setMinimoExpr(a); }} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-blue-300 uppercase mb-2 block tracking-widest">x máx</label>
                    <EntradaMatematica valorLatex={maximoLatex} alCambiarMatematica={(l, a) => { setMaximoLatex(l); setMaximoExpr(a); }} />
                  </div>
                </div>
              </div>
            )}
            {modoIngreso === 'piecewise' && <EditorFuncionTrozos tramos={tramos} alCambiarTramos={setTramos} />}
            {modoIngreso === 'preset' && <MenuDesplegableEjercicios alSeleccionarEjercicio={seleccionarPredefinida} />}
            {errorMatematico && <p className="text-red-400 text-xs mt-4 font-bold bg-red-400/10 p-3 rounded-lg border border-red-400/20">{errorMatematico}</p>}
          </div>
        </div>


        <GraficoFourier 
          datos={datosParaGrafico} 
          periodoL={periodoCalculado.L} 
          periodoT={periodoCalculado.T} 
          armonicos={armonicos}
          paridad={paridadFuncion} 
          alCambiarArmonicos={setArmonicos}
        />

        <VisualizadorCoeficientes 
          a0={coeficientesObtenidos.a0} 
          an={coeficientesObtenidos.an} 
          bn={coeficientesObtenidos.bn} 
          armonicos={armonicosDiferidos} 
        />

        <div className="bg-slate-800/30 rounded-2xl p-8 border border-slate-700 shadow-xl space-y-4">
          <h2 className="text-xl font-bold text-white border-l-4 border-indigo-500 pl-4">Aproximación de la Serie</h2>
          <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4">Expresión analítica resultante (Máx. 5 términos)</p>
          <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-700/50 overflow-x-auto text-center shadow-inner">
             <KaTeX expresionTex={sumatoriaFinalTex} enBloque={true} />
          </div>
          <div className="pt-4 mt-4 border-t border-slate-700/50 flex flex-col items-center">
             <p className="text-[10px] text-slate-500 uppercase font-bold mb-2 tracking-widest">Definición General</p>
             <KaTeX expresionTex={String.raw`f(t)=\frac{1}{2}\cdot a_0+\sum_{n=1}^{N}[a_n\cdot \cos(n\omega t)+b_n\cdot \sin(n\omega t)]`} />
          </div>
        </div>


      </section>
      <Footer />
    </main>
  );
}