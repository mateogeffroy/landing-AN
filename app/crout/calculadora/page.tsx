'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/src/components/Header';
import Footer from '@/src/components/Footer';
import KaTeX from '@/src/components/KaTeX';

export default function CalculadoraCrout() {
  // Estado para la matriz A (3x3) y el vector b (3x1)
  const [matrizA, setMatrizA] = useState<string[][]>([
    ['2', '1', '1'],
    ['4', '1', '0'],
    ['-2', '2', '1'],
  ]);
  const [vectorB, setVectorB] = useState<string[]>(['3', '6', '1']);
  
  const [error, setError] = useState<string | null>(null);
  const [resultados, setResultados] = useState<any | null>(null);

  const manejarCambioA = (f: number, c: number, valor: string) => {
    const nuevaMatriz = [...matrizA];
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

    // Convertir a números
    const A = matrizA.map(fila => fila.map(val => parseFloat(val)));
    const b = vectorB.map(val => parseFloat(val));

    // Validar entradas
    if (A.flat().some(isNaN) || b.some(isNaN)) {
      setError('Por favor, complete todos los campos con números válidos.');
      return;
    }

    // 1. Verificación del Teorema (Determinantes principales no nulos)
    const delta1 = A[0][0];
    const delta2 = (A[0][0] * A[1][1]) - (A[0][1] * A[1][0]);
    const delta3 = 
      A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) -
      A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) +
      A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);

    // Umbral para evitar problemas de coma flotante
    const EPSILON = 1e-7;

    if (Math.abs(delta1) < EPSILON || Math.abs(delta2) < EPSILON || Math.abs(delta3) < EPSILON) {
      setError('La matriz no cumple el teorema: los determinantes de sus submatrices principales deben ser distintos de cero para garantizar la factorización LU sin pivotaje.');
      setResultados({ delta1, delta2, delta3, falloTeorema: true });
      return;
    }

    // 2. Factorización Crout
    const L = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    const U = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

    // Paso 1: Primera columna de L
    L[0][0] = A[0][0];
    L[1][0] = A[1][0];
    L[2][0] = A[2][0];

    // Paso 2: Primera fila de U
    U[0][1] = A[0][1] / L[0][0];
    U[0][2] = A[0][2] / L[0][0];

    // Paso 3: Segunda columna de L
    L[1][1] = A[1][1] - L[1][0] * U[0][1];
    L[2][1] = A[2][1] - L[2][0] * U[0][1];

    // Paso 4: Segunda fila de U
    U[1][2] = (A[1][2] - L[1][0] * U[0][2]) / L[1][1];

    // Paso 5: Tercera columna de L
    L[2][2] = A[2][2] - L[2][0] * U[0][2] - L[2][1] * U[1][2];

    // 3. Sistema L*y = b (Solución descendente)
    const y = [0, 0, 0];
    y[0] = b[0] / L[0][0];
    y[1] = (b[1] - L[1][0] * y[0]) / L[1][1];
    y[2] = (b[2] - L[2][0] * y[0] - L[2][1] * y[1]) / L[2][2];

    // 4. Sistema U*x = y (Solución ascendente)
    const x = [0, 0, 0];
    x[2] = y[2];
    x[1] = y[1] - U[1][2] * x[2];
    x[0] = y[0] - U[0][1] * x[1] - U[0][2] * x[2];

    // Guardamos resultados formateando a 4 decimales para visualización
    const formatear = (num: number) => parseFloat(num.toFixed(4));
    
    setResultados({
      delta1: formatear(delta1),
      delta2: formatear(delta2),
      delta3: formatear(delta3),
      L: L.map(f => f.map(formatear)),
      U: U.map(f => f.map(formatear)),
      y: y.map(formatear),
      x: x.map(formatear),
      falloTeorema: false
    });
  };

  return (
    <main className="min-h-screen flex flex-col bg-[#0f172a]">
      <Header />
      
      <section className="flex-1 max-w-5xl mx-auto px-4 py-24 w-full space-y-12">
        {/* ENCABEZADO */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold mb-6 text-white leading-tight">
            Calculadora Interactiva <span className="text-emerald-400">Crout</span>
          </h1>
          <div className="flex justify-center gap-4 mt-8">
            <Link href="/crout" className="px-6 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl border border-slate-700 hover:bg-slate-700 transition-colors">
              📚 Volver a la Teoría
            </Link>
            <button className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg ring-2 ring-emerald-400/50 cursor-default">
              🔢 Calculadora
            </button>
          </div>
        </div>

        {/* ÁREA DE ENTRADA */}
        <div className="bg-slate-800/50 rounded-3xl p-8 border border-slate-700 shadow-2xl flex flex-col md:flex-row items-center justify-center gap-10">
          
          <div className="flex flex-col items-center">
            <p className="text-xs font-black text-blue-400 mb-4 uppercase tracking-widest">Matriz de Coeficientes (A)</p>
            <div className="grid grid-rows-3 gap-2 border-l-2 border-r-2 border-slate-500 p-3 rounded-lg bg-slate-900/50">
              {matrizA.map((fila, r) => (
                <div key={r} className="grid grid-cols-3 gap-2">
                  {fila.map((valor, c) => (
                    <input
                      key={c}
                      type="number"
                      value={valor}
                      onChange={(e) => manejarCambioA(r, c, e.target.value)}
                      className="w-16 h-12 text-center bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="text-3xl font-black text-slate-500">· <KaTeX expresionTex="\vec{x} =" /></div>

          <div className="flex flex-col items-center">
            <p className="text-xs font-black text-emerald-400 mb-4 uppercase tracking-widest">Términos Indep. (b)</p>
            <div className="grid grid-rows-3 gap-2 border-l-2 border-r-2 border-slate-500 p-3 rounded-lg bg-slate-900/50">
              {vectorB.map((valor, r) => (
                <input
                  key={r}
                  type="number"
                  value={valor}
                  onChange={(e) => manejarCambioB(r, e.target.value)}
                  className="w-16 h-12 text-center bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button 
            onClick={resolverSistema}
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 text-lg"
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

        {/* ÁREA DE RESULTADOS */}
        {resultados && (
          <div className="bg-slate-800/50 rounded-3xl p-8 border border-slate-700 shadow-2xl space-y-10 animate-in fade-in duration-500">
            
            {/* 1. Validación Matemática */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 border-l-4 border-blue-500 pl-4">1. Verificación del Teorema</h2>
              <p className="text-slate-300 mb-4">Calculamos los determinantes de las submatrices principales para asegurar la existencia de L y U[cite: 4]:</p>
              <div className="flex flex-wrap gap-6">
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/50 min-w-[150px] text-center">
                  <KaTeX expresionTex={`\\Delta_1 = ${resultados.delta1}`} />
                </div>
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/50 min-w-[150px] text-center">
                  <KaTeX expresionTex={`\\Delta_2 = ${resultados.delta2}`} />
                </div>
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/50 min-w-[150px] text-center">
                  <KaTeX expresionTex={`\\Delta_3 = ${resultados.delta3}`} />
                </div>
              </div>
            </div>

            {!resultados.falloTeorema && (
              <>
                {/* 2. Matrices L y U */}
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6 border-l-4 border-indigo-500 pl-4">2. Matrices Factorizadas</h2>
                  <div className="flex flex-col md:flex-row gap-8 items-center justify-center bg-slate-900/50 p-8 rounded-2xl border border-slate-700/50">
                    <div className="text-center">
                      <p className="text-xs font-black text-indigo-400 mb-4 uppercase tracking-widest">Matriz Inferior (L)</p>
                      <KaTeX 
                        expresionTex={`\\begin{pmatrix} ${resultados.L[0].join(' & ')} \\\\ ${resultados.L[1].join(' & ')} \\\\ ${resultados.L[2].join(' & ')} \\end{pmatrix}`} 
                        enBloque={true} 
                      />
                    </div>
                    <div className="text-2xl font-black text-slate-500">×</div>
                    <div className="text-center">
                      <p className="text-xs font-black text-emerald-400 mb-4 uppercase tracking-widest">Matriz Superior (U)</p>
                      <KaTeX 
                        expresionTex={`\\begin{pmatrix} ${resultados.U[0].join(' & ')} \\\\ ${resultados.U[1].join(' & ')} \\\\ ${resultados.U[2].join(' & ')} \\end{pmatrix}`} 
                        enBloque={true} 
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Resolución final */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-4 border-l-4 border-purple-500 pl-4">3. Vector Intermedio (y)</h2>
                    <p className="text-sm text-slate-400 mb-4">Solución descendente de <KaTeX expresionTex="\underline{\underline{L}}\cdot\vec{y} = \vec{b}" /></p>
                    <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-700/50 flex justify-center">
                      <KaTeX 
                        expresionTex={`\\vec{y} = \\begin{pmatrix} ${resultados.y[0]} \\\\ ${resultados.y[1]} \\\\ ${resultados.y[2]} \\end{pmatrix}`} 
                        enBloque={true} 
                      />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white mb-4 border-l-4 border-emerald-500 pl-4">4. Vector Solución (x)</h2>
                    <p className="text-sm text-slate-400 mb-4">Solución ascendente de <KaTeX expresionTex="\underline{\underline{U}}\cdot\vec{x} = \vec{y}" /></p>
                    <div className="bg-slate-900/80 p-6 rounded-xl border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)] flex justify-center">
                      <KaTeX 
                        expresionTex={`\\vec{x} = \\begin{pmatrix} ${resultados.x[0]} \\\\ ${resultados.x[1]} \\\\ ${resultados.x[2]} \\end{pmatrix}`} 
                        enBloque={true} 
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>
        )}
      </section>
      
      <Footer />
    </main>
  );
}