import type { Metadata } from 'next';
import { Literata } from 'next/font/google';
import DesplazamientoSuave from '@/src/components/DesplazamientoSuave';
import './globals.css';

// Literata: serif diseñada para lectura extensa (libros y ebooks).
// Es la base tipográfica de todo el sitio, buscando la impronta de un libro de matemática.
const literata = Literata({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-libro',
  display: 'swap',
});

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
    <html lang="es" className={literata.variable}>
      <body className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white min-h-screen font-serif">
        <DesplazamientoSuave />
        {children}
      </body>
    </html>
  );
}
