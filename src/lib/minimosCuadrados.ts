// Ajuste por mínimos cuadrados siguiendo el apunte de cátedra:
// cada modelo no lineal se linealiza, se arma el sistema de ecuaciones normales
// y se resuelve por determinantes (Cramer). Se registran las sumatorias y los
// pasos intermedios para poder mostrar el procedimiento, no sólo el resultado.

export type ClaveModelo = 'lineal' | 'exponencial' | 'potencial' | 'polinomico2' | 'cociente';

export interface Sumatoria {
  simbolo: string; // TeX
  valor: number;
}

export interface Ajuste {
  clave: ClaveModelo;
  nombre: string;
  // Forma general del modelo y su linealización, en TeX.
  formaTex: string;
  linealizacionTex: string;
  // Parámetros finales del modelo, ya des-linealizados.
  parametros: { simbolo: string; valor: number; unidad?: string }[];
  ecuacionTex: string; // ecuación de ajuste con los valores numéricos
  sumatorias: Sumatoria[];
  sistemaTex: string[]; // ecuaciones normales con los números reemplazados
  pasos: { titulo: string; tex: string }[];
  // Bondad del ajuste, calculada sobre la variable efectivamente minimizada.
  espacio: string; // descripción del espacio donde se midió r² (y, ln y, 1/y)
  media: number;
  ST: number;
  SR: number;
  r2: number;
  // Predicción en el espacio original del fenómeno.
  predecir: (x: number) => number;
  // Residuos en el espacio original: y_i − y_ajuste(x_i).
  residuos: number[];
  // Residuos en el espacio linealizado (donde se minimizó).
  residuosLinealizados: number[];
  valido: boolean;
  motivo?: string;
}

export const redondear = (valor: number, decimales = 4) => {
  const factor = 10 ** decimales;
  const r = Math.round(valor * factor) / factor;
  return Object.is(r, -0) ? 0 : r;
};

// Formatea un número para mostrarlo dentro de una fórmula TeX, sin notación
// científica de JS (que TeX no entiende) y con separación legible.
export function formatearNumero(valor: number, decimales = 4): string {
  if (!isFinite(valor)) return '—';
  const abs = Math.abs(valor);
  if (abs !== 0 && (abs < 1e-4 || abs >= 1e7)) {
    const exponente = Math.floor(Math.log10(abs));
    const mantisa = valor / 10 ** exponente;
    return `${redondear(mantisa, 4)} \\cdot 10^{${exponente}}`;
  }
  return String(redondear(valor, decimales));
}

const suma = (valores: number[]) => valores.reduce((acumulado, v) => acumulado + v, 0);

// Resuelve un sistema lineal n×n por Cramer. n es 2 o 3 en todos los modelos del apunte.
function determinante(m: number[][]): number {
  const n = m.length;
  if (n === 1) return m[0][0];
  if (n === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];
  let total = 0;
  for (let j = 0; j < n; j++) {
    const menor = m.slice(1).map((fila) => fila.filter((_, c) => c !== j));
    total += (j % 2 === 0 ? 1 : -1) * m[0][j] * determinante(menor);
  }
  return total;
}

export function resolverPorCramer(A: number[][], b: number[]): { solucion: number[]; delta: number; deltas: number[] } {
  const delta = determinante(A);
  const deltas = A.map((_, columna) =>
    determinante(A.map((fila, i) => fila.map((valor, j) => (j === columna ? b[i] : valor))))
  );
  return { solucion: deltas.map((d) => d / delta), delta, deltas };
}

// Bondad del ajuste según el apunte: r² = (ST − SR) / ST, medido sobre la
// variable que efectivamente se minimizó (y, ln y o 1/y según el modelo).
function bondad(valoresObservados: number[], valoresAjustados: number[]) {
  const media = suma(valoresObservados) / valoresObservados.length;
  const ST = suma(valoresObservados.map((v) => (v - media) ** 2));
  const SR = suma(valoresObservados.map((v, i) => (v - valoresAjustados[i]) ** 2));
  return { media, ST, SR, r2: ST === 0 ? 0 : (ST - SR) / ST };
}

const tex = (v: number, d = 4) => formatearNumero(v, d);

// Arma las dos filas del sistema normal 2×2 con los números ya reemplazados.
function sistema2x2Tex(n: number, sx: number, sxx: number, sy: number, sxy: number, a: string, b: string): string[] {
  return [
    `${tex(n)} \\cdot ${a} + ${tex(sx)} \\cdot ${b} = ${tex(sy)}`,
    `${tex(sx)} \\cdot ${a} + ${tex(sxx)} \\cdot ${b} = ${tex(sxy)}`,
  ];
}

