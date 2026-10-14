'use client';

import { useMemo, useState } from 'react';
import Header from '@/src/components/Header';
import Footer from '@/src/components/Footer';
import KaTeX from '@/src/components/KaTeX';
import RevelarAlEntrar from '@/src/components/RevelarAlEntrar';
import GlifoMatriz from '@/src/components/GlifoMatriz';
import { GraficoLineas } from '@/src/components/GraficosAjuste';
import { desplazarHaciaAncla } from '@/src/lib/lenis';
import { formatearNumero } from '@/src/lib/minimosCuadrados';
import { PROBLEMAS, resolver, valorFinal, type ClaveMetodo, type Iteracion, type Problema } from '@/src/lib/edo';

const PATRON_PROBLEMA = [
  [true, false, false],
  [false, true, false],
  [false, false, true],
];
const PATRON_METODOS = [
  [true, true, true],
  [false, false, false],
  [true, true, true],
];
const PATRON_ITERACIONES = [
  [true, false, false],
  [true, true, false],
  [true, true, true],
];
const PATRON_COMPARATIVA = [
  [true, false, true],
  [true, false, true],
  [true, false, true],
];
const PATRON_CONCLUSION = [
  [true, true, true],
  [true, true, true],
  [true, true, true],
];

const navegacion = [
  { href: '#problema', label: '1. El problema', patron: PATRON_PROBLEMA },
  { href: '#metodos', label: '2. Los métodos', patron: PATRON_METODOS },
  { href: '#iteraciones', label: '3. Iteraciones', patron: PATRON_ITERACIONES },
  { href: '#comparativa', label: '4. Comparativa', patron: PATRON_COMPARATIVA },
  { href: '#conclusion', label: '5. Conclusión', patron: PATRON_CONCLUSION },
];

const METODOS: {
  clave: ClaveMetodo;
  nombre: string;
  color: string;
  borde: string;
  formulaTex: string;
  idea: string;
  evaluaciones: string;
}[] = [
  {
    clave: 'taylor',
    nombre: 'Taylor de grado 2',
    color: '#3b82f6',
    borde: 'border-blue-500',
    formulaTex: String.raw`y_{n+1} = y_n + h \, y_n' + \frac{h^2}{2!} \, y_n'' \qquad y_n'' = \frac{\partial f}{\partial x} + \frac{\partial f}{\partial y} \cdot y_n'`,
    idea:
      'Trunca el desarrollo en serie de Taylor de la solución en el término de segundo orden: avanza sobre la parábola que comparte valor, pendiente y curvatura con la solución en xₙ. Necesita derivar f de forma analítica antes de iterar.',
    evaluaciones: '1 de f + 1 de y″ (derivada analítica)',
  },
  {
    clave: 'eulerMejorado',
    nombre: 'Euler Mejorado',
    color: '#10b981',
    borde: 'border-emerald-500',
    formulaTex: String.raw`y_{n+1} = y_n + \frac{h}{2!} \left[ y_n' + f\!\left(x_{n+1}, \; y_n + h \, y_n'\right) \right]`,
    idea:
      'Predictor–corrector: primero predice yₙ₊₁ con un paso de Euler y luego corrige promediando la pendiente del inicio y la del final del intervalo (equivale a integrar f por trapecios).',
    evaluaciones: '2 de f',
  },
  {
    clave: 'rk2',
    nombre: 'Runge-Kutta de grado 2',
    color: '#f59e0b',
    borde: 'border-amber-500',
    formulaTex: String.raw`y_{n+1} = y_n + h \, f\!\left(x_n + \frac{h}{2}, \; y_n + \frac{k_1}{2}\right) \qquad k_1 = h \, y_n'`,
    idea:
      'Usa la pendiente en el punto medio del intervalo: con k₁ estima dónde estaría la solución en xₙ + h/2 y avanza todo el paso con la pendiente de ese punto (equivale a integrar f por punto medio).',
    evaluaciones: '2 de f',
  },
];

const PASOS_CONVERGENCIA = [0.1, 0.05, 0.025];

