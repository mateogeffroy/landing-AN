'use client';

import { useMemo, useState } from 'react';
import Header from '@/src/components/Header';
import Footer from '@/src/components/Footer';
import KaTeX from '@/src/components/KaTeX';
import RevelarAlEntrar from '@/src/components/RevelarAlEntrar';
import GlifoMatriz from '@/src/components/GlifoMatriz';
import {
  GraficoAjuste,
  GraficoResiduos,
  GraficoComparacion,
  GraficoBarrasAgrupadas,
  GraficoBarrasSimples,
} from '@/src/components/GraficosAjuste';
import { desplazarHaciaAncla } from '@/src/lib/lenis';
import { CLUSTERES } from '@/src/lib/datosCaso2';
import {
  ajustarTodos,
  ajustarExponencial,
  ajustarLineal,
  formatearNumero,
  tiempoDeDuplicacion,
  type Ajuste,
  type ClaveModelo,
} from '@/src/lib/minimosCuadrados';

const PATRON_NUBE = [
  [false, false, true],
  [false, true, false],
  [true, false, false],
];
const PATRON_TEORIA = [
  [true, true, true],
  [false, true, false],
  [false, true, false],
];
const PATRON_ANALISIS = [
  [true, false, false],
  [true, true, false],
  [true, true, true],
];
const PATRON_COMPARACION = [
  [true, false, true],
  [true, false, true],
  [true, false, true],
];
const PATRON_CONCLUSION = [
  [true, true, true],
  [true, true, true],
  [true, true, true],
];

// La guía sigue el orden real del scroll: cada sección y, debajo, las consignas
// que se resuelven dentro de ella. Las consignas van como sub-ítems para no
// competir visualmente con los títulos de sección.
type ItemGuia =
  | { tipo: 'seccion'; href: string; label: string; patron: boolean[][] }
  | { tipo: 'consigna'; href: string; label: string; numero: string };

const navegacion: ItemGuia[] = [
  { tipo: 'seccion', href: '#caso', label: '1. El caso', patron: PATRON_NUBE },
  { tipo: 'consigna', href: '#consigna-1', numero: '1', label: 'Graficar clústeres' },
  { tipo: 'seccion', href: '#teoria', label: '2. Teoría', patron: PATRON_TEORIA },
  { tipo: 'seccion', href: '#analisis', label: '3. Análisis', patron: PATRON_ANALISIS },
  { tipo: 'consigna', href: '#consigna-2', numero: '2', label: 'Elegir modelo' },
  { tipo: 'consigna', href: '#consigna-3', numero: '3', label: 'Ajustar y obtener parámetros' },
  { tipo: 'consigna', href: '#consigna-4', numero: '4', label: 'r² y residuos' },
  { tipo: 'seccion', href: '#comparacion', label: '4. Comparación', patron: PATRON_COMPARACION },
  { tipo: 'consigna', href: '#consigna-5', numero: '5', label: 'Comparar y concluir' },
  { tipo: 'seccion', href: '#conclusion', label: '5. Conclusión', patron: PATRON_CONCLUSION },
];

const MODELOS_TEORIA = [
  {
    nombre: 'Lineal',
    forma: 'y = a_1 + a_2 \\, x',
    linealizacion: '—  (ya es lineal en los coeficientes)',
    incognitas: 'a_1, \\; a_2',
  },
  {
    nombre: 'Polinómico de grado k',
    forma: 'y = a_1 + a_2 x + \\ldots + a_{k+1} x^{k}',
    linealizacion: '—  (lineal en los coeficientes)',
    incognitas: 'a_1, \\ldots, a_{k+1}',
  },
  {
    nombre: 'Exponencial',
    forma: 'y = a \\cdot e^{b x}',
    linealizacion: '\\ln(y) = \\ln(a) + b \\, x',
    incognitas: '\\ln(a), \\; b',
  },
  {
    nombre: 'Potencial',
    forma: 'y = a \\cdot x^{b}',
    linealizacion: '\\ln(y) = \\ln(a) + b \\, \\ln(x)',
    incognitas: '\\ln(a), \\; b',
  },
  {
    nombre: 'Cociente',
    forma: 'y = a \\cdot \\dfrac{x}{b + x}',
    linealizacion: '\\dfrac{1}{y} = \\dfrac{1}{a} + \\dfrac{b}{a} \\cdot \\dfrac{1}{x}',
    incognitas: '\\tfrac{1}{a}, \\; \\tfrac{b}{a}',
  },
];

// Las tres formas de calcular ST y SR según el apunte de cátedra (página 8):
// siempre sobre la variable que el sistema normal minimizó realmente.
const CASOS_BONDAD = [
  {
    clave: 'directo' as const,
    titulo: 'Caso directo',
    modelos: 'Lineal · Polinómicos',
    variable: 'y',
    media: String.raw`\bar{y} = \frac{1}{n}\sum_{i=1}^{n} y_i`,
    st: String.raw`ST = \sum_{i=1}^{n} \left( y_i - \bar{y} \right)^2`,
    sr: String.raw`SR = \sum_{i=1}^{n} \left( y_i - y_{ajuste} \right)^2`,
    nota: 'Estos modelos son lineales respecto de sus coeficientes, así que el error se minimizó sobre la propia variable medida.',
  },
  {
    clave: 'logaritmico' as const,
    titulo: 'Caso logarítmico',
    modelos: 'Exponencial · Potencial',
    variable: '\\ln(y)',
    media: String.raw`\bar{y} = \frac{1}{n}\sum_{i=1}^{n} \ln(y_i)`,
    st: String.raw`ST = \sum_{i=1}^{n} \left( \ln(y_i) - \bar{y} \right)^2`,
    sr: String.raw`SR = \sum_{i=1}^{n} \left( \ln(y_i) - y_{ajuste} \right)^2`,
    nota: 'Al linealizar con logaritmo, lo que se minimizó fueron las diferencias en ln(y). Calcular r² sobre y daría un número que no corresponde al ajuste que realmente se hizo.',
  },
  {
    clave: 'inverso' as const,
    titulo: 'Caso inverso',
    modelos: 'Cociente',
    variable: '1/y',
    media: String.raw`\bar{y} = \frac{1}{n}\sum_{i=1}^{n} \frac{1}{y_i}`,
    st: String.raw`ST = \sum_{i=1}^{n} \left( \frac{1}{y_i} - \bar{y} \right)^2`,
    sr: String.raw`SR = \sum_{i=1}^{n} \left( \frac{1}{y_i} - y_{ajuste} \right)^2`,
    nota: 'La linealización del cociente invierte ambos miembros, de modo que el ajuste se hizo sobre 1/y y ahí es donde se mide su calidad.',
  },
];

// Colores por modelo para el gráfico de barras comparativo. Se mantienen fijos
// para que cada modelo se identifique igual en todos los clústeres.
const SERIES_MODELOS: { clave: ClaveModelo; nombre: string; color: string }[] = [
  { clave: 'lineal', nombre: 'Lineal', color: '#3b82f6' },
  { clave: 'exponencial', nombre: 'Exponencial', color: '#f59e0b' },
  { clave: 'potencial', nombre: 'Potencial', color: '#10b981' },
  { clave: 'polinomico2', nombre: 'Polinómico (2º)', color: '#ef4444' },
  { clave: 'cociente', nombre: 'Cociente', color: '#a855f7' },
];

