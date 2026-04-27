'use client';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur border-b border-slate-700/50 bg-slate-900/50">
      <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <a href="/">
            <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold gradient-text">∑</div>
                <h1 className="text-xl font-bold text-white">Análisis Numérico</h1>
            </div>
          </a>
          <nav className="hidden md:flex space-x-8">
            <a
              href="#proyectos"
              className="text-slate-300 hover:text-blue-400 transition"
            >
              Proyectos
            </a>
            <a
              href="#integrantes"
              className="text-slate-300 hover:text-blue-400 transition"
            >
              Integrantes
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