const t = (valor: number, decimales = 6) => formatearNumero(valor, decimales);

// Sustitución numérica de una iteración, con la misma forma que el apunte.
function sustitucionTex(metodo: ClaveMetodo, it: Iteracion, h: number): string[] {
  const n = it.n;
  const [a, b, c] = it.intermedios.map((i) => t(i.valor));
  if (metodo === 'taylor') {
    return [
      `y_${n}' = f(${t(it.x, 4)}, \\, ${t(it.y)}) = ${a} \\qquad y_${n}'' = ${b}`,
      `y_{${n + 1}} = ${t(it.y)} + ${h} \\cdot ${a} + \\frac{(${h})^2}{2} \\cdot ${b} = ${t(it.siguiente)}`,
    ];
  }
  if (metodo === 'eulerMejorado') {
    return [
      `y_${n}' = ${a} \\qquad y_${n} + h \\, y_${n}' = ${b} \\qquad f(${t(it.x + h, 4)}, \\, ${b}) = ${c}`,
      `y_{${n + 1}} = ${t(it.y)} + \\frac{${h}}{2} \\left[ ${a} + ${c} \\right] = ${t(it.siguiente)}`,
    ];
  }
  return [
    `k_1 = ${h} \\cdot f(${t(it.x, 4)}, \\, ${t(it.y)}) = ${a}`,
    `y_{${n + 1}} = ${t(it.y)} + ${h} \\cdot f(${t(it.x + h / 2, 4)}, \\, ${t(it.y + it.intermedios[0].valor / 2)}) = ${t(it.y)} + ${h} \\cdot ${b} = ${t(it.siguiente)}`,
  ];
}

const errorFinal = (m: ClaveMetodo, p: Problema, h = p.h) => Math.abs(valorFinal(m, p, h) - p.exacta(p.xf));