// "Escherichia coli" -> "E. coli": los ticks del eje X no tienen lugar para el nombre completo.
const nombreCorto = (nombre: string) => {
  const [genero, ...resto] = nombre.split(' ');
  return resto.length ? `${genero[0]}. ${resto.join(' ')}` : nombre;
};

const numeroLargo = (valor: number, decimales = 0) =>
  valor.toLocaleString('es-AR', { maximumFractionDigits: decimales, minimumFractionDigits: decimales });

// Selector de clúster reutilizable. La grilla es de 2 o de 4 columnas, nunca de 3:
// con cuatro especies, tres arriba y una suelta abajo queda desbalanceado.
function SelectorClusteres({
  seleccionado,
  alSeleccionar,
}: {
  seleccionado: string;
  alSeleccionar: (codigo: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
      {CLUSTERES.map((c) => {
        const activo = c.codigo === seleccionado;
        return (
          <button
            key={c.codigo}
            onClick={() => alSeleccionar(c.codigo)}
            aria-pressed={activo}
            className={`px-3 py-2.5 rounded-lg border text-left transition-all ${
              activo
                ? 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 shadow-md'
                : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
            style={activo ? { borderColor: c.color } : undefined}
          >
            <span
              className={`block text-sm font-bold italic leading-tight ${
                activo ? '' : 'text-slate-600 dark:text-slate-400'
              }`}
              style={activo ? { color: c.color } : undefined}
            >
              {c.nombre}
            </span>
            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-500 mt-0.5">
              {c.temperatura} °C
            </span>
          </button>
        );
      })}
    </div>
  );
}

const TIEMPO_EXTRAPOLACION = 600; // el doble del intervalo observado

export default function PaginaMinimosCuadrados() {
  // La sección 1 y la sección 3 tienen cada una su propio clúster seleccionado:
  // se navegan en momentos distintos de la exposición y no deben arrastrarse entre sí.
  const [codigoClusterDatos, setCodigoClusterDatos] = useState(CLUSTERES[0].codigo);
  const [codigoCluster, setCodigoCluster] = useState(CLUSTERES[0].codigo);
  const [modeloVisible, setModeloVisible] = useState<ClaveModelo>('exponencial');
  const [verTablaCompleta, setVerTablaCompleta] = useState(false);
  const [casoBondad, setCasoBondad] = useState<'directo' | 'logaritmico' | 'inverso'>('directo');

  const clusterDatos = CLUSTERES.find((c) => c.codigo === codigoClusterDatos) ?? CLUSTERES[0];
  const cluster = CLUSTERES.find((c) => c.codigo === codigoCluster) ?? CLUSTERES[0];

  // Todos los modelos candidatos, para cada clúster: se calculan una sola vez.
  const ajustesPorCluster = useMemo(() => {
    const mapa = new Map<string, Ajuste[]>();
    CLUSTERES.forEach((c) => mapa.set(c.codigo, ajustarTodos({ x: c.x, y: c.y, unidadPendiente: 'min^{-1}' })));
    return mapa;
  }, []);

  const exponencialesPorCluster = useMemo(
    () =>
      CLUSTERES.map((c) => {
        const ajuste = ajustarExponencial({ x: c.x, y: c.y, unidadPendiente: 'min^{-1}' });
        const b = ajuste.parametros[1]?.valor ?? NaN;
        return {
          cluster: c,
          ajuste,
          a: ajuste.parametros[0]?.valor ?? NaN,
          b,
          duplicacion: tiempoDeDuplicacion(b),
          maximoObservado: c.y[c.y.length - 1],
          extrapolado: ajuste.predecir(TIEMPO_EXTRAPOLACION),
        };
      }),
    []
  );

  const ajustes = ajustesPorCluster.get(cluster.codigo) ?? [];
  const ajusteActual = ajustes.find((a) => a.clave === modeloVisible) ?? ajustes[0];
  const mejorAjuste = useMemo(
    () => ajustes.filter((a) => a.valido).reduce((a, b) => (b.r2 > a.r2 ? b : a), ajustes[0]),
    [ajustes]
  );
  const ajusteLineal = useMemo(() => ajustarLineal({ x: cluster.x, y: cluster.y }), [cluster]);

  // Una fila por clúster con el r² de cada modelo, para el gráfico de barras agrupadas.
  const datosBarrasBondad = useMemo(
    () =>
      CLUSTERES.map((c) => {
        const fila: Record<string, string | number> = { cluster: nombreCorto(c.nombre) };
        (ajustesPorCluster.get(c.codigo) ?? []).forEach((ajuste) => {
          if (ajuste.valido) fila[ajuste.clave] = Number(ajuste.r2.toFixed(4));
        });
        return fila;
      }),
    [ajustesPorCluster]
  );

  // Series para los gráficos del clúster seleccionado.
  const datosAjuste = cluster.x.map((x, i) => ({
    x,
    observado: cluster.y[i],
    ajustado: ajusteActual?.valido ? ajusteActual.predecir(x) : null,
  }));

  const datosLinealizacion = cluster.x.map((x, i) => {
    const lny = Math.log(cluster.y[i]);
    const parametros = ajusteActual?.parametros ?? [];
    const lnA = ajusteActual?.clave === 'exponencial' ? Math.log(parametros[0]?.valor ?? 1) : null;
    const b = ajusteActual?.clave === 'exponencial' ? parametros[1]?.valor ?? 0 : 0;
    return { x, observado: lny, ajustado: lnA === null ? null : lnA + b * x };
  });

  const datosResiduos = cluster.x.map((x, i) => ({
    x,
    residuo: ajusteActual?.residuosLinealizados[i] ?? 0,
  }));

  const datosResiduosLineal = cluster.x.map((x, i) => ({ x, residuo: ajusteLineal.residuos[i] }));

  const filasVisibles = verTablaCompleta
    ? clusterDatos.x.map((x, i) => ({ x, y: clusterDatos.y[i] }))
    : [...clusterDatos.x.slice(0, 6).map((x, i) => ({ x, y: clusterDatos.y[i] })), { x: 300, y: clusterDatos.y[60] }];

  return (
    <main className="min-h-screen flex flex-col fondo-cuadriculado">
      <Header />

      <section className="flex-1 max-w-6xl mx-auto px-4 py-24 w-full space-y-8">

        {/* ENCABEZADO */}
        <div className="text-center mb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-500 mb-3">
            Trabajo Práctico Nº 4 · Caso 2 · Grupo 7
          </p>
          <h1 className="text-4xl md:text-[3.5rem] font-extrabold mb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 dark:from-blue-400 dark:via-indigo-400 dark:to-emerald-400 text-transparent bg-clip-text leading-tight">
            Ajuste por Mínimos Cuadrados
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">
            Crecimiento inicial de poblaciones bacterianas · 4 clústeres · 244 mediciones
          </p>
        </div>

        {/* CUERPO: guía lateral + contenido */}
        <div className="grid grid-cols-1 lg:grid-cols-[9rem_1fr] gap-4 lg:gap-10">

          {/* GUÍA LATERAL (sólo desktop) */}
          <nav className="hidden lg:flex flex-col gap-3 sticky top-32 self-start h-fit pr-2 border-r border-slate-200 dark:border-slate-800">
            {navegacion.map((item) =>
              item.tipo === 'seccion' ? (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(evento) => desplazarHaciaAncla(evento, item.href)}
                  className="group flex items-center gap-3 mt-4 first:mt-0 text-slate-600 dark:text-slate-500 hover:text-blue-600 dark:hover:text-slate-200 transition-colors"
                >
                  <GlifoMatriz celdas={item.patron} className="text-slate-400 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-widest leading-tight">{item.label}</span>
                </a>
              ) : (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(evento) => desplazarHaciaAncla(evento, item.href)}
                  title={`Consigna ${item.numero}: ${item.label}`}
                  className="group flex items-center gap-2 pl-2 ml-[0.6rem] border-l border-slate-200 dark:border-slate-700/70 text-slate-500 dark:text-slate-600 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  <span className="shrink-0 w-4 h-4 flex items-center justify-center rounded-[4px] border border-current text-[9px] font-black leading-none">
                    {item.numero}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider leading-tight">{item.label}</span>
                </a>
              )
            )}
          </nav>

          <div className="space-y-8 min-w-0">

            {/* SECCIÓN 1: EL CASO */}
            <RevelarAlEntrar>
              <div id="caso" className="scroll-mt-28 bg-white dark:bg-slate-800/50 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 shadow-xl space-y-6">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-wide border-l-4 border-blue-500 pl-4">
                  1. El caso y sus datos
                </h2>

                <p className="text-slate-800 dark:text-slate-300 leading-relaxed">
                  Un laboratorio educativo comparó el crecimiento inicial de cuatro cultivos bacterianos, cada uno mantenido bajo
                  condiciones controladas apropiadas para su especie. Durante <strong className="text-slate-100">300 minutos</strong> se
                  registró la concentración estimada de cada cultivo <strong className="text-slate-100">cada 5 minutos</strong>, obteniendo
                  61 mediciones por especie (244 observaciones en total). El objetivo es construir un modelo de ajuste para cada clúster,
                  evaluar su calidad, comparar las velocidades de crecimiento y reconocer los límites de una predicción realizada fuera
                  del intervalo observado.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-400 mb-2">Variable independiente</p>
                    <p className="text-slate-800 dark:text-slate-300 text-sm leading-relaxed">
                      <KaTeX expresionTex="X" /> — Tiempo transcurrido desde el inicio del ensayo, en minutos.
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-2">Variable dependiente</p>
                    <p className="text-slate-800 dark:text-slate-300 text-sm leading-relaxed">
                      <KaTeX expresionTex="Y" /> — Concentración estimada del cultivo, en UFC/mL.
                    </p>
                  </div>
                </div>

                {/* SEPARACIÓN DE CLÚSTERES */}
                <div className="bg-slate-100 dark:bg-slate-800/60 border-l-4 border-blue-500 rounded-r-xl p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-400 mb-3">Identificación y separación de clústeres</p>
                  <p className="text-slate-800 dark:text-slate-300 leading-relaxed mb-4">
                    La base de datos incluye una columna categórica con la especie, que permite separar las 244 observaciones en cuatro
                    subconjuntos de manera directa e inequívoca —no hace falta ningún criterio de agrupamiento estadístico—. Cada clúster
                    mantiene además su propia temperatura de cultivo constante, coherente con la condición &ldquo;apropiada para cada
                    especie&rdquo;. No se detectan valores faltantes ni saltos en el muestreo: los cuatro conjuntos tienen exactamente 61
                    pares equiespaciados.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500 border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-2 pr-4">Clúster (especie)</th>
                          <th className="text-right py-2 px-3">Temperatura</th>
                          <th className="text-right py-2 px-3">Mediciones</th>
                          <th className="text-right py-2 pl-3">Rango de tiempo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {CLUSTERES.map((c) => (
                          <tr key={c.codigo} className="border-b border-slate-200 dark:border-slate-800/70">
                            <td className="py-2.5 pr-4 text-slate-900 dark:text-slate-200 italic flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                              {c.nombre}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-500 dark:text-slate-400 tabular-nums">{c.temperatura} °C</td>
                            <td className="py-2.5 px-3 text-right text-slate-500 dark:text-slate-400 tabular-nums">{c.x.length}</td>
                            <td className="py-2.5 pl-3 text-right text-slate-500 dark:text-slate-400 tabular-nums">0 – 300 min</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* SELECTOR PROPIO DE LA SECCIÓN: controla la tabla y el gráfico de abajo */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500">
                    Elegí un clúster para ver sus mediciones y su nube de puntos
                  </p>
                  <SelectorClusteres seleccionado={codigoClusterDatos} alSeleccionar={setCodigoClusterDatos} />
                </div>

                {/* TABLA DE MEDICIONES */}
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5 md:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500">
                      Mediciones · <span className="italic text-slate-500 dark:text-slate-400">{clusterDatos.nombre}</span>
                    </p>
                    <button
                      onClick={() => setVerTablaCompleta((valor) => !valor)}
                      className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                    >
                      {verTablaCompleta ? 'Ver resumen' : `Ver las ${clusterDatos.x.length} filas`}
                    </button>
                  </div>
                  <div className={`overflow-x-auto ${verTablaCompleta ? 'max-h-80 overflow-y-auto' : ''}`}>
                    <table className="w-full text-sm border-collapse">
                      <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900">
                        <tr className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500 border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-2 pr-4">Tiempo (min)</th>
                          <th className="text-right py-2">Concentración (UFC/mL)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filasVisibles.map((fila, indice) => (
                          <tr key={`${fila.x}-${indice}`} className="border-b border-slate-200 dark:border-slate-800/60">
                            <td className="py-2 pr-4 text-slate-800 dark:text-slate-300 tabular-nums">{fila.x}</td>
                            <td className="py-2 text-right text-slate-800 dark:text-slate-300 tabular-nums">{numeroLargo(fila.y)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!verTablaCompleta && (
                    <p className="text-xs text-slate-600 dark:text-slate-500 mt-3">
                      Se muestran los primeros registros y el último; el conjunto completo tiene {clusterDatos.x.length} pares (t, C).
                    </p>
                  )}
                </div>

                {/* NUBE DE PUNTOS DEL CLÚSTER SELECCIONADO */}
                <div id="consigna-1" className="scroll-mt-28">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500 mb-4">
                    Consigna 1 · Cada clúster graficado por separado
                  </p>
                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 md:p-5">
                    <p className="text-base font-bold mb-1 italic" style={{ color: clusterDatos.color }}>
                      {clusterDatos.nombre}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500 mb-4">
                      {clusterDatos.temperatura} °C · {clusterDatos.x.length} mediciones
                    </p>
                    <GraficoAjuste
                      datos={clusterDatos.x.map((x, i) => ({ x, observado: clusterDatos.y[i], ajustado: null }))}
                      etiquetaX="t (min)"
                      etiquetaY="C (UFC/mL)"
                      colorPuntos={clusterDatos.color}
                      altura={380}
                      conZoom
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
                      Arrastrá los extremos de la barra inferior para acercarte a un tramo del ensayo. El eje vertical se reescala
                      solo al rango que quede visible.
                    </p>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-500/5 border-l-4 border-amber-500 rounded-r-xl p-5 mt-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-2">
                      Probá acercarte a los primeros 100 minutos
                    </p>
                    <p className="text-sm text-slate-800 dark:text-slate-300 leading-relaxed">
                      Visto completo, el gráfico parece una exponencial impecable. Pero eso es en parte un efecto de la escala: los
                      valores finales son tan grandes que aplastan todo el tramo inicial contra el eje. Al hacer zoom sobre los
                      primeros minutos, el eje vertical se reescala y aparece lo que estaba tapado: los puntos{' '}
                      <strong className="text-slate-900 dark:text-slate-100">no caen exactamente sobre una curva suave</strong>, sino
                      que oscilan alrededor de ella. Son datos experimentales, con su dispersión.
                    </p>
                    <p className="text-sm text-slate-800 dark:text-slate-300 leading-relaxed mt-3">
                      Esto es justamente por qué no alcanza con mirar la forma de la nube para elegir el modelo, y por qué después
                      hacen falta r² y el análisis de residuos: la vista general engaña en los dos sentidos, puede hacer parecer
                      perfecto un ajuste mediocre y puede esconder la estructura fina de los datos.
                    </p>
                  </div>

                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-4">
                    Recorriendo las cuatro especies con el selector se ve que todas comparten la misma forma cualitativa: un
                    crecimiento lento al principio que se acelera de manera sostenida, sin llegar a estabilizarse dentro de los 300
                    minutos observados. Esa curvatura creciente descarta de entrada un comportamiento lineal, pero todavía no alcanza
                    para elegir el modelo: esa decisión se toma en la sección 3, comparando los candidatos con r² y residuos.
                  </p>
                </div>
              </div>
            </RevelarAlEntrar>

            {/* SECCIÓN 2: MARCO TEÓRICO */}
            <RevelarAlEntrar>
              <div id="teoria" className="scroll-mt-28 bg-white dark:bg-slate-800/50 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 shadow-xl space-y-6">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-wide border-l-4 border-indigo-500 pl-4">
                  2. Marco teórico
                </h2>

                <p className="text-slate-800 dark:text-slate-300 leading-relaxed">
                  Dado un conjunto de datos experimentales <KaTeX expresionTex="(x_i, y_i)" /> y una función empírica propuesta
                  <KaTeX expresionTex="\;y = f(x, a_1, a_2, \ldots, a_n)" />, la desviación en cada punto es
                  <KaTeX expresionTex="\;\varepsilon_i = f(x_i, a_1, \ldots, a_n) - y_i" />. El método de mínimos cuadrados busca los
                  coeficientes que hacen mínima la suma de los cuadrados de esas desviaciones:
                </p>

                <div className="bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-inner p-4 desplazamiento-formula text-center">
                  <KaTeX
                    expresionTex={String.raw`\delta(a_1, a_2, \ldots, a_n) = \sum_{i=1}^{n} \left[ f(x_i, a_1, \ldots, a_n) - y_i \right]^2`}
                    enBloque={true}
                  />
                </div>

                <p className="text-slate-800 dark:text-slate-300 leading-relaxed">
                  Se usan los cuadrados porque así no importa si el punto queda por arriba o por debajo de la curva propuesta. La
                  condición de mínimo de una función de varias variables exige que todas las derivadas parciales respecto de cada
                  coeficiente se anulen a la vez:
                </p>

                <div className="bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-inner p-4 desplazamiento-formula text-center">
                  <KaTeX
                    expresionTex={String.raw`\frac{\partial \delta}{\partial a_1} = 0 \; , \quad \frac{\partial \delta}{\partial a_2} = 0 \; , \quad \ldots \quad , \quad \frac{\partial \delta}{\partial a_n} = 0`}
                    enBloque={true}
                  />
                </div>

                <p className="text-slate-800 dark:text-slate-300 leading-relaxed">
                  Cuando la función empírica es lineal respecto de los coeficientes, ese sistema —llamado{' '}
                  <strong className="text-indigo-300">sistema de ecuaciones normales</strong>— resulta también lineal y se resuelve de
                  forma directa. Para el caso de la recta <KaTeX expresionTex="y = a_1 + a_2 x" /> queda el sistema que sirve de
                  referencia para todos los demás modelos:
                </p>

                <div className="bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-inner p-4 desplazamiento-formula text-center">
                  <KaTeX
                    expresionTex={String.raw`\begin{bmatrix} n & \sum x_i \\[2pt] \sum x_i & \sum x_i^2 \end{bmatrix} \cdot \begin{bmatrix} a_1 \\[2pt] a_2 \end{bmatrix} = \begin{bmatrix} \sum y_i \\[2pt] \sum y_i x_i \end{bmatrix}`}
                    enBloque={true}
                  />
                </div>

                {/* MODELOS CANDIDATOS */}
                <div className="bg-slate-100 dark:bg-slate-800/60 border-l-4 border-indigo-500 rounded-r-xl p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-3">
                    Modelos del apunte y su linealización
                  </p>
                  <p className="text-slate-800 dark:text-slate-300 leading-relaxed mb-5">
                    Los modelos no lineales no se pueden resolver directamente con el sistema anterior, pero se{' '}
                    <strong className="text-indigo-300">linealizan</strong> mediante un cambio de variable; una vez linealizados, se
                    aplica el mismo sistema normal 2×2 sobre las variables transformadas y al final se recuperan los parámetros
                    originales.
                  </p>
                  <div className="space-y-3">
                    {MODELOS_TEORIA.map((modelo) => (
                      <div key={modelo.nombre} className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700/50 rounded-lg p-4">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-200 mb-3">{modelo.nombre}</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500 mb-1">Forma</p>
                            <div className="desplazamiento-formula"><KaTeX expresionTex={modelo.forma} /></div>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500 mb-1">Linealización</p>
                            <div className="desplazamiento-formula">
                              {modelo.linealizacion.startsWith('—') ? (
                                <span className="text-slate-500 dark:text-slate-400 text-xs">{modelo.linealizacion}</span>
                              ) : (
                                <KaTeX expresionTex={modelo.linealizacion} />
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500 mb-1">Incógnitas del sistema</p>
                            <div className="desplazamiento-formula"><KaTeX expresionTex={modelo.incognitas} /></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* BONDAD DEL AJUSTE */}
                <div className="bg-slate-100 dark:bg-slate-800/60 border-l-4 border-emerald-500 rounded-r-xl p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-3">Bondad del ajuste</p>
                  <p className="text-slate-800 dark:text-slate-300 leading-relaxed mb-4">
                    La bondad del ajuste mide si el ajuste realizado fue realmente efectivo, y no depende de la forma aparente de los
                    datos: se puede ajustar una recta a cualquier nube y sólo el cálculo revela si esa elección fue buena.
                  </p>
                  <div className="bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-inner p-4 desplazamiento-formula text-center mb-5">
                    <KaTeX expresionTex={String.raw`r^2 = \frac{ST - SR}{ST}`} enBloque={true} />
                  </div>

                  <p className="text-slate-800 dark:text-slate-300 leading-relaxed mb-4">
                    Ahora bien, <KaTeX expresionTex="ST" /> y <KaTeX expresionTex="SR" /> no se calculan siempre sobre{' '}
                    <KaTeX expresionTex="y" />: el apunte los define sobre{' '}
                    <strong className="text-emerald-700 dark:text-emerald-300">la variable que efectivamente se minimizó</strong> al
                    resolver el sistema normal. Por eso hay tres versiones, una por cada familia de modelos:
                  </p>

                  {/* SELECTOR DE LOS TRES CASOS DEL APUNTE */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                    {CASOS_BONDAD.map((caso) => {
                      const activo = caso.clave === casoBondad;
                      return (
                        <button
                          key={caso.clave}
                          onClick={() => setCasoBondad(caso.clave)}
                          aria-pressed={activo}
                          className={`px-3 py-2.5 rounded-lg border text-left transition-all ${
                            activo
                              ? 'bg-white dark:bg-slate-900 border-emerald-500 shadow-md'
                              : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <span
                            className={`block text-sm font-bold leading-tight ${
                              activo ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {caso.titulo}
                          </span>
                          <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-500 mt-0.5">
                            {caso.modelos}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {CASOS_BONDAD.filter((caso) => caso.clave === casoBondad).map((caso) => (
                    <div key={caso.clave} className="bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-inner p-4 md:p-5 space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                        Se minimiza sobre <KaTeX expresionTex={caso.variable} />
                      </p>
                      <div className="desplazamiento-formula text-center">
                        <KaTeX expresionTex={caso.media} enBloque={true} />
                      </div>
                      <div className="desplazamiento-formula text-center">
                        <KaTeX expresionTex={caso.st} enBloque={true} />
                      </div>
                      <div className="desplazamiento-formula text-center">
                        <KaTeX expresionTex={caso.sr} enBloque={true} />
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-200 dark:border-slate-700/50 pt-3">
                        {caso.nota}
                      </p>
                    </div>
                  ))}

                  <p className="text-slate-800 dark:text-slate-300 leading-relaxed mt-4">
                    El valor está siempre entre 0 y 1, y se considera un buen ajuste cuando{' '}
                    <KaTeX expresionTex="r^2 > 0{,}85" />. Usar en cada modelo la variable que corresponde es lo que permite
                    comparar entre sí modelos de distinta naturaleza sobre una base equivalente; es el criterio que se respeta en
                    toda la página.
                  </p>
                </div>
              </div>
            </RevelarAlEntrar>

            {/* SECCIÓN 3: ANÁLISIS POR CLÚSTER */}
            <RevelarAlEntrar>
              <div id="analisis" className="scroll-mt-28 bg-white dark:bg-slate-800/50 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 shadow-xl space-y-6">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-wide border-l-4 border-emerald-500 pl-4">
                  3. Análisis por clúster
                </h2>
                <p className="text-slate-800 dark:text-slate-300 leading-relaxed">
                  Para cada clúster se calculan los cinco modelos del apunte sobre los mismos datos y recién después se elige uno.
                  Seleccioná una especie para ver su análisis completo; todos los números de esta sección se recalculan en vivo a partir
                  de las 61 mediciones del clúster elegido.
                </p>

                {/* SELECTOR DE CLÚSTER */}
                <div className="flex flex-wrap gap-2">
                  {CLUSTERES.map((c) => {
                    const activo = c.codigo === cluster.codigo;
                    return (
                      <button
                        key={c.codigo}
                        onClick={() => setCodigoCluster(c.codigo)}
                        className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all border ${
                          activo
                            ? 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white shadow-md'
                            : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                        }`}
                        style={activo ? { borderColor: c.color, color: c.color } : undefined}
                      >
                        <span className="italic">{c.nombre}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest ml-2 opacity-70">{c.temperatura} °C</span>
                      </button>
                    );
                  })}
                </div>

                {/* COMPARACIÓN DE MODELOS CANDIDATOS */}
                <div id="consigna-2" className="scroll-mt-28 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5 md:p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500 mb-4">
                    Consigna 2 · Comparación de los modelos candidatos
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500 border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-2 pr-4">Modelo</th>
                          <th className="text-left py-2 px-3">Ecuación obtenida</th>
                          <th className="text-right py-2 px-3">Espacio de r²</th>
                          <th className="text-right py-2 pl-3">r²</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ajustes.map((ajuste) => {
                          const esMejor = ajuste.clave === mejorAjuste?.clave;
                          return (
                            <tr
                              key={ajuste.clave}
                              className={`border-b border-slate-200 dark:border-slate-800/70 ${esMejor ? 'bg-emerald-50 dark:bg-emerald-500/5' : ''}`}
                            >
                              <td className={`py-2.5 pr-4 font-semibold ${esMejor ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-300'}`}>
                                {ajuste.nombre}
                                {esMejor && <span className="ml-2 text-[10px] font-black uppercase tracking-widest">mejor r²</span>}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                                {ajuste.valido ? (
                                  <div className="desplazamiento-formula"><KaTeX expresionTex={ajuste.ecuacionTex} /></div>
                                ) : (
                                  <span className="text-xs text-slate-600 dark:text-slate-500">{ajuste.motivo}</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-500">
                                {ajuste.valido ? <KaTeX expresionTex={ajuste.espacio} /> : '—'}
                              </td>
                              <td
                                className={`py-2.5 pl-3 text-right tabular-nums font-bold ${
                                  esMejor ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'
                                }`}
                              >
                                {ajuste.valido ? ajuste.r2.toFixed(4) : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-4">
                    El modelo <strong className="text-emerald-700 dark:text-emerald-300">exponencial</strong> gana en los cuatro clústeres. El polinómico de
                    2º grado queda cerca, pero agrega un parámetro más sin aportar interpretación física del fenómeno. La elección no es
                    sólo estadística: la fase inicial del crecimiento bacteriano responde a{' '}
                    <KaTeX expresionTex="dC/dt = k \cdot C" /> (la velocidad de crecimiento es proporcional a la población presente),
                    cuya solución analítica es exactamente <KaTeX expresionTex="C(t) = C_0 \, e^{k t}" />. Estadística y teoría del
                    fenómeno apuntan al mismo modelo.
                  </p>
                </div>

                {/* SELECTOR DE MODELO Y PROCEDIMIENTO */}
                <div id="consigna-3" className="scroll-mt-28 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500">
                      Consigna 3 · Procedimiento de cálculo por mínimos cuadrados
                    </p>
                    <div className="inline-flex flex-wrap bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner gap-1">
                      {ajustes.map((ajuste) => (
                        <button
                          key={ajuste.clave}
                          onClick={() => setModeloVisible(ajuste.clave)}
                          disabled={!ajuste.valido}
                          className={`px-3 py-1.5 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all ${
                            ajuste.clave === modeloVisible
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'text-slate-600 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 disabled:opacity-40 disabled:hover:text-slate-600 dark:disabled:hover:text-slate-500'
                          }`}
                        >
                          {ajuste.nombre.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {ajusteActual?.valido && (
                    <div className="bg-slate-50 dark:bg-slate-950/40 border-l-4 border-emerald-500 rounded-r-xl p-5 md:p-6 space-y-5">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-2">Modelo y linealización</p>
                        <div className="desplazamiento-formula mb-2">
                          <KaTeX expresionTex={ajusteActual.formaTex} enBloque={true} />
                        </div>
                        {ajusteActual.linealizacionTex.startsWith('No requiere') ? (
                          <p className="text-sm text-slate-500 dark:text-slate-400">{ajusteActual.linealizacionTex}</p>
                        ) : (
                          <div className="desplazamiento-formula">
                            <KaTeX expresionTex={ajusteActual.linealizacionTex} enBloque={true} />
                          </div>
                        )}
                        {ajusteActual.motivo && <p className="text-xs text-amber-300/80 mt-2">{ajusteActual.motivo}</p>}
                      </div>

                      <div className="border-t border-slate-200 dark:border-slate-700/50 pt-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500 mb-3">
                          Paso 1 · Sumatorias necesarias
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                          {ajusteActual.sumatorias.map((sumatoria) => (
                            <div key={sumatoria.simbolo} className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700/50 rounded-lg p-3 text-center">
                              <div className="desplazamiento-formula text-sm">
                                <KaTeX expresionTex={sumatoria.simbolo} />
                              </div>
                              <p className="text-xs text-emerald-700 dark:text-emerald-300 tabular-nums mt-1 break-all">
                                {numeroLargo(sumatoria.valor, Math.abs(sumatoria.valor) < 100 ? 4 : 2)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-slate-200 dark:border-slate-700/50 pt-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500 mb-3">
                          Paso 2 · Sistema de ecuaciones normales
                        </p>
                        <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700/50 rounded-lg p-4 space-y-2">
                          {ajusteActual.sistemaTex.map((ecuacion, indice) => (
                            <div key={indice} className="desplazamiento-formula">
                              <KaTeX expresionTex={ecuacion} />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-slate-200 dark:border-slate-700/50 pt-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500 mb-3">
                          Paso 3 · Resolución por determinantes (Cramer)
                        </p>
                        <ol className="space-y-2">
                          {ajusteActual.pasos.map((paso) => (
                            <li key={paso.titulo} className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700/50 rounded-lg px-4 py-3">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500 mb-1">{paso.titulo}</p>
                              <div className="desplazamiento-formula">
                                <KaTeX expresionTex={paso.tex} />
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>

                      <div className="border-t border-slate-200 dark:border-slate-700/50 pt-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-2">
                          Ecuación de ajuste resultante
                        </p>
                        <div className="bg-slate-50 dark:bg-slate-950/60 border border-emerald-500/30 rounded-lg p-4 text-center desplazamiento-formula shadow-[0_0_20px_rgba(16,185,129,0.08)]">
                          <KaTeX expresionTex={ajusteActual.ecuacionTex} enBloque={true} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* BONDAD Y GRÁFICOS */}
                {ajusteActual?.valido && (
                  <div id="consigna-4" className="scroll-mt-28 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500">
                      Consigna 4 · Bondad del ajuste y análisis de residuos
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { etiqueta: 'Media', valor: formatearNumero(ajusteActual.media, 4), tex: '\\bar{y}' },
                        { etiqueta: 'ST', valor: formatearNumero(ajusteActual.ST, 4), tex: 'ST' },
                        { etiqueta: 'SR', valor: formatearNumero(ajusteActual.SR, 4), tex: 'SR' },
                        { etiqueta: 'Bondad', valor: ajusteActual.r2.toFixed(6), tex: 'r^2' },
                      ].map((dato) => (
                        <div
                          key={dato.etiqueta}
                          className={`rounded-xl border p-4 text-center ${
                            dato.etiqueta === 'Bondad'
                              ? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-500/30'
                              : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700/50'
                          }`}
                        >
                          <div className="desplazamiento-formula text-sm mb-1">
                            <KaTeX expresionTex={dato.tex} />
                          </div>
                          <p
                            className={`text-sm tabular-nums font-bold break-all ${
                              dato.etiqueta === 'Bondad' ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {dato.valor}
                          </p>
                        </div>
                      ))}
                    </div>

                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      Con <KaTeX expresionTex={`r^2 = ${ajusteActual.r2.toFixed(4)}`} />, el modelo {ajusteActual.nombre.toLowerCase()}{' '}
                      explica el {(ajusteActual.r2 * 100).toFixed(2)} % de la variabilidad de{' '}
                      <KaTeX expresionTex={ajusteActual.espacio} /> en función del tiempo
                      {ajusteActual.r2 > 0.85 ? ', por encima del umbral de referencia de 0,85.' : ', por debajo del umbral de referencia de 0,85.'}
                    </p>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500 mb-3">
                          Datos y curva ajustada
                        </p>
                        <GraficoAjuste
                          datos={datosAjuste}
                          etiquetaX="t (min)"
                          etiquetaY="C (UFC/mL)"
                          colorPuntos={cluster.color}
                          nombreCurva={`Ajuste ${ajusteActual.nombre.toLowerCase()}`}
                        />
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500 mb-3">
                          {ajusteActual.clave === 'exponencial'
                            ? 'Linealización: ln(C) en función de t'
                            : 'Datos en escala logarítmica'}
                        </p>
                        <GraficoAjuste
                          datos={datosLinealizacion}
                          etiquetaX="t (min)"
                          etiquetaY="ln(C)"
                          colorPuntos={cluster.color}
                          nombreCurva="Recta de ajuste"
                        />
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-3">
                          Residuos del modelo {ajusteActual.nombre.toLowerCase()}
                        </p>
                        <GraficoResiduos
                          datos={datosResiduos}
                          etiquetaX="t (min)"
                          etiquetaY="residuo"
                          color={cluster.color}
                        />
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-3">
                          Residuos del modelo lineal (contraste)
                        </p>
                        <GraficoResiduos
                          datos={datosResiduosLineal}
                          etiquetaX="t (min)"
                          etiquetaY="residuo"
                          color="#f59e0b"
                        />
                      </div>
                    </div>

                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      Los residuos del modelo lineal muestran un patrón sistemático en forma de &ldquo;U&rdquo;: no son ruido
                      alrededor del cero, sino una curvatura que revela que la recta no captura la estructura de los datos. En cambio,
                      en el espacio donde se minimizó el error el modelo elegido reparte sus residuos sin una tendencia marcada, lo que
                      confirma que la forma funcional es la adecuada.
                    </p>

                    {ajusteActual.clave === 'exponencial' && (
                      <div className="bg-slate-100 dark:bg-slate-800/60 border-l-4 border-blue-500 rounded-r-xl p-6">
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-400 mb-3">
                          Interpretación de los parámetros
                        </p>
                        <p className="text-slate-800 dark:text-slate-300 leading-relaxed mb-4">
                          Los dos parámetros que devolvió el sistema no son números sueltos: cada uno significa algo concreto del
                          cultivo. <KaTeX expresionTex={`a = ${formatearNumero(ajusteActual.parametros[0].valor, 2)}`} /> es la
                          concentración estimada en el instante inicial, porque al reemplazar{' '}
                          <KaTeX expresionTex="t = 0" /> queda <KaTeX expresionTex="C(0) = a \cdot e^{0} = a" />. Y{' '}
                          <KaTeX expresionTex={`b = ${formatearNumero(ajusteActual.parametros[1].valor, 6)} \\; \\text{min}^{-1}`} /> es
                          la tasa de crecimiento específica: cuanto más grande, más rápido crece el cultivo.
                        </p>

                        <p className="text-slate-800 dark:text-slate-300 leading-relaxed mb-3">
                          Para que <KaTeX expresionTex="b" /> se pueda comparar entre especies conviene traducirlo a una magnitud con
                          sentido biológico: el <strong className="text-blue-700 dark:text-blue-300">tiempo de duplicación</strong>,
                          es decir cuánto tarda el cultivo en llegar al doble de su concentración. Se deduce planteando exactamente
                          eso y despejando:
                        </p>

                        <ol className="space-y-2 mb-4">
                          {[
                            { tex: String.raw`C(t + t_{1/2}) = 2 \cdot C(t)`, nota: 'Planteamos que pasó el doble.' },
                            { tex: String.raw`a \, e^{b(t + t_{1/2})} = 2 \, a \, e^{b t}`, nota: 'Reemplazamos por el modelo.' },
                            { tex: String.raw`e^{b t} \cdot e^{b \, t_{1/2}} = 2 \, e^{b t}`, nota: 'Separamos el exponente; a se cancela.' },
                            { tex: String.raw`e^{b \, t_{1/2}} = 2`, nota: 'Dividimos por e^{bt}: el instante t no importa.' },
                            { tex: String.raw`b \cdot t_{1/2} = \ln(2)`, nota: 'Aplicamos ln a ambos miembros.' },
                            { tex: String.raw`t_{1/2} = \frac{\ln(2)}{b}`, nota: 'Despejamos el tiempo de duplicación.' },
                          ].map((paso, indice) => (
                            <li
                              key={indice}
                              className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700/50 rounded-lg px-4 py-2.5 flex flex-col md:flex-row md:items-center gap-2 md:gap-5"
                            >
                              <span className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-black">
                                {indice + 1}
                              </span>
                              <div className="desplazamiento-formula flex-1 min-w-0">
                                <KaTeX expresionTex={paso.tex} />
                              </div>
                              <span className="text-xs text-slate-500 dark:text-slate-400 md:text-right md:max-w-[14rem] shrink-0 leading-snug">
                                {paso.nota}
                              </span>
                            </li>
                          ))}
                        </ol>

                        <p className="text-slate-800 dark:text-slate-300 leading-relaxed mb-3">
                          Notar que el resultado no depende de <KaTeX expresionTex="t" />: en un crecimiento exponencial el tiempo de
                          duplicación es siempre el mismo, y por eso sirve para comparar especies. Con el <KaTeX expresionTex="b" /> de
                          este clúster:
                        </p>
                        <div className="bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-inner p-4 desplazamiento-formula text-center my-4">
                          <KaTeX
                            expresionTex={`t_{1/2} = \\frac{\\ln(2)}{b} = \\frac{0{,}6931}{${formatearNumero(
                              ajusteActual.parametros[1].valor,
                              6
                            )}} = ${tiempoDeDuplicacion(ajusteActual.parametros[1].valor).toFixed(1)} \\; \\text{min}`}
                            enBloque={true}
                          />
                        </div>
                        <p className="text-slate-800 dark:text-slate-300 leading-relaxed">
                          Bajo las condiciones controladas del ensayo, la población de <span className="italic">{cluster.nombre}</span>{' '}
                          duplica su concentración, en promedio, cada{' '}
                          {tiempoDeDuplicacion(ajusteActual.parametros[1].valor).toFixed(1)} minutos durante la fase observada. Este
                          paso es el puente hacia la consigna 5: es lo que después permite comparar las cuatro especies entre sí.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </RevelarAlEntrar>

            {/* SECCIÓN 4: COMPARACIÓN ENTRE CLÚSTERES */}
            <RevelarAlEntrar>
              <div id="comparacion" className="scroll-mt-28 bg-white dark:bg-slate-800/50 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 shadow-xl space-y-6">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-wide border-l-4 border-amber-500 pl-4">
                  4. Comparación entre clústeres
                </h2>
                <div id="consigna-5" className="scroll-mt-28">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500 mb-4">
                    Consigna 5 · Comparación entre clústeres y conclusión
                  </p>
                  <p className="text-slate-800 dark:text-slate-300 leading-relaxed">
                    Los cuatro cultivos quedan descriptos por el mismo tipo de modelo, pero con parámetros —y por lo tanto
                    comportamientos— muy distintos entre sí.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500 border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-2 pr-4">Especie</th>
                        <th className="text-right py-2 px-3">T (°C)</th>
                        <th className="text-right py-2 px-3">a (UFC/mL)</th>
                        <th className="text-right py-2 px-3">b (min⁻¹)</th>
                        <th className="text-right py-2 px-3">r²</th>
                        <th className="text-right py-2 pl-3">t½ (min)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exponencialesPorCluster.map((fila) => (
                        <tr key={fila.cluster.codigo} className="border-b border-slate-200 dark:border-slate-800/70">
                          <td className="py-2.5 pr-4 text-slate-900 dark:text-slate-200 italic flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: fila.cluster.color }} />
                            {fila.cluster.nombre}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-500 dark:text-slate-400 tabular-nums">{fila.cluster.temperatura}</td>
                          <td className="py-2.5 px-3 text-right text-slate-800 dark:text-slate-300 tabular-nums">{numeroLargo(fila.a, 1)}</td>
                          <td className="py-2.5 px-3 text-right text-slate-800 dark:text-slate-300 tabular-nums">{fila.b.toFixed(6)}</td>
                          <td className="py-2.5 px-3 text-right text-emerald-700 dark:text-emerald-300 tabular-nums font-bold">{fila.ajuste.r2.toFixed(4)}</td>
                          <td className="py-2.5 pl-3 text-right text-slate-800 dark:text-slate-300 tabular-nums">{fila.duplicacion.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 md:p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500 mb-3">
                    Los cuatro clústeres en escala semilogarítmica
                  </p>
                  <GraficoComparacion
                    series={CLUSTERES.map((c) => ({
                      nombre: c.nombre,
                      color: c.color,
                      puntos: c.x.map((x, i) => ({ x, y: c.y[i] })),
                    }))}
                    etiquetaX="t (min)"
                    etiquetaY="C (UFC/mL), escala log"
                  />
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-4">
                    En escala logarítmica una exponencial se ve como una recta. Las cuatro nubes se alinean, lo que confirma
                    visualmente el carácter exponencial del crecimiento en los cuatro casos; lo que cambia entre especies es la
                    pendiente, es decir, la tasa de crecimiento.
                  </p>
                </div>

                {/* BONDAD DE AJUSTE EN BARRAS */}
                <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 md:p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500 mb-3">
                    Bondad de ajuste (r²) por modelo y clúster
                  </p>
                  <GraficoBarrasAgrupadas
                    datos={datosBarrasBondad}
                    claveGrupo="cluster"
                    series={SERIES_MODELOS}
                    etiquetaY="r²"
                    umbral={{ valor: 0.85, etiqueta: 'Umbral 0,85' }}
                  />
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-4">
                    En los cuatro clústeres el modelo exponencial es el que mejor ajusta, y la diferencia con el lineal y el
                    potencial se ve de un vistazo. El polinómico de 2º grado es el que más se le acerca —y cuanto más lento crece la
                    especie, más se le acerca—, pero no describe una tasa de crecimiento proporcional a la población: entre los dos,
                    el exponencial es el único que además tiene respaldo en la cinética conocida del crecimiento bacteriano.
                  </p>
                </div>

                {/* TIEMPO DE DUPLICACIÓN EN BARRAS */}
                <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 md:p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500 mb-3">
                    Velocidad de crecimiento por especie (tiempo de duplicación)
                  </p>
                  <GraficoBarrasSimples
                    datos={exponencialesPorCluster.map((fila) => ({
                      nombre: nombreCorto(fila.cluster.nombre),
                      valor: fila.duplicacion,
                      color: fila.cluster.color,
                    }))}
                    etiquetaY="Tiempo de duplicación (min)"
                    sufijo=" min"
                  />
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-4">
                    Traducido a tiempo de duplicación, el parámetro b se vuelve comparable: de los 27 minutos de{' '}
                    <span className="italic">E. coli</span> a los 66 de <span className="italic">P. fluorescens</span> hay un factor
                    de casi 2,5 en velocidad de crecimiento.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5 md:p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500 mb-4">
                    Los mismos valores de r², en tabla
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500 border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-2 pr-4">Especie</th>
                          {ajustes.map((ajuste) => (
                            <th key={ajuste.clave} className="text-right py-2 px-3">{ajuste.nombre.split(' ')[0]}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {CLUSTERES.map((c) => {
                          const ajustesCluster = ajustesPorCluster.get(c.codigo) ?? [];
                          const mejor = ajustesCluster
                            .filter((a) => a.valido)
                            .reduce((a, b) => (b.r2 > a.r2 ? b : a), ajustesCluster[0]);
                          return (
                            <tr key={c.codigo} className="border-b border-slate-200 dark:border-slate-800/70">
                              <td className="py-2.5 pr-4 text-slate-800 dark:text-slate-300 italic text-xs">{c.nombre}</td>
                              {ajustesCluster.map((ajuste) => (
                                <td
                                  key={ajuste.clave}
                                  className={`py-2.5 px-3 text-right tabular-nums ${
                                    ajuste.clave === mejor?.clave ? 'text-emerald-700 dark:text-emerald-300 font-bold' : 'text-slate-500 dark:text-slate-400'
                                  }`}
                                >
                                  {ajuste.valido ? ajuste.r2.toFixed(4) : '—'}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-slate-100 dark:bg-slate-800/60 border-l-4 border-amber-500 rounded-r-xl p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-3">Interpretación comparativa</p>
                  <p className="text-slate-800 dark:text-slate-300 leading-relaxed mb-3">
                    <span className="italic">Escherichia coli</span>, cultivada a 37 °C, presenta la mayor tasa de crecimiento
                    (duplicación cada ≈ 27 minutos), coherente con su comportamiento conocido como bacteria de crecimiento rápido en
                    condiciones óptimas. <span className="italic">Bacillus subtilis</span> (32 °C) y{' '}
                    <span className="italic">Lactobacillus acidophilus</span> (37 °C) muestran tasas intermedias.
                  </p>
                  <p className="text-slate-800 dark:text-slate-300 leading-relaxed">
                    Es interesante que <span className="italic">L. acidophilus</span>, cultivada a la misma temperatura que{' '}
                    <span className="italic">E. coli</span>, duplique su población en casi el doble de tiempo (≈ 50 min): la velocidad
                    de crecimiento no depende únicamente de la temperatura, sino que es una característica metabólica propia de cada
                    especie. <span className="italic">Pseudomonas fluorescens</span>, a la temperatura más baja del grupo (25 °C),
                    resulta la más lenta (≈ 66 min).
                  </p>
                </div>
              </div>
            </RevelarAlEntrar>

            {/* SECCIÓN 5: LÍMITES Y CONCLUSIÓN */}
            <RevelarAlEntrar>
              <div id="conclusion" className="scroll-mt-28 bg-white dark:bg-slate-800/50 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 shadow-xl space-y-6">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-wide border-l-4 border-purple-500 pl-4">
                  5. Límites de la predicción y conclusión
                </h2>

                <p className="text-slate-800 dark:text-slate-300 leading-relaxed">
                  El modelo exponencial describe muy bien la fase observada (0 a 300 minutos), pero su validez está atada a ese
                  intervalo. Ningún cultivo crece exponencialmente de forma indefinida: al agotarse los nutrientes y acumularse
                  desechos, el crecimiento se frena y el cultivo entra en fase estacionaria y luego en declive, describiendo en
                  conjunto una curva sigmoide, no una exponencial pura.
                </p>

                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5 md:p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500 mb-4">
                    Extrapolación al doble del intervalo observado (t = {TIEMPO_EXTRAPOLACION} min)
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500 border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-2 pr-4">Especie</th>
                          <th className="text-right py-2 px-3">Máximo observado (t = 300)</th>
                          <th className="text-right py-2 pl-3">Extrapolado (t = 600)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exponencialesPorCluster.map((fila) => (
                          <tr key={fila.cluster.codigo} className="border-b border-slate-200 dark:border-slate-800/70">
                            <td className="py-2.5 pr-4 text-slate-800 dark:text-slate-300 italic text-xs">{fila.cluster.nombre}</td>
                            <td className="py-2.5 px-3 text-right text-slate-800 dark:text-slate-300 tabular-nums">
                              {numeroLargo(fila.maximoObservado)} UFC/mL
                            </td>
                            <td className="py-2.5 pl-3 text-right text-amber-600 dark:text-amber-300 tabular-nums">
                              <KaTeX expresionTex={`${formatearNumero(fila.extrapolado, 3)}`} /> UFC/mL
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-4">
                    Estos valores son biológicamente irreales: superan ampliamente las densidades celulares máximas típicas de un
                    cultivo de laboratorio, del orden de 10⁹–10¹⁰ UFC/mL. El modelo sirve como descripción local de la fase
                    logarítmica: interpolar dentro de 0–300 min es razonable, extrapolar lejos no. Describir el ciclo completo
                    exigiría un modelo con cota superior —como el ajuste del cociente del apunte— y, sobre todo, datos que incluyan
                    las fases estacionaria y de declive, ausentes en este ensayo.
                  </p>
                </div>

                <div className="bg-slate-100 dark:bg-slate-800/60 border-l-4 border-emerald-500 rounded-r-xl p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-3">Conclusión general</p>
                  <p className="text-slate-800 dark:text-slate-300 leading-relaxed mb-3">
                    El análisis de los cuatro clústeres permitió comprobar, sin asumirlo de antemano, que el modelo exponencial{' '}
                    <KaTeX expresionTex="y = a \cdot e^{b x}" /> es el que mejor describe el crecimiento inicial de las cuatro especies
                    dentro del intervalo de 0 a 300 minutos. La conclusión se apoya en tres pilares independientes:
                  </p>
                  <ul className="space-y-2 text-slate-800 dark:text-slate-300 leading-relaxed list-disc pl-5 mb-3">
                    <li>
                      <strong className="text-emerald-700 dark:text-emerald-300">Criterio estadístico:</strong> r² superior a 0,998 en los cuatro casos,
                      claramente por encima del resto de los candidatos.
                    </li>
                    <li>
                      <strong className="text-emerald-700 dark:text-emerald-300">Análisis gráfico:</strong> la linealización ln(C) vs. t es prácticamente una
                      recta, y los residuos no muestran patrones sistemáticos, a diferencia de la marcada &ldquo;U&rdquo; del modelo
                      lineal.
                    </li>
                    <li>
                      <strong className="text-emerald-700 dark:text-emerald-300">Respaldo teórico:</strong> la fase exponencial del crecimiento bacteriano se
                      rige por <KaTeX expresionTex="dC/dt = k \cdot C" />, cuya solución es precisamente la función ajustada.
                    </li>
                  </ul>
                  <p className="text-slate-800 dark:text-slate-300 leading-relaxed">
                    La comparación entre especies mostró diferencias claras de velocidad (tiempos de duplicación entre 27 y 66
                    minutos), asociadas tanto a la temperatura de cultivo como al metabolismo propio de cada especie: un mismo tipo de
                    modelo puede describir fenómenos con comportamientos muy distintos. Finalmente, la extrapolación evidenció que
                    todo modelo de ajuste describe el fenómeno dentro del rango de datos que le dio origen, y no más allá de él.
                  </p>
                </div>
              </div>
            </RevelarAlEntrar>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
