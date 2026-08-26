'use client';

import { useState } from 'react';
import Header from '@/src/components/Header';
import Footer from '@/src/components/Footer';
import KaTeX from '@/src/components/KaTeX';
import FactorizacionInteractiva from '@/src/components/FactorizacionInteractiva';
import RevelarAlEntrar from '@/src/components/RevelarAlEntrar';
import GlifoMatriz from '@/src/components/GlifoMatriz';
import { desplazarHaciaAncla } from '@/src/lib/lenis';

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

// Determinante por expansión de cofilas. Con n <= 5 el costo (factorial) es irrelevante.
function determinante(m: number[][]): number {
  const n = m.length;
  if (n === 1) return m[0][0];
  if (n === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];
  let resultado = 0;
  for (let j = 0; j < n; j++) {
    const menor = m.slice(1).map((fila) => fila.filter((_, c) => c !== j));
    resultado += (j % 2 === 0 ? 1 : -1) * m[0][j] * determinante(menor);
  }
  return resultado;
}

function matrizIdentidadString(n: number): string[][] {
  return Array.from({ length: n }, (_, f) => Array.from({ length: n }, (_, c) => (f === c ? '1' : '0')));
}

function matrizATex(m: number[][]): string {
  return `\\begin{pmatrix} ${m.map((fila) => fila.join(' & ')).join(' \\\\ ')} \\end{pmatrix}`;
}

function vectorATex(v: number[]): string {
  return `\\begin{pmatrix} ${v.join(' \\\\ ')} \\end{pmatrix}`;
}