export default function PaginaEDO() {
  const [claveProblema, setClaveProblema] = useState(PROBLEMAS[0].clave);
  const [metodoVisible, setMetodoVisible] = useState<ClaveMetodo>('taylor');

  const problema = PROBLEMAS.find((p) => p.clave === claveProblema) ?? PROBLEMAS[0];
  const metodo = METODOS.find((m) => m.clave === metodoVisible) ?? METODOS[0];

  const iteraciones = useMemo(() => {
    const mapa = {} as Record<ClaveMetodo, Iteracion[]>;
    METODOS.forEach((m) => (mapa[m.clave] = resolver(m.clave, problema)));
    return mapa;
  }, [problema]);

  // Una fila por nodo x_n: aproximación de cada método y la solución exacta.
  const filas = useMemo(() => {
    const nodos = [{ x: problema.x0 }, ...iteraciones.taylor.map((it) => ({ x: it.x + problema.h }))];
    return nodos.map(({ x }, i) => {
      const fila: Record<string, number> = { x, exacta: problema.exacta(x) };
      METODOS.forEach((m) => {
        fila[m.clave] = i === 0 ? problema.y0 : iteraciones[m.clave][i - 1].siguiente;
        fila[`error_${m.clave}`] = Math.abs(fila[m.clave] - fila.exacta);
      });
      return fila;
    });
  }, [iteraciones, problema]);

  // La exacta se dibuja sobre una grilla fina para que se vea la curva real.
  const datosCurvas = useMemo(() => {
    const puntos = 50;
    const fina = Array.from({ length: puntos + 1 }, (_, i) => {
      const x = problema.x0 + ((problema.xf - problema.x0) * i) / puntos;
      return { x, exacta: problema.exacta(x) } as Record<string, number>;
    });
    return [...fina, ...filas.map((f) => ({ x: f.x, taylor: f.taylor, eulerMejorado: f.eulerMejorado, rk2: f.rk2 }))].sort((a, b) => a.x - b.x);
  }, [filas, problema]);

  const datosError = filas.map((f) => ({ x: f.x, taylor: f.error_taylor, eulerMejorado: f.error_eulerMejorado, rk2: f.error_rk2 }));

  const ranking = [...METODOS].sort((a, b) => errorFinal(a.clave, problema) - errorFinal(b.clave, problema));

  const resumen = PROBLEMAS.map((p) => {
    const errores = METODOS.map((m) => errorFinal(m.clave, p));
    return { p, errores, mejor: errores.indexOf(Math.min(...errores)) };
  });

  return (
    <main className="min-h-screen flex flex-col fondo-cuadriculado">
      <Header />

      <section className="flex-1 max-w-6xl mx-auto px-4 py-24 w-full space-y-8">

        {/* ENCABEZADO */}
        <div className="text-center mb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-500 mb-3">
            Tercera exposición · Tema 5 · Grupo 7 · Lunes 19/10/2026
          </p>
          <h1 className="text-4xl md:text-[3.5rem] font-extrabold mb-4 bg-gradient-to-r from-blue-600 via-emerald-600 to-amber-600 dark:from-blue-400 dark:via-emerald-400 dark:to-amber-400 text-transparent bg-clip-text leading-tight">
            Taylor, Euler Mejorado y RK2
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">
            Comparativa de métodos de paso simple para problemas de valor inicial
          </p>
        </div>

        {/* CUERPO: guía lateral + contenido */}
        <div className="grid grid-cols-1 lg:grid-cols-[9rem_1fr] gap-4 lg:gap-10">

          {/* GUÍA LATERAL (sólo desktop) */}
          <nav className="hidden lg:flex flex-col gap-8 sticky top-32 self-start h-fit pr-2 border-r border-slate-200 dark:border-slate-800">
            {navegacion.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(evento) => desplazarHaciaAncla(evento, item.href)}
                className="group flex items-center gap-3 text-slate-600 dark:text-slate-500 hover:text-blue-600 dark:hover:text-slate-200 transition-colors"
              >
                <GlifoMatriz celdas={item.patron} className="text-slate-400 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest leading-tight">{item.label}</span>
              </a>
            ))}
          </nav>

          <div className="space-y-8 min-w-0">

            {/* SECCIÓN 1: EL PROBLEMA */}
            <RevelarAlEntrar>
              <div id="problema" className="scroll-mt-28 bg-white dark:bg-slate-800/50 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 shadow-xl space-y-6">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-wide border-l-4 border-blue-500 pl-4">
                  1. El problema de valor inicial
                </h2>

                <p className="text-slate-800 dark:text-slate-300 leading-relaxed">
                  Un problema de valor inicial (P.V.I.) queda definido por cuatro elementos: una ecuación diferencial
                  <KaTeX expresionTex="\; y' = f(x, y)" />, una condición inicial <KaTeX expresionTex="y(x_0) = y_0" />, un dominio
                  de trabajo <KaTeX expresionTex="x_0 \le x \le x_f" /> y un paso <KaTeX expresionTex="h" /> con el que se recorre ese
                  dominio, <KaTeX expresionTex="x_{n+1} = x_n + h" />. Los métodos numéricos construyen una sucesión
                  <KaTeX expresionTex="\; y_1, y_2, \ldots, y_n" /> que aproxima los valores exactos
                  <KaTeX expresionTex="\; y(x_1), y(x_2), \ldots, y(x_n)" /> a partir de una <strong>ordenada genérica</strong>
                  <KaTeX expresionTex="\; y_{n+1}" />.
                </p>

                <p className="text-slate-800 dark:text-slate-300 leading-relaxed">
                  Para que la comparación sea justa, los tres métodos se aplican sobre <strong>el mismo problema</strong>. Elegimos
                  ecuaciones que la práctica propone resolver con más de uno de estos métodos y que, además, tienen solución
                  analítica: así cada aproximación se puede contrastar con el valor exacto y medir su error.
                </p>

                <div className="flex flex-wrap gap-2">
                  {PROBLEMAS.map((p) => (
                    <button
                      key={p.clave}
                      onClick={() => setClaveProblema(p.clave)}
                      className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                        p.clave === problema.clave
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                      }`}
                    >
                      <KaTeX expresionTex={p.ecuacionTex} />
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-400 mb-3">Enunciado</p>
                    <div className="desplazamiento-formula space-y-2 text-slate-800 dark:text-slate-300">
                      <div><KaTeX expresionTex={problema.ecuacionTex} /></div>
                      <div><KaTeX expresionTex={problema.condicionTex} /></div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                      {Math.round((problema.xf - problema.x0) / problema.h)} iteraciones · Práctica: {problema.origen}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-3">
                      Solución exacta (variables separables)
                    </p>
                    <div className="desplazamiento-formula space-y-2 text-slate-800 dark:text-slate-300">
                      {problema.resolucionExactaTex.map((linea) => (
                        <div key={linea}><KaTeX expresionTex={linea} /></div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                      Valor de referencia: <KaTeX expresionTex={`y(${problema.xf}) = ${t(problema.exacta(problema.xf))}`} />
                    </p>
                  </div>
                </div>
              </div>
            </RevelarAlEntrar>

            {/* SECCIÓN 2: LOS MÉTODOS */}
            <RevelarAlEntrar>
              <div id="metodos" className="scroll-mt-28 bg-white dark:bg-slate-800/50 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 shadow-xl space-y-6">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-wide border-l-4 border-indigo-500 pl-4">
                  2. Los tres métodos
                </h2>

                <p className="text-slate-800 dark:text-slate-300 leading-relaxed">
                  Los tres son algoritmos de <strong>paso simple</strong>: para calcular <KaTeX expresionTex="y_{n+1}" /> sólo usan
                  información del intervalo <KaTeX expresionTex="[x_n, x_{n+1}]" />, por eso arrancan directamente desde la condición
                  inicial. Los tres buscan lo mismo —mejorar a Euler, que sólo usa la pendiente al inicio del intervalo— pero lo
                  logran por caminos distintos.
                </p>

                <div className="space-y-4">
                  {METODOS.map((m) => (
                    <div key={m.clave} className={`bg-slate-100 dark:bg-slate-800/60 border-l-4 ${m.borde} rounded-r-xl p-6`}>
                      <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: m.color }}>{m.nombre}</p>
                      <div className="bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-inner p-4 desplazamiento-formula text-center mb-4">
                        <KaTeX expresionTex={m.formulaTex} enBloque={true} />
                      </div>
                      <p className="text-slate-800 dark:text-slate-300 leading-relaxed text-sm">{m.idea}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5 md:p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500 mb-3">
                    Lo que tienen en común: el orden
                  </p>
                  <p className="text-slate-800 dark:text-slate-300 leading-relaxed text-sm mb-3">
                    Si se desarrollan en serie de potencias de <KaTeX expresionTex="h" />, Euler Mejorado y RK2 coinciden con el
                    desarrollo de Taylor hasta el término <KaTeX expresionTex="h^2" />: los tres son <strong>métodos de orden 2</strong>.
                    El error que se comete en cada paso (error local) es <KaTeX expresionTex="O(h^3)" /> y, al acumularse a lo largo de
                    las <KaTeX expresionTex="(x_f - x_0)/h" /> iteraciones, el error global en <KaTeX expresionTex="x_f" /> es
                    <KaTeX expresionTex="\; O(h^2)" />. La diferencia está en el término <KaTeX expresionTex="h^3" />, que cada método
                    aproxima distinto: por eso, con el mismo paso, dan resultados parecidos pero no iguales.
                  </p>
                  <p className="text-slate-800 dark:text-slate-300 leading-relaxed text-sm">
                    Euler Mejorado y RK2 en realidad son dos integrantes de la misma familia de Runge-Kutta de dos etapas: ambos
                    evalúan <KaTeX expresionTex="f" /> dos veces por paso y sólo cambian <em>dónde</em> toman la segunda pendiente
                    (al final del intervalo o en su punto medio). Taylor, en cambio, evalúa <KaTeX expresionTex="f" /> una sola vez
                    pero exige derivarla a mano:
                  </p>
                  <div className="bg-white dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-700/50 p-3 mt-3 desplazamiento-formula text-center">
                    <KaTeX expresionTex={problema.segundaTex} />
                  </div>
                </div>

                {/* COSTO POR PASO */}
                <div className="bg-slate-100 dark:bg-slate-800/60 border-l-4 border-indigo-500 rounded-r-xl p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-3">
                    Costo por paso
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500 border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-2 pr-4">Método</th>
                          <th className="text-left py-2 px-3">Evaluaciones</th>
                          <th className="text-left py-2 px-3">Error local</th>
                          <th className="text-left py-2 pl-3">Error global</th>
                        </tr>
                      </thead>
                      <tbody>
                        {METODOS.map((m) => (
                          <tr key={m.clave} className="border-b border-slate-200 dark:border-slate-800/70">
                            <td className="py-2.5 pr-4 font-semibold" style={{ color: m.color }}>{m.nombre}</td>
                            <td className="py-2.5 px-3 text-slate-800 dark:text-slate-300">{m.evaluaciones}</td>
                            <td className="py-2.5 px-3"><KaTeX expresionTex="O(h^3)" /></td>
                            <td className="py-2.5 pl-3"><KaTeX expresionTex="O(h^2)" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </RevelarAlEntrar>

            {/* SECCIÓN 3: ITERACIONES */}
            <RevelarAlEntrar>
              <div id="iteraciones" className="scroll-mt-28 bg-white dark:bg-slate-800/50 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 shadow-xl space-y-6">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-wide border-l-4 border-emerald-500 pl-4">
                  3. Iteraciones paso a paso
                </h2>

                <p className="text-slate-800 dark:text-slate-300 leading-relaxed">
                  Con la ordenada genérica de cada método se recorre el dominio desde <KaTeX expresionTex={`x_0 = ${problema.x0}`} />{' '}
                  hasta <KaTeX expresionTex={`x_f = ${problema.xf}`} />, reemplazando en cada iteración los valores del punto
                  <KaTeX expresionTex="\; (x_n, y_n)" /> en el que estamos parados. Los cálculos se muestran con 6 decimales.
                </p>

                <div className="flex flex-wrap gap-2">
                  {METODOS.map((m) => (
                    <button
                      key={m.clave}
                      onClick={() => setMetodoVisible(m.clave)}
                      className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                        m.clave === metodo.clave
                          ? 'text-white'
                          : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                      style={m.clave === metodo.clave ? { backgroundColor: m.color, borderColor: m.color } : undefined}
                    >
                      {m.nombre}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  {iteraciones[metodo.clave].map((it) => (
                    <div key={it.n} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500 mb-2">
                        Iteración n = {it.n} · <KaTeX expresionTex={`x_{${it.n + 1}} = ${t(it.x + problema.h, 4)}`} />
                      </p>
                      <div className="desplazamiento-formula space-y-1.5 text-slate-800 dark:text-slate-300 text-sm">
                        {sustitucionTex(metodo.clave, it, problema.h).map((linea) => (
                          <div key={linea}><KaTeX expresionTex={linea} /></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-100 dark:bg-slate-800/60 border-l-4 rounded-r-xl p-5" style={{ borderColor: metodo.color }}>
                  <p className="text-slate-800 dark:text-slate-300 text-sm">
                    Resultado con {metodo.nombre}:{' '}
                    <KaTeX expresionTex={`y(${problema.xf}) \\approx ${t(valorFinal(metodo.clave, problema))}`} /> frente al valor exacto{' '}
                    <KaTeX expresionTex={t(problema.exacta(problema.xf))} />.
                  </p>
                </div>
              </div>
            </RevelarAlEntrar>

            {/* SECCIÓN 4: COMPARATIVA */}
            <RevelarAlEntrar>
              <div id="comparativa" className="scroll-mt-28 bg-white dark:bg-slate-800/50 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 shadow-xl space-y-6">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-wide border-l-4 border-amber-500 pl-4">
                  4. Comparativa
                </h2>

                {/* TABLA DE VALORES */}
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5 md:p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500 mb-4">
                    Aproximaciones y error absoluto en cada nodo · <KaTeX expresionTex={problema.ecuacionTex} />
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse tabular-nums">
                      <thead>
                        <tr className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500 border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-2 pr-3"><KaTeX expresionTex="x_n" /></th>
                          {METODOS.map((m) => (
                            <th key={m.clave} className="text-right py-2 px-3" style={{ color: m.color }}>{m.nombre}</th>
                          ))}
                          <th className="text-right py-2 pl-3">Exacta</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filas.map((f) => {
                          const mejor = f.x === problema.x0 ? null : METODOS.reduce((a, b) => (f[`error_${b.clave}`] < f[`error_${a.clave}`] ? b : a)).clave;
                          return (
                            <tr key={f.x} className="border-b border-slate-200 dark:border-slate-800/60">
                              <td className="py-2 pr-3 text-slate-800 dark:text-slate-300">{t(f.x, 4)}</td>
                              {METODOS.map((m) => (
                                <td key={m.clave} className={`py-2 px-3 text-right ${mejor === m.clave ? 'font-bold' : ''} text-slate-800 dark:text-slate-300`}>
                                  {f[m.clave].toFixed(6)}
                                  {f.x !== problema.x0 && (
                                    <span className="block text-[11px] text-slate-500 dark:text-slate-500">ε = {f[`error_${m.clave}`].toExponential(2)}</span>
                                  )}
                                </td>
                              ))}
                              <td className="py-2 pl-3 text-right text-slate-900 dark:text-white">{f.exacta.toFixed(6)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-500 mt-3">En negrita, el método con menor error en cada nodo.</p>
                </div>

                {/* GRÁFICOS */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500 mb-3">Aproximaciones vs. solución exacta</p>
                    <GraficoLineas
                      datos={datosCurvas}
                      etiquetaX="x"
                      etiquetaY="y"
                      series={[
                        { clave: 'exacta', nombre: 'Exacta', color: '#94a3b8', punteada: true },
                        ...METODOS.map((m) => ({ clave: m.clave, nombre: m.nombre, color: m.color })),
                      ]}
                    />
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500 mb-3">Error absoluto acumulado</p>
                    <GraficoLineas
                      datos={datosError}
                      etiquetaX="x"
                      etiquetaY="|y(xₙ) − yₙ|"
                      series={METODOS.map((m) => ({ clave: m.clave, nombre: m.nombre, color: m.color }))}
                    />
                  </div>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  A simple vista las tres aproximaciones se superponen con la solución exacta: es lo esperable en métodos de orden 2.
                  El gráfico de error amplía esa diferencia y muestra cómo crece a medida que se avanza, porque cada paso arranca de
                  un <KaTeX expresionTex="y_n" /> que ya arrastra el error de los anteriores.
                </p>

                {/* CONVERGENCIA */}
                <div className="bg-slate-100 dark:bg-slate-800/60 border-l-4 border-amber-500 rounded-r-xl p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-3">
                    Verificación del orden: ¿qué pasa al achicar h?
                  </p>
                  <p className="text-slate-800 dark:text-slate-300 leading-relaxed text-sm mb-4">
                    Si el error global es <KaTeX expresionTex="O(h^2)" />, al dividir el paso por 2 el error en{' '}
                    <KaTeX expresionTex={`x_f = ${problema.xf}`} /> debería dividirse por <KaTeX expresionTex="2^2 = 4" />.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse tabular-nums">
                      <thead>
                        <tr className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500 border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-2 pr-3">h</th>
                          {METODOS.map((m) => (
                            <th key={m.clave} className="text-right py-2 px-3" style={{ color: m.color }}>{m.nombre}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {PASOS_CONVERGENCIA.map((h, i) => (
                          <tr key={h} className="border-b border-slate-200 dark:border-slate-800/60">
                            <td className="py-2 pr-3 text-slate-800 dark:text-slate-300">{h}</td>
                            {METODOS.map((m) => {
                              const e = errorFinal(m.clave, problema, h);
                              const cociente = i > 0 ? errorFinal(m.clave, problema, PASOS_CONVERGENCIA[i - 1]) / e : null;
                              return (
                                <td key={m.clave} className="py-2 px-3 text-right text-slate-800 dark:text-slate-300">
                                  {e.toExponential(3)}
                                  {cociente !== null && (
                                    <span className="block text-[11px] text-amber-600 dark:text-amber-400">÷ {cociente.toFixed(2)}</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* RESUMEN DE LOS TRES PROBLEMAS */}
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5 md:p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500 mb-4">
                    Error en el punto final para los tres problemas (h = 0.1)
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse tabular-nums">
                      <thead>
                        <tr className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500 border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-2 pr-3">Problema</th>
                          {METODOS.map((m) => (
                            <th key={m.clave} className="text-right py-2 px-3" style={{ color: m.color }}>{m.nombre}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {resumen.map(({ p, errores, mejor }) => (
                          <tr key={p.clave} className="border-b border-slate-200 dark:border-slate-800/60">
                            <td className="py-2 pr-3 text-slate-800 dark:text-slate-300"><KaTeX expresionTex={p.ecuacionTex} /></td>
                            {errores.map((e, i) => (
                              <td key={METODOS[i].clave} className={`py-2 px-3 text-right text-slate-800 dark:text-slate-300 ${i === mejor ? 'font-bold' : ''}`}>
                                {e.toExponential(2)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </RevelarAlEntrar>

            {/* SECCIÓN 5: CONCLUSIÓN */}
            <RevelarAlEntrar>
              <div id="conclusion" className="scroll-mt-28 bg-white dark:bg-slate-800/50 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 shadow-xl space-y-6">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-wide border-l-4 border-purple-500 pl-4">
                  5. Conclusión
                </h2>

                <p className="text-slate-800 dark:text-slate-300 leading-relaxed">
                  Para <KaTeX expresionTex={problema.ecuacionTex} /> con <KaTeX expresionTex={`h = ${problema.h}`} />, el orden de los
                  métodos según su error en <KaTeX expresionTex={`x_f = ${problema.xf}`} /> es:{' '}
                  {ranking.map((m, i) => (
                    <span key={m.clave}>
                      <strong style={{ color: m.color }}>{m.nombre}</strong> (<KaTeX expresionTex={`\\varepsilon = ${t(errorFinal(m.clave, problema))}`} />)
                      {i < ranking.length - 1 ? ', ' : '.'}
                    </span>
                  ))}
                </p>

                <div className="bg-slate-100 dark:bg-slate-800/60 border-l-4 border-emerald-500 rounded-r-xl p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-3">Conclusión general</p>
                  <ul className="space-y-2 text-slate-800 dark:text-slate-300 leading-relaxed list-disc pl-5">
                    <li>
                      <strong>Misma precisión asintótica.</strong> Los tres métodos son de orden 2: la tabla de convergencia muestra que
                      al dividir h por 2 el error se divide por ≈ 4 en los tres casos. Ninguno es &ldquo;de otra categoría&rdquo;; si se
                      necesita mucha más precisión conviene subir de orden (por ejemplo, Runge-Kutta de orden 4) antes que cambiar entre
                      estos tres.
                    </li>
                    <li>
                      <strong>Distinta constante de error.</strong> Con el mismo paso, los resultados difieren en el término{' '}
                      <KaTeX expresionTex="h^3" /> que cada método aproxima a su manera. El resumen de los tres problemas muestra que no
                      hay un ganador universal: el más preciso depende de la ecuación.
                    </li>
                    <li>
                      <strong>Distinto costo de aplicación.</strong> Taylor requiere derivar f analíticamente, lo que se complica
                      rápidamente para ecuaciones más elaboradas y no se puede automatizar para una f cualquiera. Euler Mejorado y RK2
                      sólo necesitan evaluar f dos veces por paso, sin derivadas: por eso son los métodos de orden 2 preferidos en la
                      práctica.
                    </li>
                  </ul>
                </div>
              </div>
            </RevelarAlEntrar>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
