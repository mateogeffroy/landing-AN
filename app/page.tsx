'use client';

import Header from '@/src/components/Header';
import Footer from '@/src/components/Footer';
import ProjectCard from '@/src/components/ProjectCard';

const projects = [
  {
    title: 'Calculadora de Fourier',
    description: 'Herramienta interactiva para calcular series de Fourier con ejercicio precargados o la posibilidad de poder cargar tus propias funciones, sean simples o a trozos. Visualización de componentes armónicos en tiempo real.',
    icon: '≈',
    link: '/fourier',
    tags: ['Recharts', 'mathjs', 'html2canvas'],
  },
];

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-[#0f172a]">
      <Header />

      {/* 1. HERO SECTION (Centrado verticalmente y separado del header) */}
      <section className="flex flex-col justify-center items-center text-center px-4 pt-40 pb-20 min-h-[65vh] w-full max-w-5xl mx-auto">
        {/* Título más proporcionado y con mejor distribución de líneas */}
        <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold mb-6 gradient-text leading-tight max-w-4xl text-balance">
          Portfolio de trabajos de Análisis Numérico
        </h1>
        
        <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
          Una colección de proyectos de los trabajos prácticos opcionales de la materia Análisis Numérico.
        </p>

        {/* Botón de GitHub */}
        <a
          href="https://github.com/mateogeffroy/landing-AN"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-6 py-3.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-600 rounded-xl text-white font-semibold transition-all shadow-lg active:scale-95"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          Ver Código en GitHub
        </a>
      </section>

      {/* 2. PROJECTS GRID */}
      <section id="proyectos" className="px-4 max-w-6xl mx-auto w-full mb-24">
        <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center text-white tracking-wide">
          Proyectos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.title} {...project} />
          ))}
        </div>
      </section>

      {/* 3. MEMBERS SECTION (Espaciado inferior corregido) */}
      <section id="integrantes" className="px-4 max-w-6xl mx-auto w-full mb-12 flex-1">
        <div className="bg-slate-800/30 backdrop-blur rounded-2xl p-8 md:p-12 border border-slate-700/50 shadow-xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-white text-center tracking-wide">Integrantes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Member 1 */}
            <div className="bg-slate-800/80 hover:bg-slate-800 rounded-xl p-6 border border-slate-700 transition-colors shadow-inner">
              <h3 className="text-lg font-bold text-white mb-2">Mateo Arturo Geffroy</h3>
              <p className="text-slate-400 text-sm mb-1"><span className="text-blue-400 font-semibold">Legajo:</span> 32.027</p>
              <p className="text-slate-400 text-sm"><span className="text-blue-400 font-semibold">Email:</span> mateogeffroy@gmail.com</p>
            </div>
            {/* Member 2 */}
            <div className="bg-slate-800/80 hover:bg-slate-800 rounded-xl p-6 border border-slate-700 transition-colors shadow-inner">
              <h3 className="text-lg font-bold text-white mb-2">Francisco Nicolas Buscaglia</h3>
              <p className="text-slate-400 text-sm mb-1"><span className="text-blue-400 font-semibold">Legajo:</span> 32.308</p>
              <p className="text-slate-400 text-sm"><span className="text-blue-400 font-semibold">Email:</span> francisconicolasbuscaglia@alu.frlp.utn.edu.ar</p>
            </div>
            {/* Member 3 */}
            <div className="bg-slate-800/80 hover:bg-slate-800 rounded-xl p-6 border border-slate-700 transition-colors shadow-inner">
              <h3 className="text-lg font-bold text-white mb-2">Geronimo Garrote</h3>
              <p className="text-slate-400 text-sm mb-1"><span className="text-blue-400 font-semibold">Legajo:</span> 33.277</p>
              <p className="text-slate-400 text-sm"><span className="text-blue-400 font-semibold">Email:</span> garrote.gero@gmail.com</p>
            </div>
            {/* Member 4 */}
            <div className="bg-slate-800/80 hover:bg-slate-800 rounded-xl p-6 border border-slate-700 transition-colors shadow-inner">
              <h3 className="text-lg font-bold text-white mb-2">Nicolás Martín Coria</h3>
              <p className="text-slate-400 text-sm mb-1"><span className="text-blue-400 font-semibold">Legajo:</span> 32635</p>
              <p className="text-slate-400 text-sm"><span className="text-blue-400 font-semibold">Email:</span> nicolasmartincoria@alu.frlp.utn.edu.ar</p>
            </div>
            
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}