export default function PaginaCroutTeoria() {
  // Estado de la calculadora (sección 4)
  const [n, setN] = useState(3);
  const [matrizA, setMatrizA] = useState<string[][]>([
    ['2', '1', '1'],
    ['4', '1', '0'],
    ['-2', '2', '1'],
  ]);
  const [vectorB, setVectorB] = useState<string[]>(['3', '6', '1']);
  const [error, setError] = useState<string | null>(null);
  const [resultados, setResultados] = useState<any | null>(null);

  const cambiarDimension = (nuevoN: number) => {
    setN(nuevoN);
    setMatrizA((previa) => {
      const identidad = matrizIdentidadString(nuevoN);
      return identidad.map((fila, f) => fila.map((valor, c) => previa[f]?.[c] ?? valor));
    });
    setVectorB((previo) => Array.from({ length: nuevoN }, (_, i) => previo[i] ?? '0'));
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

    const A = matrizA.map((fila) => fila.map((val) => parseFloat(val)));
    const b = vectorB.map((val) => parseFloat(val));

    if (A.flat().some(isNaN) || b.some(isNaN)) {
      setError('Por favor, complete todos los campos con números válidos.');
      return;
    }

    const EPSILON = 1e-7;
    const deltas: number[] = [];
    for (let k = 1; k <= n; k++) {
      const submatriz = A.slice(0, k).map((fila) => fila.slice(0, k));
      deltas.push(determinante(submatriz));
    }

    if (deltas.some((d) => Math.abs(d) < EPSILON)) {
      setError('La matriz no cumple el teorema: los determinantes de sus submatrices principales deben ser distintos de cero para garantizar la factorización LU sin pivotaje.');
      setResultados({ deltas, falloTeorema: true });
      return;
    }

    const L: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
    const U: number[][] = Array.from({ length: n }, (_, i) => Array(n).fill(0).map((_, j) => (i === j ? 1 : 0)));

    for (let k = 0; k < n; k++) {
      for (let i = k; i < n; i++) {
        let suma = 0;
        for (let p = 0; p < k; p++) suma += L[i][p] * U[p][k];
        L[i][k] = A[i][k] - suma;
      }
      for (let j = k + 1; j < n; j++) {
        let suma = 0;
        for (let p = 0; p < k; p++) suma += L[k][p] * U[p][j];
        U[k][j] = (A[k][j] - suma) / L[k][k];
      }
    }

    const y = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let suma = 0;
      for (let j = 0; j < i; j++) suma += L[i][j] * y[j];
      y[i] = (b[i] - suma) / L[i][i];
    }

    const x = Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      let suma = 0;
      for (let j = i + 1; j < n; j++) suma += U[i][j] * x[j];
      x[i] = y[i] - suma;
    }

    const formatear = (num: number) => parseFloat(num.toFixed(4));

    setResultados({
      deltas: deltas.map(formatear),
      L: L.map((f) => f.map(formatear)),
      U: U.map((f) => f.map(formatear)),
      y: y.map(formatear),
      x: x.map(formatear),
      falloTeorema: false,
    });
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
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Conceptos previos</p>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <dt className="font-bold text-blue-300 text-sm mb-1">Matriz triangular</dt>
                    <dd className="text-sm text-slate-400 leading-relaxed">Matriz cuadrada en la que todos los elementos por encima (triangular inferior) o por debajo (triangular superior) de la diagonal principal son nulos.</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-blue-300 text-sm mb-1">Matriz diagonal</dt>
                    <dd className="text-sm text-slate-400 leading-relaxed">Es simultáneamente triangular superior e inferior: sólo tiene elementos no nulos en la diagonal principal.</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-blue-300 text-sm mb-1">Cierre bajo suma y producto</dt>
                    <dd className="text-sm text-slate-400 leading-relaxed">La suma y el producto de dos matrices triangulares de la misma estructura vuelven a dar una matriz con esa misma estructura.</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-blue-300 text-sm mb-1">Inversa</dt>
                    <dd className="text-sm text-slate-400 leading-relaxed">La inversa de una matriz triangular es otra matriz triangular de la misma estructura.</dd>
                  </div>
                  <div className="md:col-span-2">
                    <dt className="font-bold text-blue-300 text-sm mb-1">Determinante</dt>
                    <dd className="text-sm text-slate-400 leading-relaxed">El determinante de una matriz triangular es igual al producto de los elementos de su diagonal principal, lo que hace muy barato calcularlo una vez factorizada A.</dd>
                  </div>
                </dl>
              </div>

              {/* TEOREMA DE EXISTENCIA Y UNICIDAD */}
              <div className="bg-slate-800/60 border-l-4 border-emerald-500 rounded-r-xl p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-3">Teorema de existencia y unicidad</p>
                <p className="text-slate-300 leading-relaxed mb-4">
                  Toda matriz cuadrada <KaTeX expresionTex="\underline{\underline{A}}" /> cuyos menores principales son distintos de cero
                  puede expresarse como producto de dos matrices triangulares:
                </p>
                <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 shadow-inner p-4 overflow-x-auto">
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

              <div className="bg-slate-900/80 p-6 md:p-8 rounded-xl border border-slate-700/50 text-center shadow-inner overflow-x-auto">
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

              {/* FÓRMULA GENERAL */}
              <div className="bg-slate-800/60 border-l-4 border-blue-500 rounded-r-xl p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-3">Fórmula general, para n×n</p>
                <p className="text-slate-300 leading-relaxed mb-4">
                  Antes de bajar al caso concreto de 3×3 de la sección siguiente, así se ve el algoritmo de Crout para un sistema
                  de cualquier tamaño <KaTeX expresionTex="n" />. Primero la columna 1 de L y la fila 1 de U:
                </p>
                <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 shadow-inner p-4 overflow-x-auto mb-4">
                  <KaTeX expresionTex={String.raw`l_{i1} = a_{i1} \quad (i=1,\ldots,n) \qquad\qquad u_{1j} = \frac{a_{1j}}{l_{11}} \quad (j=2,\ldots,n)`} enBloque={true} />
                </div>
                <p className="text-slate-300 leading-relaxed mb-4">
                  Y luego, avanzando columna a columna (<KaTeX expresionTex="k = 2,\ldots,n" />), cada nueva entrada de L y de U descuenta lo que ya
                  aportaron las columnas anteriores:
                </p>
                <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 shadow-inner p-4 overflow-x-auto">
                  <KaTeX
                    expresionTex={String.raw`l_{ik} = a_{ik} - \sum_{p=1}^{k-1} l_{ip}\,u_{pk} \quad (i \geq k) \qquad\qquad u_{kj} = \frac{a_{kj} - \sum_{p=1}^{k-1} l_{kp}\,u_{pj}}{l_{kk}} \quad (j > k)`}
                    enBloque={true}
                  />
                </div>
              </div>
            </div>
            </RevelarAlEntrar>

            {/* SECCIÓN 2: INTERACTIVIDAD */}
            <RevelarAlEntrar>
            <div id="construccion" className="scroll-mt-28 bg-slate-800/50 rounded-2xl p-6 md:p-8 border border-slate-700 shadow-xl">
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide border-l-4 border-indigo-500 pl-4 mb-4 flex flex-wrap items-center gap-2">
                2. Construcción de Matrices <KaTeX expresionTex="(\underline{\underline{A}} = \underline{\underline{L}} \cdot \underline{\underline{U}})" />
              </h2>
              <p className="text-slate-300 leading-relaxed mb-8">
                Esto es la fórmula general de arriba, particularizada en <KaTeX expresionTex="n = 3" />. Cada una de las 9 ecuaciones
                sale de igualar una celda de A con el producto de una fila de L por una columna de U. Pase el cursor por una celda
                o ecuación para relacionarlas, y abra el <span className="text-blue-300 font-bold">desarrollo ▸</span> de cualquier
                fórmula para ver el producto original y el despeje que lleva a la fórmula de cálculo.
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
                  <ul className="mt-4 space-y-3 text-slate-300 font-mono text-sm bg-slate-900/50 p-4 rounded-lg">
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
                  <ul className="mt-4 space-y-3 text-slate-300 font-mono text-sm bg-slate-900/50 p-4 rounded-lg">
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
                            onChange={(e) => manejarCambioA(r, c, e.target.value)}
                            className={`${tamanioCelda} text-center bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono`}
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
                        onChange={(e) => manejarCambioB(r, e.target.value)}
                        className={`${tamanioCelda} text-center bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono`}
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

              {resultados && (
                <div className="bg-slate-900/40 rounded-2xl p-6 md:p-8 border border-slate-700/50 space-y-10 animar-aparicion">

                  <div>
                    <h3 className="text-xl font-bold text-white mb-6 border-l-4 border-blue-500 pl-4">Verificación del Teorema</h3>
                    <p className="text-slate-300 mb-4">Determinantes de las submatrices principales, para asegurar la existencia de L y U:</p>
                    <div className="flex flex-wrap gap-4">
                      {resultados.deltas.map((delta: number, indice: number) => (
                        <div key={indice} className="bg-slate-950/60 p-4 rounded-xl border border-slate-700/50 min-w-[130px] text-center">
                          <KaTeX expresionTex={`\\Delta_{${indice + 1}} = ${delta}`} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {!resultados.falloTeorema && (
                    <>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-6 border-l-4 border-indigo-500 pl-4">Matrices Factorizadas</h3>
                        <div className="flex flex-col md:flex-row gap-8 items-center justify-center bg-slate-950/40 p-8 rounded-2xl border border-slate-700/50 overflow-x-auto">
                          <div className="text-center">
                            <p className="text-xs font-black text-indigo-400 mb-4 uppercase tracking-widest">Matriz Inferior (L)</p>
                            <KaTeX expresionTex={matrizATex(resultados.L)} enBloque={true} />
                          </div>
                          <div className="text-2xl font-black text-slate-500">×</div>
                          <div className="text-center">
                            <p className="text-xs font-black text-emerald-400 mb-4 uppercase tracking-widest">Matriz Superior (U)</p>
                            <KaTeX expresionTex={matrizATex(resultados.U)} enBloque={true} />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <h3 className="text-lg font-bold text-white mb-4 border-l-4 border-purple-500 pl-4">Vector Intermedio (y)</h3>
                          <p className="text-sm text-slate-400 mb-4">Solución descendente de <KaTeX expresionTex="\underline{\underline{L}}\cdot\vec{y} = \vec{b}" /></p>
                          <div className="bg-slate-950/60 p-6 rounded-xl border border-slate-700/50 flex justify-center overflow-x-auto">
                            <KaTeX expresionTex={`\\vec{y} = ${vectorATex(resultados.y)}`} enBloque={true} />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white mb-4 border-l-4 border-emerald-500 pl-4">Vector Solución (x)</h3>
                          <p className="text-sm text-slate-400 mb-4">Solución ascendente de <KaTeX expresionTex="\underline{\underline{U}}\cdot\vec{x} = \vec{y}" /></p>
                          <div className="bg-slate-950/60 p-6 rounded-xl border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)] flex justify-center overflow-x-auto">
                            <KaTeX expresionTex={`\\vec{x} = ${vectorATex(resultados.x)}`} enBloque={true} />
                          </div>
                        </div>
                      </div>
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