interface OpcionesAjuste {
  x: number[];
  y: number[];
  unidadPendiente?: string;
}

// ─────────────────────────── Modelos ───────────────────────────

export function ajustarLineal({ x, y }: OpcionesAjuste): Ajuste {
  const n = x.length;
  const sx = suma(x);
  const sy = suma(y);
  const sxx = suma(x.map((v) => v * v));
  const sxy = suma(x.map((v, i) => v * y[i]));

  const { solucion, delta, deltas } = resolverPorCramer([[n, sx], [sx, sxx]], [sy, sxy]);
  const [a1, a2] = solucion;
  const predecir = (v: number) => a1 + a2 * v;
  const ajustados = x.map(predecir);
  const { media, ST, SR, r2 } = bondad(y, ajustados);

  return {
    clave: 'lineal',
    nombre: 'Lineal',
    formaTex: 'y = a_1 + a_2 \\cdot x',
    linealizacionTex: 'No requiere linealización: ya es lineal respecto de los coeficientes.',
    parametros: [
      { simbolo: 'a_1', valor: a1 },
      { simbolo: 'a_2', valor: a2 },
    ],
    ecuacionTex: `y = ${tex(a1)} + ${tex(a2)} \\cdot x`,
    sumatorias: [
      { simbolo: 'n', valor: n },
      { simbolo: '\\sum x_i', valor: sx },
      { simbolo: '\\sum x_i^2', valor: sxx },
      { simbolo: '\\sum y_i', valor: sy },
      { simbolo: '\\sum x_i y_i', valor: sxy },
    ],
    sistemaTex: sistema2x2Tex(n, sx, sxx, sy, sxy, 'a_1', 'a_2'),
    pasos: [
      { titulo: 'Determinante del sistema', tex: `\\Delta = n \\cdot \\sum x_i^2 - \\left(\\sum x_i\\right)^2 = ${tex(delta)}` },
      { titulo: 'Ordenada al origen', tex: `a_1 = \\frac{\\Delta_1}{\\Delta} = \\frac{${tex(deltas[0])}}{${tex(delta)}} = ${tex(a1)}` },
      { titulo: 'Pendiente', tex: `a_2 = \\frac{\\Delta_2}{\\Delta} = \\frac{${tex(deltas[1])}}{${tex(delta)}} = ${tex(a2)}` },
    ],
    espacio: 'y',
    media,
    ST,
    SR,
    r2,
    predecir,
    residuos: y.map((v, i) => v - ajustados[i]),
    residuosLinealizados: y.map((v, i) => v - ajustados[i]),
    valido: true,
  };
}

export function ajustarExponencial({ x, y, unidadPendiente }: OpcionesAjuste): Ajuste {
  const positivos = y.every((v) => v > 0);
  const n = x.length;

  if (!positivos) {
    return modeloInvalido('exponencial', 'Exponencial', 'y = a \\cdot e^{b x}', 'El modelo exige y > 0 para poder aplicar logaritmo natural.');
  }

  const lny = y.map(Math.log);
  const sx = suma(x);
  const sxx = suma(x.map((v) => v * v));
  const slny = suma(lny);
  const sxlny = suma(x.map((v, i) => v * lny[i]));

  const { solucion, delta, deltas } = resolverPorCramer([[n, sx], [sx, sxx]], [slny, sxlny]);
  const [lnA, b] = solucion;
  const a = Math.exp(lnA);

  const predecir = (v: number) => a * Math.exp(b * v);
  const ajustadosLineales = x.map((v) => lnA + b * v);
  const { media, ST, SR, r2 } = bondad(lny, ajustadosLineales);

  return {
    clave: 'exponencial',
    nombre: 'Exponencial',
    formaTex: 'y = a \\cdot e^{b x}',
    linealizacionTex: '\\ln(y) = \\ln(a) + b \\cdot x',
    parametros: [
      { simbolo: 'a', valor: a },
      { simbolo: 'b', valor: b, unidad: unidadPendiente },
    ],
    ecuacionTex: `y = ${tex(a, 2)} \\cdot e^{${tex(b, 6)} \\, x}`,
    sumatorias: [
      { simbolo: 'n', valor: n },
      { simbolo: '\\sum x_i', valor: sx },
      { simbolo: '\\sum x_i^2', valor: sxx },
      { simbolo: '\\sum \\ln(y_i)', valor: slny },
      { simbolo: '\\sum x_i \\ln(y_i)', valor: sxlny },
    ],
    sistemaTex: sistema2x2Tex(n, sx, sxx, slny, sxlny, '\\ln(a)', 'b'),
    pasos: [
      { titulo: 'Determinante del sistema', tex: `\\Delta = n \\cdot \\sum x_i^2 - \\left(\\sum x_i\\right)^2 = ${tex(delta)}` },
      { titulo: 'Primer coeficiente', tex: `\\ln(a) = \\frac{\\Delta_1}{\\Delta} = \\frac{${tex(deltas[0])}}{${tex(delta)}} = ${tex(lnA, 6)}` },
      { titulo: 'Recupero de a', tex: `a = e^{\\ln(a)} = e^{${tex(lnA, 6)}} = ${tex(a, 2)}` },
      { titulo: 'Segundo coeficiente', tex: `b = \\frac{\\Delta_2}{\\Delta} = \\frac{${tex(deltas[1])}}{${tex(delta)}} = ${tex(b, 6)}` },
    ],
    espacio: '\\ln(y)',
    media,
    ST,
    SR,
    r2,
    predecir,
    residuos: y.map((v, i) => v - predecir(x[i])),
    residuosLinealizados: lny.map((v, i) => v - ajustadosLineales[i]),
    valido: true,
  };
}

