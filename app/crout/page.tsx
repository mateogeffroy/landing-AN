'use client';

import Link from 'next/link';
import Header from '@/src/components/Header';
import Footer from '@/src/components/Footer';
import KaTeX from '@/src/components/KaTeX';
import FactorizacionInteractiva from '@/src/components/FactorizacionInteractiva';

export default function PaginaCroutTeoria() {
  return (
    <main className="min-h-screen flex flex-col bg-[#0f172a]">
      <Header />
      
      <section className="flex-1 max-w-6xl mx-auto px-4 py-24 w-full space-y-12">
        
        {/* ENCABEZADO Y NAVEGACIÓN */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-[3.5rem] font-extrabold mb-6 bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 text-transparent bg-clip-text leading-tight">
            Método Directo de Crout (L*U)
          </h1>
          
          <div className="flex justify-center gap-4 mt-8">
            <button className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg ring-2 ring-blue-400/50 cursor-default">
              📚 Teoría y Algoritmo
            </button>
            <Link href="/crout/calculadora" className="px-6 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl border border-slate-700 hover:bg-slate-700 transition-colors">
              🔢 Calculadora Interactiva
            </Link>
          </div>
        </div>

        {/* SECCIÓN 1: FUNDAMENTOS MATEMÁTICOS */}
        <div className="bg-slate-800/50 rounded-3xl p-8 md:p-10 border border-slate-700 shadow-2xl space-y-6">
          <h2 className="text-3xl font-bold text-white tracking-wide border-l-4 border-blue-500 pl-5">
            1. Fundamentos Matemáticos
          </h2>
          <p className="text-lg text-slate-300 leading-relaxed">
            El método de Crout transforma el problema complejo de resolver <KaTeX expresionTex="\underline{\underline{A}} \cdot \vec{x} = \vec{b}" /> en la resolución escalonada de dos sistemas triangulares más simples[cite: 4]. Para ello, factorizamos la matriz original cuadrada expresándola como el producto de una matriz triangular inferior <KaTeX expresionTex="\underline{\underline{L}}" /> y una matriz triangular superior <KaTeX expresionTex="\underline{\underline{U}}" />[cite: 4].
          </p>
          
          <div className="bg-slate-900/60 p-6 border border-slate-700/50 rounded-xl my-6">
            <p className="text-slate-300 leading-relaxed mb-4">
              Al multiplicar genéricamente estas matrices de tamaño <KaTeX expresionTex="n \times n" />, se generan <KaTeX expresionTex="n^2" /> ecuaciones, pero entre ambas matrices triangulares suman <KaTeX expresionTex="n^2 + n" /> incógnitas. Como existen <KaTeX expresionTex="n" /> incógnitas más que ecuaciones, el sistema carece de solución única[cite: 4]. 
            </p>
            <p className="text-slate-300 leading-relaxed font-medium text-blue-200">
              Para resolver esta discrepancia y asegurar que la factorización sea única, el método de Crout exige fijar de antemano los <KaTeX expresionTex="n" /> elementos de la diagonal principal de <KaTeX expresionTex="\underline{\underline{U}}" /> haciéndolos iguales a la unidad (1)[cite: 4]. Así, el sistema se reduce a la misma cantidad de ecuaciones e incógnitas:
            </p>
          </div>
          
          <div className="bg-slate-900/80 p-8 rounded-2xl border border-slate-700/50 text-center shadow-inner overflow-x-auto">
            <KaTeX expresionTex="\underline{\underline{A}} = \underline{\underline{L}} \cdot \underline{\underline{U}}" enBloque={true} />
            
            {/* Matrices renderizadas más juntas usando Flexbox */}
            <div className="mt-8 flex flex-col xl:flex-row items-center justify-center gap-6">
              <KaTeX expresionTex={String.raw`\begin{pmatrix} a_{11} & a_{12} & a_{13} \\ a_{21} & a_{22} & a_{23} \\ a_{31} & a_{32} & a_{33} \end{pmatrix}`} enBloque={true} />
              
              <div className="text-4xl text-slate-500 font-black">=</div>
              
              <div className="flex flex-col md:flex-row items-center gap-6">
                <KaTeX expresionTex={String.raw`\begin{pmatrix} l_{11} & 0 & 0 \\ l_{21} & l_{22} & 0 \\ l_{31} & l_{32} & l_{33} \end{pmatrix}`} enBloque={true} />
                <span className="text-3xl text-slate-500 font-black">×</span>
                <KaTeX expresionTex={String.raw`\begin{pmatrix} 1 & u_{12} & u_{13} \\ 0 & 1 & u_{23} \\ 0 & 0 & 1 \end{pmatrix}`} enBloque={true} />
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: INTERACTIVIDAD */}
        <div className="bg-slate-800/50 rounded-3xl p-8 md:p-10 border border-slate-700 shadow-2xl">
          <h2 className="text-3xl font-bold text-white tracking-wide border-l-4 border-indigo-500 pl-5 mb-8 flex flex-wrap items-center gap-2">
            2. Construcción de Matrices <KaTeX expresionTex="(\underline{\underline{A}} = \underline{\underline{L}} \cdot \underline{\underline{U}})" />
          </h2>
          <FactorizacionInteractiva />
        </div>

        {/* SECCIÓN 3: RESOLUCIÓN DEL SISTEMA */}
        <div className="bg-slate-800/50 rounded-3xl p-8 md:p-10 border border-slate-700 shadow-2xl space-y-8">
          <h2 className="text-3xl font-bold text-white tracking-wide border-l-4 border-emerald-500 pl-5 flex flex-wrap items-center gap-2">
            3. Resolución del Sistema <KaTeX expresionTex="\vec{x}" />
          </h2>
          <p className="text-lg text-slate-300 leading-relaxed">
            Con las matrices <KaTeX expresionTex="\underline{\underline{L}}" /> y <KaTeX expresionTex="\underline{\underline{U}}" /> ya calculadas, sustituimos en la ecuación original <KaTeX expresionTex="\underline{\underline{A}} \cdot \vec{x} = \vec{b}" /> para obtener <KaTeX expresionTex="\underline{\underline{L}} \cdot (\underline{\underline{U}} \cdot \vec{x}) = \vec{b}" />. Esto nos permite definir un vector intermedio <KaTeX expresionTex="\vec{y}" /> y dividir el problema[cite: 4].
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
            <div className="bg-slate-900/60 p-8 rounded-2xl border border-slate-700/50 shadow-lg">
              <h3 className="text-xl font-bold text-emerald-400 mb-6 text-center">Fase 1: Solución Descendente</h3>
              <div className="bg-black/30 p-6 rounded-xl mb-6">
                <KaTeX expresionTex="\underline{\underline{L}} \cdot \vec{y} = \vec{b}" enBloque={true} />
              </div>
              <p className="text-slate-400">
                Al ser <KaTeX expresionTex="\underline{\underline{L}}" /> triangular inferior, se resuelve despejando desde arriba hacia abajo[cite: 4]:
              </p>
              <ul className="mt-4 space-y-3 text-slate-300 font-mono text-sm bg-slate-800/50 p-4 rounded-lg">
                <li><KaTeX expresionTex="y_1 = \frac{b_1}{l_{11}}" /></li>
                <li><KaTeX expresionTex="y_2 = \frac{b_2 - l_{21}y_1}{l_{22}}" /></li>
                <li><KaTeX expresionTex="y_3 = \frac{b_3 - l_{31}y_1 - l_{32}y_2}{l_{33}}" /></li>
              </ul>
            </div>
            
            <div className="bg-slate-900/60 p-8 rounded-2xl border border-slate-700/50 shadow-lg">
              <h3 className="text-xl font-bold text-emerald-400 mb-6 text-center">Fase 2: Solución Ascendente</h3>
              <div className="bg-black/30 p-6 rounded-xl mb-6">
                <KaTeX expresionTex="\underline{\underline{U}} \cdot \vec{x} = \vec{y}" enBloque={true} />
              </div>
              <p className="text-slate-400">
                Con <KaTeX expresionTex="\vec{y}" /> conocido, y siendo <KaTeX expresionTex="\underline{\underline{U}}" /> triangular superior, resolvemos desde abajo hacia arriba[cite: 4]:
              </p>
              <ul className="mt-4 space-y-3 text-slate-300 font-mono text-sm bg-slate-800/50 p-4 rounded-lg">
                <li><KaTeX expresionTex="x_3 = y_3" /></li>
                <li><KaTeX expresionTex="x_2 = y_2 - u_{23}x_3" /></li>
                <li><KaTeX expresionTex="x_1 = y_1 - u_{12}x_2 - u_{13}x_3" /></li>
              </ul>
            </div>
          </div>
        </div>

      </section>
      <Footer />
    </main>
  );
}