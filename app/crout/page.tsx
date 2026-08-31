'use client';

import { useState, type ReactNode } from 'react';
import Header from '@/src/components/Header';
import Footer from '@/src/components/Footer';
import KaTeX from '@/src/components/KaTeX';
import FactorizacionInteractiva from '@/src/components/FactorizacionInteractiva';
import RevelarAlEntrar from '@/src/components/RevelarAlEntrar';
import GlifoMatriz from '@/src/components/GlifoMatriz';
import { desplazarHaciaAncla } from '@/src/lib/lenis';
import { resolverCrout, redondear, type PasoCrout, type ResultadoCrout } from '@/src/lib/crout';

const PATRON_DENSO = [
  [true, true, true],
  [true, true, true],
  [true, true, true],
];
const PATRON_TRIANGULAR = [
  [true, true, true],
  [false, true, true],
  [false, false, true],
];
const PATRON_VECTOR = [
  [true, false, false],
  [true, false, false],
  [true, false, false],
];
const PATRON_CALCULADORA = [
  [true, false, true],
  [false, true, false],
  [true, false, true],
];

const navegacion = [
  { href: '#fundamentos', label: '1. Fundamentos', patron: PATRON_DENSO },
  { href: '#construccion', label: '2. Construcción', patron: PATRON_TRIANGULAR },
  { href: '#resolucion', label: '3. Resolución', patron: PATRON_VECTOR },
  { href: '#calculadora', label: '4. Calculadora', patron: PATRON_CALCULADORA },
];

const DIMENSION_MINIMA = 1;
const DIMENSION_MAXIMA = 5; // Límite elegido para priorizar el diseño: pasado 5x5 las matrices dejan de entrar con claridad.

const conceptosPrevios = [
  {
    titulo: 'Matriz triangular',
    texto: 'Matriz cuadrada en la que todos los elementos por encima (triangular inferior) o por debajo (triangular superior) de la diagonal principal son nulos.',
    ejemplo: String.raw`\underline{\underline{L}} = \begin{pmatrix} 2 & 0 & 0 \\ -1 & 3 & 0 \\ 4 & 0 & 5 \end{pmatrix} \qquad \underline{\underline{U}} = \begin{pmatrix} 2 & 7 & -1 \\ 0 & 3 & 6 \\ 0 & 0 & 5 \end{pmatrix}`,
    pie: 'La primera es triangular inferior (ceros por encima de la diagonal); la segunda, triangular superior. Notar que los ceros dentro del triángulo, como el 0 en la posición (3,2) de L, están permitidos.',
  },
  {
    titulo: 'Matriz diagonal',
    texto: 'Es simultáneamente triangular superior e inferior: sólo tiene elementos no nulos en la diagonal principal.',
    ejemplo: String.raw`\underline{\underline{D}} = \begin{pmatrix} 2 & 0 & 0 \\ 0 & -1 & 0 \\ 0 & 0 & 5 \end{pmatrix}`,
    pie: 'Cumple las dos condiciones a la vez, porque no hay elementos no nulos ni arriba ni abajo de la diagonal.',
  },
  {
    titulo: 'Cierre bajo suma y producto',
    texto: 'La suma y el producto de dos matrices triangulares de la misma estructura vuelven a dar una matriz con esa misma estructura.',
    ejemplo: String.raw`\begin{pmatrix} 2 & 0 \\ -1 & 3 \end{pmatrix} + \begin{pmatrix} 4 & 0 \\ 5 & 1 \end{pmatrix} = \begin{pmatrix} 6 & 0 \\ 4 & 4 \end{pmatrix} \qquad \begin{pmatrix} 2 & 0 \\ -1 & 3 \end{pmatrix} \cdot \begin{pmatrix} 4 & 0 \\ 5 & 1 \end{pmatrix} = \begin{pmatrix} 8 & 0 \\ 11 & 3 \end{pmatrix}`,
    pie: 'Dos triangulares inferiores dan, tanto sumadas como multiplicadas, otra triangular inferior. Esto es lo que permite que el producto L·U reconstruya A sin salirse del esquema.',
  },
  {
    titulo: 'Inversa',
    texto: 'La inversa de una matriz triangular es otra matriz triangular de la misma estructura.',
    ejemplo: String.raw`\begin{pmatrix} 2 & 0 \\ -1 & 3 \end{pmatrix}^{-1} = \begin{pmatrix} \tfrac{1}{2} & 0 \\ \tfrac{1}{6} & \tfrac{1}{3} \end{pmatrix}`,
    pie: 'La inversa de una triangular inferior sigue siendo triangular inferior, y su diagonal es la inversa elemento a elemento de la original.',
  },
  {
    titulo: 'Determinante',
    texto: 'El determinante de una matriz triangular es igual al producto de los elementos de su diagonal principal, lo que hace muy barato calcularlo una vez factorizada A.',
    ejemplo: String.raw`\begin{vmatrix} 2 & 7 & -1 \\ 0 & 3 & 6 \\ 0 & 0 & 5 \end{vmatrix} = 2 \cdot 3 \cdot 5 = 30`,
    pie: String.raw`Como |A| = |L| · |U| y la diagonal de U son todos 1, el determinante de A es directamente el producto de la diagonal de L.`,
  },
];

