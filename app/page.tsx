'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProjectCard from '@/components/ProjectCard';

const projects = [
  {
    title: 'Calculadora de Fourier',
    description: 'Herramienta interactiva para calcular series de Fourier, transformada discreta de Fourier y análisis de frecuencias. Visualización de componentes armónicos.',
    icon: '≈',
    link: '/fourier',
    tags: ['FFT', 'Series', 'Frecuencia'],
  },
];

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="flex-1 max-w-6xl mx-auto px-4 py-20 sm:px-6 lg:px-8 w-full">
        <div className="text-center mb-20">
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 gradient-text leading-tight">
            Análisis Numérico
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Una colección de proyectos y herramientas interactivas para explorar métodos numéricos,
            desde resolución de ecuaciones hasta optimización avanzada.
          </p>
        </div>

        {/* Projects Grid */}
        <section id="proyectos" className="mb-20">
          <h2 className="text-4xl font-bold mb-12 text-center text-white">
            Proyectos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.title} {...project} />
            ))}
          </div>
        </section>

        {/* Members Section */}
        <section id="integrantes" className="bg-slate-800/30 backdrop-blur rounded-lg p-12 border border-slate-700/50 mb-8">
          <h2 className="text-4xl font-bold mb-12 text-white text-center">Integrantes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Member 1 */}
            <div className="bg-slate-700/30 rounded-lg p-6 border border-slate-600/50">
              <h3 className="text-lg font-bold text-white mb-2">Mateo Arturo Geffroy</h3>
              <p className="text-slate-400 text-sm mb-1"><span className="text-blue-400 font-semibold">Legajo:</span> 32.027</p>
              <p className="text-slate-400 text-sm"><span className="text-blue-400 font-semibold">Email:</span> mateogeffroy@gmail.com</p>
            </div>
            {/* Member 2 */}
            <div className="bg-slate-700/30 rounded-lg p-6 border border-slate-600/50">
              <h3 className="text-lg font-bold text-white mb-2">Francisco Nicolas Buscaglia</h3>
              <p className="text-slate-400 text-sm mb-1"><span className="text-blue-400 font-semibold">Legajo:</span> 32.308</p>
              <p className="text-slate-400 text-sm"><span className="text-blue-400 font-semibold">Email:</span> francisconicolasbuscaglia@alu.frlp.utn.edu.ar</p>
            </div>
            {/* Member 3 */}
            <div className="bg-slate-700/30 rounded-lg p-6 border border-slate-600/50">
              <h3 className="text-lg font-bold text-white mb-2">Geronimo Garrote</h3>
              <p className="text-slate-400 text-sm mb-1"><span className="text-blue-400 font-semibold">Legajo:</span> 33.277</p>
              <p className="text-slate-400 text-sm"><span className="text-blue-400 font-semibold">Email:</span> garrote.gero@gmail.com</p>
            </div>
            {/* Member 4 */}
            <div className="bg-slate-700/30 rounded-lg p-6 border border-slate-600/50">
              <h3 className="text-lg font-bold text-white mb-2">Nicolás Martín Coria</h3>
              <p className="text-slate-400 text-sm mb-1"><span className="text-blue-400 font-semibold">Legajo:</span> 32635</p>
              <p className="text-slate-400 text-sm"><span className="text-blue-400 font-semibold">Email:</span> nicolasmartincoria@alu.frlp.utn.edu.ar</p>
            </div>
          </div>
        </section>
      </section>

      <Footer />
    </main>
  );
}
