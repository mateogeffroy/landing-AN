'use client';

import { useEffect, useState } from 'react';
import {
  ComposedChart,
  BarChart,
  Bar,
  Cell,
  LabelList,
  Brush,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

// Los colores de Recharts se pasan por props, no por clases de Tailwind, así que
// el tema se resuelve leyendo la clase `dark` del <html> que administra ThemeToggle.
function useTemaOscuro() {
  const [oscuro, setOscuro] = useState(false);

  useEffect(() => {
    const raiz = document.documentElement;
    const actualizar = () => setOscuro(raiz.classList.contains('dark'));
    actualizar();
    const observador = new MutationObserver(actualizar);
    observador.observe(raiz, { attributes: true, attributeFilter: ['class'] });
    return () => observador.disconnect();
  }, []);

  return oscuro;
}

function usarPaleta() {
  const oscuro = useTemaOscuro();
  return {
    grilla: oscuro ? '#1e293b' : '#e2e8f0',
    eje: { stroke: oscuro ? '#475569' : '#94a3b8' },
    marca: { fill: oscuro ? '#94a3b8' : '#475569', fontSize: 11 },
    etiqueta: oscuro ? '#64748b' : '#64748b',
    referencia: oscuro ? '#64748b' : '#94a3b8',
    tooltip: {
      backgroundColor: oscuro ? '#1e293b' : '#ffffff',
      border: `1px solid ${oscuro ? '#475569' : '#cbd5e1'}`,
      borderRadius: '12px',
      fontSize: '12px',
      color: oscuro ? '#e2e8f0' : '#0f172a',
    },
  };
}

// Barra vertical del tooltip. Con `syncId` compartido, los gráficos emparejados
// la dibujan sobre el mismo punto, así se lee el dato y su residuo a la vez.
const CURSOR_VERTICAL = { stroke: '#94a3b8', strokeWidth: 1.5, strokeDasharray: '4 4' };

const formatearEje = (valor: number) => {
  const abs = Math.abs(valor);
  if (abs >= 1e6) return `${(valor / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(valor / 1e3).toFixed(0)}k`;
  if (abs !== 0 && abs < 0.01) return valor.toExponential(1);
  return String(Math.round(valor * 100) / 100);
};

interface PropiedadesGraficoAjuste {
  // Puntos observados y curva del modelo, ya evaluados sobre la misma grilla de x.
  datos: { x: number; observado: number | null; ajustado: number | null }[];
  etiquetaX: string;
  etiquetaY: string;
  colorPuntos: string;
  colorCurva?: string;
  nombreCurva?: string;
  escalaLogaritmica?: boolean;
  altura?: number;
  // Agrega la barra inferior para acercarse a un tramo del eje X.
  conZoom?: boolean;
  // Identificador compartido: los gráficos que lo comparten mueven juntos la
  // barra vertical del tooltip, punto a punto.
  sincronizarCon?: string;
}

// Nube de puntos experimental con la curva de ajuste superpuesta.
export function GraficoAjuste({
  datos,
  etiquetaX,
  etiquetaY,
  colorPuntos,
  colorCurva = '#f59e0b',
  nombreCurva = 'Modelo ajustado',
  escalaLogaritmica = false,
  altura = 320,
  conZoom = false,
  sincronizarCon,
}: PropiedadesGraficoAjuste) {
  const paleta = usarPaleta();

  return (
    <ResponsiveContainer width="100%" height={altura}>
      <ComposedChart
        data={datos}
        syncId={sincronizarCon}
        margin={{ top: 10, right: 16, left: 4, bottom: conZoom ? 52 : 22 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={paleta.grilla} />
        <XAxis
          dataKey="x"
          type="number"
          domain={['dataMin', 'dataMax']}
          tick={paleta.marca}
          tickFormatter={formatearEje}
          label={{ value: etiquetaX, position: 'insideBottom', offset: conZoom ? -42 : -12, fill: paleta.etiqueta, fontSize: 11 }}
          {...paleta.eje}
        />
        <YAxis
          tick={paleta.marca}
          width={58}
          scale={escalaLogaritmica ? 'log' : 'auto'}
          domain={escalaLogaritmica ? ['auto', 'auto'] : ['auto', 'auto']}
          allowDataOverflow={false}
          tickFormatter={formatearEje}
          label={{ value: etiquetaY, angle: -90, position: 'insideLeft', fill: paleta.etiqueta, fontSize: 11 }}
          {...paleta.eje}
        />
        <Tooltip contentStyle={paleta.tooltip} formatter={(valor) => formatearEje(Number(valor))} cursor={CURSOR_VERTICAL} />
        <Legend wrapperStyle={{ paddingTop: 14, fontSize: 12 }} />
        <Scatter dataKey="observado" name="Datos medidos" fill={colorPuntos} isAnimationActive={false} />
        <Line
          type="monotone"
          dataKey="ajustado"
          name={nombreCurva}
          stroke={colorCurva}
          strokeWidth={2.5}
          dot={false}
          isAnimationActive={false}
          connectNulls
        />
        {conZoom && (
          <Brush
            dataKey="x"
            height={26}
            travellerWidth={10}
            stroke={paleta.eje.stroke}
            fill="transparent"
            tickFormatter={(valor) => formatearEje(Number(valor))}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

interface PropiedadesGraficoResiduos {
  // `null` para los puntos que el modelo dejó fuera de su dominio al linealizar.
  datos: { x: number; residuo: number | null }[];
  etiquetaX: string;
  etiquetaY: string;
  color: string;
  altura?: number;
  sincronizarCon?: string;
}

// Residuos contra x: si el modelo es adecuado, deben repartirse sin patrón
// alrededor del cero; una curvatura sistemática delata un modelo mal elegido.
export function GraficoResiduos({
  datos,
  etiquetaX,
  etiquetaY,
  color,
  altura = 260,
  sincronizarCon,
}: PropiedadesGraficoResiduos) {
  const paleta = usarPaleta();

  return (
    <ResponsiveContainer width="100%" height={altura}>
      <ComposedChart data={datos} syncId={sincronizarCon} margin={{ top: 10, right: 16, left: 4, bottom: 22 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={paleta.grilla} />
        <XAxis
          dataKey="x"
          type="number"
          domain={['dataMin', 'dataMax']}
          tick={paleta.marca}
          tickFormatter={formatearEje}
          label={{ value: etiquetaX, position: 'insideBottom', offset: -12, fill: paleta.etiqueta, fontSize: 11 }}
          {...paleta.eje}
        />
        <YAxis
          tick={paleta.marca}
          width={58}
          tickFormatter={formatearEje}
          label={{ value: etiquetaY, angle: -90, position: 'insideLeft', fill: paleta.etiqueta, fontSize: 11 }}
          {...paleta.eje}
        />
        <Tooltip contentStyle={paleta.tooltip} formatter={(valor) => formatearEje(Number(valor))} cursor={CURSOR_VERTICAL} />
        <ReferenceLine y={0} stroke={paleta.referencia} strokeWidth={2} />
        <Scatter dataKey="residuo" name="Residuo" fill={color} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

interface SerieComparacion {
  nombre: string;
  color: string;
  puntos: { x: number; y: number }[];
}

// Los cuatro clústeres juntos en escala semilogarítmica: si el crecimiento es
// exponencial, cada nube se alinea sobre una recta con su propia pendiente.
export function GraficoComparacion({ series, etiquetaX, etiquetaY, altura = 380 }: {
  series: SerieComparacion[];
  etiquetaX: string;
  etiquetaY: string;
  altura?: number;
}) {
  const paleta = usarPaleta();
  const datos = series[0]?.puntos.map((punto, indice) => {
    const fila: Record<string, number> = { x: punto.x };
    series.forEach((serie) => {
      fila[serie.nombre] = serie.puntos[indice]?.y;
    });
    return fila;
  }) ?? [];

  return (
    <ResponsiveContainer width="100%" height={altura}>
      <ComposedChart data={datos} margin={{ top: 10, right: 16, left: 4, bottom: 26 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={paleta.grilla} />
        <XAxis
          dataKey="x"
          type="number"
          domain={['dataMin', 'dataMax']}
          tick={paleta.marca}
          tickFormatter={formatearEje}
          label={{ value: etiquetaX, position: 'insideBottom', offset: -14, fill: paleta.etiqueta, fontSize: 11 }}
          {...paleta.eje}
        />
        <YAxis
          tick={paleta.marca}
          width={58}
          scale="log"
          domain={['auto', 'auto']}
          tickFormatter={formatearEje}
          label={{ value: etiquetaY, angle: -90, position: 'insideLeft', fill: paleta.etiqueta, fontSize: 11 }}
          {...paleta.eje}
        />
        <Tooltip contentStyle={paleta.tooltip} formatter={(valor) => formatearEje(Number(valor))} />
        <Legend wrapperStyle={{ paddingTop: 16, fontSize: 12 }} />
        {series.map((serie) => (
          <Scatter key={serie.nombre} dataKey={serie.nombre} name={serie.nombre} fill={serie.color} isAnimationActive={false} />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

interface PropiedadesBarrasAgrupadas {
  // Una fila por grupo del eje X (cada clúster), con un valor por serie (cada modelo).
  datos: Record<string, string | number>[];
  claveGrupo: string;
  series: { clave: string; nombre: string; color: string }[];
  etiquetaY: string;
  umbral?: { valor: number; etiqueta: string };
  altura?: number;
}

// Barras agrupadas para comparar la bondad de ajuste de cada modelo en cada clúster.
// La línea de umbral permite ver de un vistazo qué modelos superan el 0,85 de referencia.
export function GraficoBarrasAgrupadas({
  datos,
  claveGrupo,
  series,
  etiquetaY,
  umbral,
  altura = 380,
}: PropiedadesBarrasAgrupadas) {
  const paleta = usarPaleta();

  return (
    <ResponsiveContainer width="100%" height={altura}>
      <BarChart data={datos} margin={{ top: 10, right: 16, left: 4, bottom: 26 }} barGap={2} barCategoryGap="18%">
        <CartesianGrid strokeDasharray="3 3" stroke={paleta.grilla} vertical={false} />
        <XAxis dataKey={claveGrupo} tick={paleta.marca} interval={0} {...paleta.eje} />
        <YAxis
          tick={paleta.marca}
          width={52}
          domain={[0, 1]}
          tickFormatter={(valor) => Number(valor).toFixed(1)}
          label={{ value: etiquetaY, angle: -90, position: 'insideLeft', fill: paleta.etiqueta, fontSize: 11 }}
          {...paleta.eje}
        />
        <Tooltip
          contentStyle={paleta.tooltip}
          formatter={(valor) => Number(valor).toFixed(4)}
          cursor={{ fill: paleta.grilla, opacity: 0.35 }}
        />
        <Legend wrapperStyle={{ paddingTop: 16, fontSize: 12 }} />
        {umbral && (
          <ReferenceLine
            y={umbral.valor}
            stroke="#ef4444"
            strokeDasharray="6 4"
            strokeWidth={2}
            label={{ value: umbral.etiqueta, position: 'right', fill: '#ef4444', fontSize: 10 }}
          />
        )}
        {series.map((serie) => (
          <Bar key={serie.clave} dataKey={serie.clave} name={serie.nombre} fill={serie.color} radius={[3, 3, 0, 0]} isAnimationActive={false} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

interface PropiedadesBarrasSimples {
  datos: { nombre: string; valor: number; color: string }[];
  etiquetaY: string;
  sufijo?: string;
  altura?: number;
}

// Barras simples con el valor escrito encima: una barra por especie.
export function GraficoBarrasSimples({ datos, etiquetaY, sufijo = '', altura = 320 }: PropiedadesBarrasSimples) {
  const paleta = usarPaleta();

  return (
    <ResponsiveContainer width="100%" height={altura}>
      <BarChart data={datos} margin={{ top: 24, right: 16, left: 4, bottom: 26 }} barCategoryGap="28%">
        <CartesianGrid strokeDasharray="3 3" stroke={paleta.grilla} vertical={false} />
        <XAxis dataKey="nombre" tick={paleta.marca} interval={0} {...paleta.eje} />
        <YAxis
          tick={paleta.marca}
          width={56}
          tickFormatter={(valor) => formatearEje(Number(valor))}
          label={{ value: etiquetaY, angle: -90, position: 'insideLeft', fill: paleta.etiqueta, fontSize: 11 }}
          {...paleta.eje}
        />
        <Tooltip
          contentStyle={paleta.tooltip}
          formatter={(valor) => `${Number(valor).toFixed(1)}${sufijo}`}
          cursor={{ fill: paleta.grilla, opacity: 0.35 }}
        />
        <Bar dataKey="valor" name={etiquetaY} radius={[4, 4, 0, 0]} isAnimationActive={false}>
          {datos.map((fila) => (
            <Cell key={fila.nombre} fill={fila.color} />
          ))}
          <LabelList
            dataKey="valor"
            position="top"
            formatter={(valor) => Number(valor).toFixed(1)}
            style={{ fill: paleta.marca.fill, fontSize: 11, fontWeight: 700 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