function matrizVaciaString(n: number): string[][] {
  return Array.from({ length: n }, () => Array.from({ length: n }, () => ''));
}

// Subíndices Unicode para los placeholders: los inputs son texto plano y no admiten KaTeX.
const SUBINDICES = '₀₁₂₃₄₅₆₇₈₉';
const subindice = (valor: number) => String(valor).split('').map((digito) => SUBINDICES[Number(digito)]).join('');

function matrizATex(m: number[][]): string {
  return `\\begin{pmatrix} ${m.map((fila) => fila.join(' & ')).join(' \\\\ ')} \\end{pmatrix}`;
}

function vectorATex(v: number[]): string {
  return `\\begin{pmatrix} ${v.join(' \\\\ ')} \\end{pmatrix}`;
}

function PasoCalculadora({ numero, titulo, color, children }: { numero: number; titulo: string; color: string; children: ReactNode }) {
  return (
    <div className={`bg-slate-950/30 border-l-4 ${color} rounded-r-xl p-5 md:p-6 space-y-4`}>
      <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-3">
        <span className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-slate-800 text-slate-300 text-xs font-black">
          {numero}
        </span>
        {titulo}
      </h3>
      {children}
    </div>
  );
}

function ListaPasos({ pasos }: { pasos: PasoCrout[] }) {
  return (
    <ol className="space-y-2">
      {pasos.map((paso, indice) => (
        <li key={paso.clave} className="bg-slate-950/60 border border-slate-700/50 rounded-lg px-4 py-3">
          {paso.grupo !== pasos[indice - 1]?.grupo && (
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{paso.grupo}</p>
          )}
          <div className="desplazamiento-formula">
            <KaTeX expresionTex={paso.tex} />
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function PaginaCroutTeoria() {
  // Estado de la calculadora (sección 4)
  const [n, setN] = useState(3);
  const [matrizA, setMatrizA] = useState<string[][]>(() => matrizVaciaString(3));
  const [vectorB, setVectorB] = useState<string[]>(() => Array(3).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [resultados, setResultados] = useState<ResultadoCrout | null>(null);
  const [sistemaResuelto, setSistemaResuelto] = useState<{ A: number[][]; b: number[] } | null>(null);

  const cambiarDimension = (nuevoN: number) => {
    setN(nuevoN);
    setMatrizA((previa) => matrizVaciaString(nuevoN).map((fila, f) => fila.map((valor, c) => previa[f]?.[c] ?? valor)));
    setVectorB((previo) => Array.from({ length: nuevoN }, (_, i) => previo[i] ?? ''));
    setError(null);
    setResultados(null);
  };

  const manejarCambioA = (f: number, c: number, valor: string) => {
    const nuevaMatriz = matrizA.map((fila) => [...fila]);
    nuevaMatriz[f][c] = valor;
    setMatrizA(nuevaMatriz);
    setResultados(null);
  };

  const manejarCambioB = (f: number, valor: string) => {
    const nuevoVector = [...vectorB];
    nuevoVector[f] = valor;
    setVectorB(nuevoVector);
    setResultados(null);
  };

  const resolverSistema = () => {
    setError(null);
    setResultados(null);
    setSistemaResuelto(null);

    const A = matrizA.map((fila) => fila.map((val) => parseFloat(val)));
    const b = vectorB.map((val) => parseFloat(val));

    if (A.flat().some(isNaN) || b.some(isNaN)) {
      setError('Por favor, complete todos los campos con números válidos.');
      return;
    }

    const resultado = resolverCrout(A, b);
    setResultados(resultado);
    setSistemaResuelto({ A, b });
    if (!resultado.factorizable) {
      setError(`La matriz no cumple el teorema de existencia. ${resultado.motivo}`);
    }
  };

  const tamanioCelda = n <= 3 ? 'w-16 h-12 text-base' : n === 4 ? 'w-14 h-11 text-sm' : 'w-11 h-10 text-xs';

  return (
    <main className="min-h-screen flex flex-col fondo-cuadriculado">
      <Header />

      <section className="flex-1 max-w-6xl mx-auto px-4 py-24 w-full space-y-8">

        {/* ENCABEZADO */}
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-[3.5rem] font-extrabold mb-4 bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 text-transparent bg-clip-text leading-tight">
            Método Directo de Crout (L·U)
          </h1>
          <p className="text-slate-400 font-medium tracking-tight">Análisis Numérico · Sistemas de Ecuaciones Lineales</p>
        </div>

        {/* CUERPO: guía lateral + contenido */}
        <div className="grid grid-cols-1 lg:grid-cols-[9rem_1fr] gap-4 lg:gap-10">

          {/* GUÍA LATERAL (sólo desktop) */}
          <nav className="hidden lg:flex flex-col gap-8 sticky top-32 self-start h-fit pr-2 border-r border-slate-800">
            {navegacion.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(evento) => desplazarHaciaAncla(evento, item.href)}
                className="group flex items-center gap-3 text-slate-500 hover:text-slate-200 transition-colors"
              >
                <GlifoMatriz celdas={item.patron} className="text-slate-600 group-hover:text-blue-400 transition-colors shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest leading-tight">
                  {item.label}
                </span>
              </a>
            ))}
          </nav>

          <div className="space-y-8 min-w-0">

            {/* SECCIÓN 1: FUNDAMENTOS MATEMÁTICOS */}
            <RevelarAlEntrar>
            <div id="fundamentos" className="scroll-mt-28 bg-slate-800/50 rounded-2xl p-6 md:p-8 border border-slate-700 shadow-xl space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide border-l-4 border-blue-500 pl-4">
                1. Fundamentos Matemáticos
              </h2>

              <p className="text-slate-300 leading-relaxed">
                Resolver un sistema <KaTeX expresionTex="\underline{\underline{A}} \cdot \vec{x} = \vec{b}" /> tiene, en general,
                dos familias de caminos: los <strong className="text-slate-100">métodos iterativos</strong> (Jacobi, Gauss-Seidel,
                Relajación), que generan aproximaciones sucesivas hasta converger, y los <strong className="text-slate-100">métodos
                directos o exactos</strong>, que llegan a la solución en un número finito de operaciones transformando el sistema
                original en uno equivalente más simple de resolver. Cramer, la sustitución y Gauss son ejemplos de métodos
                directos; Crout pertenece a una familia particular dentro de ese grupo: las <strong className="text-blue-300">técnicas
                de factorización</strong>, que también incluyen a Cholesky.
              </p>
              <p className="text-slate-300 leading-relaxed">
                La idea de Crout es transformar el problema de resolver <KaTeX expresionTex="\underline{\underline{A}} \cdot \vec{x} = \vec{b}" /> en
                la resolución escalonada de dos sistemas triangulares, mucho más simples. Para eso, la matriz cuadrada original se
                expresa como el producto de una matriz triangular inferior <KaTeX expresionTex="\underline{\underline{L}}" /> y una
                triangular superior <KaTeX expresionTex="\underline{\underline{U}}" />.
              </p>

              {/* CONCEPTOS PREVIOS */}
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">
                  Conceptos previos <span className="text-slate-600 normal-case tracking-normal font-medium">· desplegá cada uno para ver un ejemplo</span>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 items-stretch">
                  {conceptosPrevios.map((concepto, indice) => (
                    <details
                      key={concepto.titulo}
                      className={`group h-full min-h-36 flex flex-col rounded-lg border border-slate-700/50 bg-slate-900/40 open:bg-slate-900/70 transition-colors ${
                        indice === conceptosPrevios.length - 1 && conceptosPrevios.length % 2 === 1 ? 'md:col-span-2' : ''
                      }`}
                    >
                      <summary className="flex flex-1 items-start gap-3 p-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                        <span className="shrink-0 mt-0.5 w-6 h-6 flex items-center justify-center rounded-full text-slate-400 group-hover:text-blue-300 group-hover:bg-blue-500/10 group-open:text-blue-300 transition-colors">
                          <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 transition-transform duration-300 ease-out group-open:rotate-180">
                            <path d="M4.5 7.5l5.5 5.5 5.5-5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        <span className="min-w-0">
                          <span className="block font-bold text-blue-300 text-sm mb-1">{concepto.titulo}</span>
                          <span className="block text-sm text-slate-400 leading-relaxed">{concepto.texto}</span>
                        </span>
                      </summary>
                      <div className="mx-4 mb-4 rounded-lg border border-slate-700/50 bg-slate-950/60 p-4 shadow-inner">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">Ejemplo</p>
                        <div className="desplazamiento-formula">
                          <KaTeX expresionTex={concepto.ejemplo} enBloque={true} />
                        </div>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">{concepto.pie}</p>
                      </div>
                    </details>
                  ))}
                </div>
              </div>

              {/* TEOREMA DE EXISTENCIA Y UNICIDAD */}
              <div className="bg-slate-800/60 border-l-4 border-emerald-500 rounded-r-xl p-6">
                <p className="text-sm md:text-base font-black uppercase tracking-widest text-emerald-400 mb-3">Teorema de existencia y unicidad</p>
                <p className="text-slate-300 leading-relaxed mb-4">
                  Toda matriz cuadrada <KaTeX expresionTex="\underline{\underline{A}}" /> cuyos menores principales son distintos de cero
                  puede expresarse como producto de dos matrices triangulares:
                </p>
                <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 shadow-inner p-4 desplazamiento-formula">
                  <KaTeX
                    expresionTex={String.raw`\Delta_1 = a_{11} \neq 0 \quad , \quad \Delta_2 = \begin{vmatrix} a_{11} & a_{12} \\ a_{21} & a_{22} \end{vmatrix} \neq 0 \quad , \quad \ldots \quad , \quad \Delta_n = |\underline{\underline{A}}| \neq 0`}
                    enBloque={true}
                  />
                </div>
                <p className="text-slate-300 leading-relaxed mt-4">
                  Esa factorización es, además, <strong className="text-emerald-300">única</strong> si se fijan de antemano los
                  elementos de la diagonal principal de una de las dos matrices, por convención igualándolos a 1.
                </p>
              </div>

              {/* CONTEO DE ECUACIONES E INCÓGNITAS */}
              <div className="bg-slate-900/50 p-6 border border-slate-700/50 rounded-xl">
                <p className="text-slate-300 leading-relaxed mb-4">
                  Al multiplicar genéricamente estas matrices de tamaño <KaTeX expresionTex="n \times n" />, se generan <KaTeX expresionTex="n^2" /> ecuaciones,
                  pero entre ambas matrices triangulares suman <KaTeX expresionTex="n^2 + n" /> incógnitas. Como hay <KaTeX expresionTex="n" /> incógnitas
                  de más, el sistema no tiene solución única.
                </p>
                <p className="text-slate-300 leading-relaxed font-medium text-blue-200">
                  Crout resuelve esa discrepancia fijando los <KaTeX expresionTex="n" /> elementos de la diagonal principal de <KaTeX expresionTex="\underline{\underline{U}}" /> en
                  1. El sistema queda entonces con la misma cantidad de ecuaciones que de incógnitas:
                </p>
              </div>

              <div className="bg-slate-900/80 p-6 md:p-8 rounded-xl border border-slate-700/50 text-center shadow-inner desplazamiento-formula">
                <KaTeX expresionTex="\underline{\underline{A}} = \underline{\underline{L}} \cdot \underline{\underline{U}}" enBloque={true} />

                <div className="mt-8 flex flex-col xl:flex-row items-center justify-center gap-6">
                  <KaTeX expresionTex={String.raw`\begin{pmatrix} a_{11} & a_{12} & a_{13} \\ a_{21} & a_{22} & a_{23} \\ a_{31} & a_{32} & a_{33} \end{pmatrix}`} enBloque={true} />
                  <div className="text-4xl text-slate-500 font-black">=</div>
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <KaTeX expresionTex={String.raw`\begin{pmatrix} l_{11} & 0 & 0 \\ l_{21} & l_{22} & 0 \\ l_{31} & l_{32} & l_{33} \end{pmatrix}`} enBloque={true} />
                    <span className="text-3xl text-slate-500 font-black">×</span>
                    <KaTeX expresionTex={String.raw`\begin{pmatrix} 1 & u_{12} & u_{13} \\ 0 & 1 & u_{23} \\ 0 & 0 & 1 \end{pmatrix}`} enBloque={true} />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-6">
                  Convención alternativa: también es válido fijar en 1 la diagonal de L (factorización L₁·U) en lugar de la de U. Cualquiera de las dos garantiza unicidad.
                </p>
              </div>

            </div>
            </RevelarAlEntrar>

            {/* SECCIÓN 2: INTERACTIVIDAD */}
            {/* z-10: los paneles flotantes de los desarrollos se salen de la tarjeta y deben quedar
                por encima de la sección 3, que crea su propio contexto de apilado al animarse. */}
            <RevelarAlEntrar className="relative z-10">
            <div id="construccion" className="scroll-mt-28 bg-slate-800/50 rounded-2xl p-6 md:p-8 border border-slate-700 shadow-xl">
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide border-l-4 border-indigo-500 pl-4 mb-4 flex flex-wrap items-center gap-2">
                2. Construcción de Matrices <KaTeX expresionTex="(\underline{\underline{A}} = \underline{\underline{L}} \cdot \underline{\underline{U}})" />
              </h2>
              {/* FÓRMULA GENERAL */}
              <div className="bg-slate-800/60 border-l-4 border-blue-500 rounded-r-xl p-6 mb-8">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-3">Fórmula general, para n×n</p>
                <p className="text-slate-300 leading-relaxed mb-4">
                  Antes de bajar al ejemplo concreto de 3×3, así se define el algoritmo de Crout para un sistema de cualquier
                  tamaño <KaTeX expresionTex="n" />. Primero la columna 1 de L y la fila 1 de U:
                </p>
                <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 shadow-inner p-4 desplazamiento-formula mb-4">
                  <KaTeX expresionTex={String.raw`l_{i1} = a_{i1} \quad (i=1,\ldots,n) \qquad\qquad u_{1j} = \frac{a_{1j}}{l_{11}} \quad (j=2,\ldots,n)`} enBloque={true} />
                </div>
                <p className="text-slate-300 leading-relaxed mb-4">
                  Y luego, avanzando columna a columna (<KaTeX expresionTex="k = 2,\ldots,n" />), cada nueva entrada de L y de U descuenta lo que ya
                  aportaron las columnas anteriores:
                </p>
                <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 shadow-inner p-4 desplazamiento-formula">
                  <KaTeX
                    expresionTex={String.raw`l_{ik} = a_{ik} - \sum_{p=1}^{k-1} l_{ip}\,u_{pk} \quad (i \geq k) \qquad\qquad u_{kj} = \frac{a_{kj} - \sum_{p=1}^{k-1} l_{kp}\,u_{pj}}{l_{kk}} \quad (j > k)`}
                    enBloque={true}
                  />
                </div>
              </div>

              <p className="text-slate-300 leading-relaxed mb-8">
                A continuación, esas mismas fórmulas particularizadas en <KaTeX expresionTex="n = 3" />. Cada una de las 9 ecuaciones
                sale de igualar una celda de A con el producto de una fila de L por una columna de U. Pase el cursor por una celda
                o ecuación para relacionarlas: el <span className="text-blue-300 font-bold">botón con la flecha ▾</span> de
                cada tarjeta muestra el desarrollo de la fórmula, con el producto original y el despeje que lleva a la fórmula de cálculo.
              </p>
              <FactorizacionInteractiva />
            </div>
            </RevelarAlEntrar>

            {/* SECCIÓN 3: RESOLUCIÓN DEL SISTEMA */}
            <RevelarAlEntrar>
            <div id="resolucion" className="scroll-mt-28 bg-slate-800/50 rounded-2xl p-6 md:p-8 border border-slate-700 shadow-xl space-y-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide border-l-4 border-emerald-500 pl-4 flex flex-wrap items-center gap-2">
                3. Resolución del Sistema <KaTeX expresionTex="\vec{x}" />
              </h2>
              <p className="text-slate-300 leading-relaxed">
                Con <KaTeX expresionTex="\underline{\underline{L}}" /> y <KaTeX expresionTex="\underline{\underline{U}}" /> ya
                calculadas, se sustituyen en la ecuación original para obtener <KaTeX expresionTex="\underline{\underline{L}} \cdot (\underline{\underline{U}} \cdot \vec{x}) = \vec{b}" />.
                Llamando <KaTeX expresionTex="\vec{y} = \underline{\underline{U}} \cdot \vec{x}" /> al vector intermedio, el problema
                se parte en dos sistemas triangulares que se resuelven en cadena.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-700/50 shadow-lg">
                  <h3 className="text-xl font-bold text-emerald-400 mb-2 text-center">Fase 1 · Sustitución hacia adelante</h3>
                  <p className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Sistema triangular inferior</p>
                  <div className="bg-slate-950/60 p-6 rounded-xl mb-6 shadow-inner">
                    <KaTeX expresionTex="\underline{\underline{L}} \cdot \vec{y} = \vec{b}" enBloque={true} />
                  </div>
                  <p className="text-slate-400">
                    Al ser <KaTeX expresionTex="\underline{\underline{L}}" /> triangular inferior, se despeja de arriba hacia abajo:
                  </p>
                  <ul className="mt-4 space-y-3 text-slate-300 font-mono text-base md:text-lg bg-slate-900/50 p-4 rounded-lg">
                    <li><KaTeX expresionTex="y_1 = \frac{b_1}{l_{11}}" /></li>
                    <li><KaTeX expresionTex="y_2 = \frac{b_2 - l_{21}y_1}{l_{22}}" /></li>
                    <li><KaTeX expresionTex="y_3 = \frac{b_3 - l_{31}y_1 - l_{32}y_2}{l_{33}}" /></li>
                  </ul>
                </div>

                <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-700/50 shadow-lg">
                  <h3 className="text-xl font-bold text-emerald-400 mb-2 text-center">Fase 2 · Sustitución hacia atrás</h3>
                  <p className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Sistema triangular superior</p>
                  <div className="bg-slate-950/60 p-6 rounded-xl mb-6 shadow-inner">
                    <KaTeX expresionTex="\underline{\underline{U}} \cdot \vec{x} = \vec{y}" enBloque={true} />
                  </div>
                  <p className="text-slate-400">
                    Con <KaTeX expresionTex="\vec{y}" /> ya conocido, y siendo <KaTeX expresionTex="\underline{\underline{U}}" /> triangular
                    superior, se despeja de abajo hacia arriba:
                  </p>
                  <ul className="mt-4 space-y-3 text-slate-300 font-mono text-base md:text-lg bg-slate-900/50 p-4 rounded-lg">
                    <li><KaTeX expresionTex="x_3 = y_3" /></li>
                    <li><KaTeX expresionTex="x_2 = y_2 - u_{23}x_3" /></li>
                    <li><KaTeX expresionTex="x_1 = y_1 - u_{12}x_2 - u_{13}x_3" /></li>
                  </ul>
                </div>
              </div>

              <p className="text-slate-400 leading-relaxed border-t border-slate-700/50 pt-6">
                Ninguna de las dos fases requiere iterar ni converger: al ser ambos sistemas triangulares, cada incógnita queda
                despejada en función de valores ya conocidos. Por eso Crout, como todo método directo, llega a la solución exacta
                de <KaTeX expresionTex="\underline{\underline{A}} \cdot \vec{x} = \vec{b}" /> en un número finito y predecible de operaciones.
              </p>
            </div>
            </RevelarAlEntrar>

            {/* SECCIÓN 4: CALCULADORA INTERACTIVA */}
            <RevelarAlEntrar>
            <div id="calculadora" className="scroll-mt-28 bg-slate-800/50 rounded-2xl p-6 md:p-8 border border-slate-700 shadow-xl space-y-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide border-l-4 border-purple-500 pl-4">
                4. Calculadora Interactiva
              </h2>
              <p className="text-slate-300 leading-relaxed">
                Aplicá el algoritmo con tus propios números. Elegí la dimensión del sistema, cargá la matriz <KaTeX expresionTex="\underline{\underline{A}}" /> y
                el vector <KaTeX expresionTex="\vec{b}" />, y la calculadora muestra la verificación del teorema, las matrices factorizadas y la solución paso a paso.
              </p>

              {/* SELECTOR DE DIMENSIÓN */}
              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50 flex flex-col items-center gap-4">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Dimensión del sistema</p>
                <div className="inline-flex bg-slate-900 p-1.5 rounded-xl border border-slate-700 shadow-inner">
                  {Array.from({ length: DIMENSION_MAXIMA - DIMENSION_MINIMA + 1 }, (_, i) => i + DIMENSION_MINIMA).map((valor) => (
                    <button
                      key={valor}
                      onClick={() => cambiarDimension(valor)}
                      className={`w-11 h-9 flex items-center justify-center text-sm font-black rounded-lg transition-all ${
                        n === valor ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {valor}×{valor}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 text-center max-w-md">
                  El máximo se limita a 5×5 para priorizar la claridad del diseño: matrices más grandes dejan de entrar bien en pantalla.
                </p>
              </div>

              {/* ÁREA DE ENTRADA */}
              <div className="bg-slate-900/60 rounded-2xl p-8 border border-slate-700/50 shadow-lg flex flex-col md:flex-row items-center justify-center gap-10">
                <div className="flex flex-col items-center">
                  <p className="text-xs font-black text-blue-400 mb-4 uppercase tracking-widest">Matriz de Coeficientes (A)</p>
                  <div className="grid gap-2 border-l-2 border-r-2 border-slate-500 p-3 rounded-lg bg-slate-950/50" style={{ gridTemplateRows: `repeat(${n}, minmax(0, 1fr))` }}>
                    {matrizA.map((fila, r) => (
                      <div key={r} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
                        {fila.map((valor, c) => (
                          <input
                            key={c}
                            type="number"
                            value={valor}
                            placeholder={`a${subindice(r + 1)}${subindice(c + 1)}`}
                            aria-label={`Elemento a${r + 1}${c + 1} de la matriz A`}
                            onChange={(e) => manejarCambioA(r, c, e.target.value)}
                            className={`${tamanioCelda} text-center bg-slate-800 border border-slate-600 rounded text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono`}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-3xl font-black text-slate-500">· <KaTeX expresionTex="\vec{x} =" /></div>

                <div className="flex flex-col items-center">
                  <p className="text-xs font-black text-emerald-400 mb-4 uppercase tracking-widest">Términos Indep. (b)</p>
                  <div className="grid gap-2 border-l-2 border-r-2 border-slate-500 p-3 rounded-lg bg-slate-950/50" style={{ gridTemplateRows: `repeat(${n}, minmax(0, 1fr))` }}>
                    {vectorB.map((valor, r) => (
                      <input
                        key={r}
                        type="number"
                        value={valor}
                        placeholder={`b${subindice(r + 1)}`}
                        aria-label={`Elemento b${r + 1} del vector de términos independientes`}
                        onChange={(e) => manejarCambioB(r, e.target.value)}
                        className={`${tamanioCelda} text-center bg-slate-800 border border-slate-600 rounded text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={resolverSistema}
                  className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 text-lg"
                >
                  Calcular Solución
                </button>
              </div>

              {error && (
                <div className="bg-red-500/10 border-l-4 border-red-500 p-6 rounded-r-xl">
                  <h3 className="text-red-400 font-bold text-lg mb-2">Error de Cálculo</h3>
                  <p className="text-slate-300">{error}</p>
                </div>
              )}

              {resultados && sistemaResuelto && (
                <div className="bg-slate-900/40 rounded-2xl p-6 md:p-8 border border-slate-700/50 space-y-6 animar-aparicion">

                  <PasoCalculadora numero={1} titulo="Verificación previa: ¿es aplicable Crout?" color="border-blue-500">
                    <p className="text-slate-300 text-sm leading-relaxed">
                      Todos los menores principales de <KaTeX expresionTex="\underline{\underline{A}}" /> deben ser distintos de
                      cero. Si alguno se anula, la factorización sin pivotaje no existe y el algoritmo dividiría por cero.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {resultados.deltas.map((delta, indice) => {
                        const nulo = Math.abs(delta) < 1e-7;
                        return (
                          <div
                            key={indice}
                            className={`p-4 rounded-xl border min-w-[130px] text-center ${nulo ? 'bg-red-500/10 border-red-500/50' : 'bg-slate-950/60 border-slate-700/50'}`}
                          >
                            <KaTeX expresionTex={`\\Delta_{${indice + 1}} = ${redondear(delta)}`} />
                            <p className={`text-[10px] font-black uppercase tracking-widest mt-2 ${nulo ? 'text-red-400' : 'text-emerald-500'}`}>
                              {nulo ? 'Se anula' : 'Distinto de 0'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                    {resultados.factorizable ? (
                      <p className="text-sm text-emerald-300">
                        Ningún menor principal se anula: existe una única factorización <KaTeX expresionTex="\underline{\underline{A}} = \underline{\underline{L}} \cdot \underline{\underline{U}}" /> con
                        la diagonal de U fijada en 1.
                      </p>
                    ) : (
                      <p className="text-sm text-red-300">{resultados.motivo}</p>
                    )}
                  </PasoCalculadora>

                  {resultados.factorizable && (
                    <>
                      <PasoCalculadora numero={2} titulo="Factorización: cálculo de L y U" color="border-yellow-500">
                        <p className="text-slate-300 text-sm leading-relaxed">
                          Se alterna una columna de L y una fila de U, en ese orden, porque cada entrada depende de las
                          calculadas antes:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-slate-950/60 rounded-xl border border-slate-700/50 p-4 desplazamiento-formula">
                            <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400 mb-2">Expresiones de cálculo de elementos de L</p>
                            <KaTeX expresionTex={String.raw`l_{ik} = a_{ik} - \sum_{p=1}^{k-1} l_{ip}u_{pk}`} enBloque={true} />
                          </div>
                          <div className="bg-slate-950/60 rounded-xl border border-slate-700/50 p-4 desplazamiento-formula">
                            <p className="text-[10px] font-black uppercase tracking-widest text-green-400 mb-2">Expresiones de cálculo de elementos de U</p>
                            <KaTeX expresionTex={String.raw`u_{kj} = \frac{a_{kj} - \sum_{p=1}^{k-1} l_{kp}u_{pj}}{l_{kk}}`} enBloque={true} />
                          </div>
                        </div>
                        <ListaPasos pasos={resultados.pasosFactorizacion} />
                      </PasoCalculadora>

                      <PasoCalculadora numero={3} titulo="Matrices factorizadas" color="border-indigo-500">
                        <div className="flex flex-col md:flex-row gap-8 items-center justify-center bg-slate-950/40 p-6 rounded-2xl border border-slate-700/50 desplazamiento-formula">
                          <div className="text-center">
                            <p className="text-xs font-black text-yellow-400 mb-3 uppercase tracking-widest">Matriz Inferior (L)</p>
                            <KaTeX expresionTex={matrizATex(resultados.L)} enBloque={true} />
                          </div>
                          <div className="text-2xl font-black text-slate-500">×</div>
                          <div className="text-center">
                            <p className="text-xs font-black text-green-400 mb-3 uppercase tracking-widest">Matriz Superior (U)</p>
                            <KaTeX expresionTex={matrizATex(resultados.U)} enBloque={true} />
                          </div>
                          <div className="text-2xl font-black text-slate-500">=</div>
                          <div className="text-center">
                            <p className="text-xs font-black text-red-400 mb-3 uppercase tracking-widest">Matriz Original (A)</p>
                            <KaTeX expresionTex={matrizATex(sistemaResuelto.A)} enBloque={true} />
                          </div>
                        </div>
                      </PasoCalculadora>

                      <PasoCalculadora numero={4} titulo="Reemplazo en la ecuación original" color="border-purple-500">
                        <p className="text-slate-300 text-sm leading-relaxed">
                          Se sustituye <KaTeX expresionTex="\underline{\underline{A}}" /> por su factorización y se define el vector
                          intermedio <KaTeX expresionTex="\vec{y} = \underline{\underline{U}} \cdot \vec{x}" />. El sistema original queda
                          partido en dos sistemas triangulares encadenados:
                        </p>
                        <div className="bg-slate-950/60 rounded-xl border border-slate-700/50 p-4 desplazamiento-formula">
                          <KaTeX
                            expresionTex={String.raw`\underline{\underline{A}} \cdot \vec{x} = \vec{b} \quad \Longrightarrow \quad (\underline{\underline{L}} \cdot \underline{\underline{U}}) \cdot \vec{x} = \vec{b} \quad \Longrightarrow \quad \underline{\underline{L}} \cdot \underbrace{(\underline{\underline{U}} \cdot \vec{x})}_{\vec{y}} = \vec{b}`}
                            enBloque={true}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-slate-950/60 rounded-xl border border-slate-700/50 p-4 desplazamiento-formula text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Sistema 1 · hacia adelante</p>
                            <KaTeX expresionTex={`${matrizATex(resultados.L)} \\cdot \\vec{y} = ${vectorATex(sistemaResuelto.b)}`} enBloque={true} />
                          </div>
                          <div className="bg-slate-950/60 rounded-xl border border-slate-700/50 p-4 desplazamiento-formula text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Sistema 2 · hacia atrás</p>
                            <KaTeX expresionTex={`${matrizATex(resultados.U)} \\cdot \\vec{x} = \\vec{y}`} enBloque={true} />
                          </div>
                        </div>
                      </PasoCalculadora>

                      <PasoCalculadora numero={5} titulo="Sustitución hacia adelante: L · y = b" color="border-purple-500">
                        <p className="text-slate-300 text-sm leading-relaxed">
                          Al ser <KaTeX expresionTex="\underline{\underline{L}}" /> triangular inferior, cada <KaTeX expresionTex="y_i" /> se
                          despeja de arriba hacia abajo usando los anteriores:
                        </p>
                        <ListaPasos pasos={resultados.pasosY} />
                        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-700/50 flex justify-center desplazamiento-formula">
                          <KaTeX expresionTex={`\\vec{y} = ${vectorATex(resultados.y)}`} enBloque={true} />
                        </div>
                      </PasoCalculadora>

                      <PasoCalculadora numero={6} titulo="Sustitución hacia atrás: U · x = y" color="border-emerald-500">
                        <p className="text-slate-300 text-sm leading-relaxed">
                          Con <KaTeX expresionTex="\vec{y}" /> conocido y <KaTeX expresionTex="\underline{\underline{U}}" /> triangular
                          superior (diagonal 1), cada <KaTeX expresionTex="x_i" /> se despeja de abajo hacia arriba:
                        </p>
                        <ListaPasos pasos={resultados.pasosX} />
                        <div className="bg-slate-950/60 p-6 rounded-xl border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)] flex justify-center desplazamiento-formula">
                          <KaTeX expresionTex={`\\vec{x} = ${vectorATex(resultados.x)}`} enBloque={true} />
                        </div>
                      </PasoCalculadora>
                    </>
                  )}
                </div>
              )}
            </div>
            </RevelarAlEntrar>

          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