export function ajustarPotencial({ x, y }: OpcionesAjuste): Ajuste {
  // La linealización usa ln(x), así que los x nulos o negativos quedan fuera del dominio.
  const indices = x.map((_, i) => i).filter((i) => x[i] > 0 && y[i] > 0);
  const n = indices.length;

  if (n < 2) {
    return modeloInvalido('potencial', 'Potencial', 'y = a \\cdot x^{b}', 'El modelo exige x > 0 e y > 0 para aplicar logaritmo a ambas variables.');
  }

  const lnx = indices.map((i) => Math.log(x[i]));
  const lny = indices.map((i) => Math.log(y[i]));
  const slnx = suma(lnx);
  const slnxx = suma(lnx.map((v) => v * v));
  const slny = suma(lny);
  const slnxlny = suma(lnx.map((v, i) => v * lny[i]));

  const { solucion, delta, deltas } = resolverPorCramer([[n, slnx], [slnx, slnxx]], [slny, slnxlny]);
  const [lnA, b] = solucion;
  const a = Math.exp(lnA);

  const predecir = (v: number) => (v > 0 ? a * v ** b : NaN);
  const ajustadosLineales = lnx.map((v) => lnA + b * v);
  const { media, ST, SR, r2 } = bondad(lny, ajustadosLineales);

  const descartados = x.length - n;

  return {
    clave: 'potencial',
    nombre: 'Potencial',
    formaTex: 'y = a \\cdot x^{b}',
    linealizacionTex: '\\ln(y) = \\ln(a) + b \\cdot \\ln(x)',
    parametros: [
      { simbolo: 'a', valor: a },
      { simbolo: 'b', valor: b },
    ],
    ecuacionTex: `y = ${tex(a, 2)} \\cdot x^{${tex(b, 4)}}`,
    sumatorias: [
      { simbolo: 'n', valor: n },
      { simbolo: '\\sum \\ln(x_i)', valor: slnx },
      { simbolo: '\\sum (\\ln x_i)^2', valor: slnxx },
      { simbolo: '\\sum \\ln(y_i)', valor: slny },
      { simbolo: '\\sum \\ln(x_i)\\ln(y_i)', valor: slnxlny },
    ],
    sistemaTex: sistema2x2Tex(n, slnx, slnxx, slny, slnxlny, '\\ln(a)', 'b'),
    pasos: [
      { titulo: 'Determinante del sistema', tex: `\\Delta = n \\cdot \\sum (\\ln x_i)^2 - \\left(\\sum \\ln x_i\\right)^2 = ${tex(delta)}` },
      { titulo: 'Primer coeficiente', tex: `\\ln(a) = \\frac{${tex(deltas[0])}}{${tex(delta)}} = ${tex(lnA, 6)}` },
      { titulo: 'Recupero de a', tex: `a = e^{${tex(lnA, 6)}} = ${tex(a, 2)}` },
      { titulo: 'Segundo coeficiente', tex: `b = \\frac{${tex(deltas[1])}}{${tex(delta)}} = ${tex(b, 6)}` },
    ],
    espacio: '\\ln(y)',
    media,
    ST,
    SR,
    r2,
    predecir,
    residuos: x.map((v, i) => y[i] - predecir(v)),
    residuosLinealizados: lny.map((v, i) => v - ajustadosLineales[i]),
    valido: true,
    motivo: descartados > 0 ? `Se descartan ${descartados} punto(s) con x = 0: ln(x) no está definido en el origen.` : undefined,
  };
}

