import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Análisis Numérico - Proyectos',
  description: 'Landing page de proyectos para la materia Análisis Numérico',
  keywords: 'análisis numérico, proyectos, matemáticas',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
