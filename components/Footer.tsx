'use client';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-700/50 bg-slate-900/50 backdrop-blur mt-20">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-slate-500 text-sm">
            © {currentYear} Análisis Numérico - Buscaglia, Coria, Geffroy, Garrote.
          </p>
        </div>
      </div>
    </footer>
  );
}