export function ajustarPolinomico2({ x, y }: OpcionesAjuste): Ajuste {
  const n = x.length;
  const sx = suma(x);
  const sx2 = suma(x.map((v) => v ** 2));
  const sx3 = suma(x.map((v) => v ** 3));
  const sx4 = suma(x.map((v) => v ** 4));
  const sy = suma(y);
  const sxy = suma(x.map((v, i) => v * y[i]));
  const sx2y = suma(x.map((v, i) => v ** 2 * y[i]));

  const { solucion, delta, deltas } = resolverPorCramer(
    [
      [n, sx, sx2],
      [sx, sx2, sx3],
      [sx2, sx3, sx4],
    ],
    [sy, sxy, sx2y]
  );
  const [a1, a2, a3] = solucion;
  const predecir = (v: number) => a1 + a2 * v + a3 * v * v;
  const ajustados = x.map(predecir);
  const { media, ST, SR, r2 } = bondad(y, ajustados);

  return {
    clave: 'polinomico2',
    nombre: 'Polinómico (2º grado)',
    formaTex: 'y = a_1 + a_2 x + a_3 x^2',
    linealizacionTex: 'No requiere linealización: es lineal respecto de los coeficientes.',
    parametros: [
      { simbolo: 'a_1', valor: a1 },
      { simbolo: 'a_2', valor: a2 },
      { simbolo: 'a_3', valor: a3 },
    ],
    ecuacionTex: `y = ${tex(a1, 2)} + ${tex(a2, 4)} \\, x + ${tex(a3, 6)} \\, x^2`,
    sumatorias: [
      { simbolo: 'n', valor: n },
      { simbolo: '\\sum x_i', valor: sx },
      { simbolo: '\\sum x_i^2', valor: sx2 },
      { simbolo: '\\sum x_i^3', valor: sx3 },
      { simbolo: '\\sum x_i^4', valor: sx4 },
      { simbolo: '\\sum y_i', valor: sy },
      { simbolo: '\\sum x_i y_i', valor: sxy },
      { simbolo: '\\sum x_i^2 y_i', valor: sx2y },
    ],
    sistemaTex: [
      `${tex(n)} a_1 + ${tex(sx)} a_2 + ${tex(sx2)} a_3 = ${tex(sy)}`,
      `${tex(sx)} a_1 + ${tex(sx2)} a_2 + ${tex(sx3)} a_3 = ${tex(sxy)}`,
      `${tex(sx2)} a_1 + ${tex(sx3)} a_2 + ${tex(sx4)} a_3 = ${tex(sx2y)}`,
    ],
    pasos: [
      { titulo: 'Determinante del sistema', tex: `\\Delta = ${tex(delta)}` },
      { titulo: 'Coeficiente independiente', tex: `a_1 = \\frac{${tex(deltas[0])}}{${tex(delta)}} = ${tex(a1, 2)}` },
      { titulo: 'Coeficiente lineal', tex: `a_2 = \\frac{${tex(deltas[1])}}{${tex(delta)}} = ${tex(a2, 4)}` },
      { titulo: 'Coeficiente cuadrático', tex: `a_3 = \\frac{${tex(deltas[2])}}{${tex(delta)}} = ${tex(a3, 6)}` },
    ],
    espacio: 'y',
    media,
    ST,
    SR,
    r2,
    predecir,
    residuos: y.map((v, i) => v - ajustados[i]),
    residuosLinealizados: y.map((v, i) => v - ajustados[i]),
    valido: true,
  };
}

export function ajustarCociente({ x, y }: OpcionesAjuste): Ajuste {
  // Linealización 1/y = 1/a + (b/a)·(1/x): quedan fuera los puntos con x = 0 o y = 0.
  const indices = x.map((_, i) => i).filter((i) => x[i] !== 0 && y[i] !== 0);
  const n = indices.length;

  if (n < 2) {
    return modeloInvalido('cociente', 'Cociente (crecimiento saturado)', 'y = a \\cdot \\frac{x}{b + x}', 'El modelo exige x ≠ 0 e y ≠ 0 para poder invertir ambas variables.');
  }

  const invX = indices.map((i) => 1 / x[i]);
  const invY = indices.map((i) => 1 / y[i]);
  const sInvX = suma(invX);
  const sInvXX = suma(invX.map((v) => v * v));
  const sInvY = suma(invY);
  const sInvXY = suma(invX.map((v, i) => v * invY[i]));

  const { solucion, delta, deltas } = resolverPorCramer([[n, sInvX], [sInvX, sInvXX]], [sInvY, sInvXY]);
  const [invA, bSobreA] = solucion;
  const a = 1 / invA;
  const b = bSobreA * a;

  const predecir = (v: number) => (a * v) / (b + v);
  const ajustadosLineales = invX.map((v) => invA + bSobreA * v);
  const { media, ST, SR, r2 } = bondad(invY, ajustadosLineales);

  const descartados = x.length - n;

  return {
    clave: 'cociente',
    nombre: 'Cociente (crecimiento saturado)',
    formaTex: 'y = a \\cdot \\dfrac{x}{b + x}',
    linealizacionTex: '\\dfrac{1}{y} = \\dfrac{1}{a} + \\dfrac{b}{a} \\cdot \\dfrac{1}{x}',
    parametros: [
      { simbolo: 'a', valor: a },
      { simbolo: 'b', valor: b },
    ],
    ecuacionTex: `y = ${tex(a, 2)} \\cdot \\dfrac{x}{${tex(b, 2)} + x}`,
    sumatorias: [
      { simbolo: 'n', valor: n },
      { simbolo: '\\sum \\frac{1}{x_i}', valor: sInvX },
      { simbolo: '\\sum \\left(\\frac{1}{x_i}\\right)^2', valor: sInvXX },
      { simbolo: '\\sum \\frac{1}{y_i}', valor: sInvY },
      { simbolo: '\\sum \\frac{1}{x_i}\\cdot\\frac{1}{y_i}', valor: sInvXY },
    ],
    sistemaTex: sistema2x2Tex(n, sInvX, sInvXX, sInvY, sInvXY, '\\tfrac{1}{a}', '\\tfrac{b}{a}'),
    pasos: [
      { titulo: 'Determinante del sistema', tex: `\\Delta = ${tex(delta)}` },
      { titulo: 'Primer coeficiente', tex: `\\frac{1}{a} = \\frac{${tex(deltas[0])}}{${tex(delta)}} = ${formatearNumero(invA, 10)}` },
      { titulo: 'Recupero de a', tex: `a = ${tex(a, 2)}` },
      { titulo: 'Recupero de b', tex: `b = \\frac{b}{a} \\cdot a = ${tex(b, 4)}` },
    ],
    espacio: '1/y',
    media,
    ST,
    SR,
    r2,
    predecir,
    residuos: x.map((v, i) => y[i] - predecir(v)),
    residuosLinealizados: invY.map((v, i) => v - ajustadosLineales[i]),
    valido: true,
    motivo: descartados > 0 ? `Se descartan ${descartados} punto(s) con x = 0: la linealización invierte x.` : undefined,
  };
}

function modeloInvalido(clave: ClaveModelo, nombre: string, formaTex: string, motivo: string): Ajuste {
  return {
    clave,
    nombre,
    formaTex,
    linealizacionTex: '',
    parametros: [],
    ecuacionTex: '',
    sumatorias: [],
    sistemaTex: [],
    pasos: [],
    espacio: 'y',
    media: NaN,
    ST: NaN,
    SR: NaN,
    r2: NaN,
    predecir: () => NaN,
    residuos: [],
    residuosLinealizados: [],
    valido: false,
    motivo,
  };
}

export const AJUSTADORES: Record<ClaveModelo, (opciones: OpcionesAjuste) => Ajuste> = {
  lineal: ajustarLineal,
  exponencial: ajustarExponencial,
  potencial: ajustarPotencial,
  polinomico2: ajustarPolinomico2,
  cociente: ajustarCociente,
};

// Calcula los cinco modelos candidatos sobre un mismo conjunto de datos.
export function ajustarTodos(opciones: OpcionesAjuste): Ajuste[] {
  return (Object.keys(AJUSTADORES) as ClaveModelo[]).map((clave) => AJUSTADORES[clave](opciones));
}

// Tiempo de duplicación de un modelo exponencial: t½ = ln(2) / b.
export function tiempoDeDuplicacion(b: number): number {
  return Math.LN2 / b;
}
