// Ajuste por mínimos cuadrados siguiendo el apunte de cátedra:
// cada modelo no lineal se linealiza, se arma el sistema de ecuaciones normales
// y se resuelve por sustitución (eliminación + despeje), que es como se escribe
// a mano y es el mismo camino que la factorización de Crout hace de forma exacta.
// Se registran las sumatorias y los pasos intermedios para poder mostrar el
// procedimiento, no sólo el resultado.

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

export interface Sustitucion2x2 {
  a1: number;
  a2: number;
  numerador: number;
  denominador: number;
}

// Sistema normal 2×2:
//   n · a1 + Sx · a2 = Sy
//   Sx · a1 + Sxx · a2 = Sxy
// Se despeja a1 de la primera ecuación, se reemplaza en la segunda y queda una
// sola incógnita. Es el mismo resultado que daría Cramer, pero leído como se
// resuelve a mano.
export function resolver2x2PorSustitucion(
  n: number,
  sx: number,
  sxx: number,
  sy: number,
  sxy: number
): Sustitucion2x2 {
  const numerador = sxy - (sx * sy) / n;
  const denominador = sxx - (sx * sx) / n;
  const a2 = numerador / denominador;
  const a1 = (sy - sx * a2) / n;
  return { a1, a2, numerador, denominador };
}

// Eliminación hacia adelante + sustitución hacia atrás para el sistema 3×3 del
// modelo polinómico. Las matrices normales de mínimos cuadrados son simétricas y
// definidas positivas, así que con datos reales el pivote nunca se anula.
// ponytail: sin pivoteo parcial; agregarlo si alguna vez se ajustan grados altos.
export function resolverPorEliminacion(
  A: number[][],
  b: number[]
): { solucion: number[]; triangular: number[][] } {
  const n = A.length;
  const M = A.map((fila, i) => [...fila, b[i]]);
  for (let k = 0; k < n - 1; k++) {
    for (let i = k + 1; i < n; i++) {
      const factor = M[i][k] / M[k][k];
      for (let j = k; j <= n; j++) M[i][j] -= factor * M[k][j];
    }
  }
  const solucion = new Array<number>(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let acumulado = 0;
    for (let j = i + 1; j < n; j++) acumulado += M[i][j] * solucion[j];
    solucion[i] = (M[i][n] - acumulado) / M[i][i];
  }
  return { solucion, triangular: M };
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

// Los cuatro pasos de la sustitución con los números ya reemplazados. Los símbolos
// se reciben por parámetro para poder reutilizarlos en y/x, ln(y)/x, ln(y)/ln(x)
// y 1/y contra 1/x sin duplicar el texto.
interface SimbolosSistema {
  a: string;
  b: string;
  sx: string;
  sxx: string;
  sy: string;
  sxy: string;
}

function pasosSustitucion2x2(
  sumas: { n: number; sx: number; sxx: number; sy: number; sxy: number },
  simbolos: SimbolosSistema,
  resultado: Sustitucion2x2,
  decimalesA = 4,
  decimalesB = 4
): { titulo: string; tex: string }[] {
  const { n, sx, sy } = sumas;
  const { a, b } = simbolos;
  const { a1, a2, numerador, denominador } = resultado;

  return [
    {
      titulo: 'Despejo el primer coeficiente de la primera ecuación',
      tex: `${a} = \\dfrac{${simbolos.sy} - ${simbolos.sx} \\cdot ${b}}{n} = \\dfrac{${tex(sy)} - ${tex(sx)} \\, ${b}}{${tex(n)}}`,
    },
    {
      titulo: 'Reemplazo en la segunda ecuación',
      tex: `${simbolos.sx} \\cdot \\dfrac{${simbolos.sy} - ${simbolos.sx} \\cdot ${b}}{n} + ${simbolos.sxx} \\cdot ${b} = ${simbolos.sxy}`,
    },
    {
      titulo: 'Agrupo y despejo la única incógnita que queda',
      tex: `${b} = \\dfrac{${simbolos.sxy} - \\dfrac{${simbolos.sx} \\cdot ${simbolos.sy}}{n}}{${simbolos.sxx} - \\dfrac{\\left(${simbolos.sx}\\right)^2}{n}} = \\dfrac{${tex(numerador)}}{${tex(denominador)}} = ${tex(a2, decimalesB)}`,
    },
    {
      titulo: 'Vuelvo a la primera ecuación con ese valor',
      tex: `${a} = \\dfrac{${tex(sy)} - ${tex(sx)} \\cdot ${tex(a2, decimalesB)}}{${tex(n)}} = ${tex(a1, decimalesA)}`,
    },
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

  const sustitucion = resolver2x2PorSustitucion(n, sx, sxx, sy, sxy);
  const { a1, a2 } = sustitucion;
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
    pasos: pasosSustitucion2x2(
      { n, sx, sxx, sy, sxy },
      { a: 'a_1', b: 'a_2', sx: '\\sum x_i', sxx: '\\sum x_i^2', sy: '\\sum y_i', sxy: '\\sum x_i y_i' },
      sustitucion
    ),
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

  const sustitucion = resolver2x2PorSustitucion(n, sx, sxx, slny, sxlny);
  const lnA = sustitucion.a1;
  const b = sustitucion.a2;
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
      ...pasosSustitucion2x2(
        { n, sx, sxx, sy: slny, sxy: sxlny },
        { a: '\\ln(a)', b: 'b', sx: '\\sum x_i', sxx: '\\sum x_i^2', sy: '\\sum \\ln(y_i)', sxy: '\\sum x_i \\ln(y_i)' },
        sustitucion,
        6,
        6
      ),
      { titulo: 'Recupero a deshaciendo el logaritmo', tex: `a = e^{\\ln(a)} = e^{${tex(lnA, 6)}} = ${tex(a, 2)}` },
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

  const sustitucion = resolver2x2PorSustitucion(n, slnx, slnxx, slny, slnxlny);
  const lnA = sustitucion.a1;
  const b = sustitucion.a2;
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
      ...pasosSustitucion2x2(
        { n, sx: slnx, sxx: slnxx, sy: slny, sxy: slnxlny },
        {
          a: '\\ln(a)',
          b: 'b',
          sx: '\\sum \\ln(x_i)',
          sxx: '\\sum (\\ln x_i)^2',
          sy: '\\sum \\ln(y_i)',
          sxy: '\\sum \\ln(x_i)\\ln(y_i)',
        },
        sustitucion,
        6,
        6
      ),
      { titulo: 'Recupero a deshaciendo el logaritmo', tex: `a = e^{\\ln(a)} = e^{${tex(lnA, 6)}} = ${tex(a, 2)}` },
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

  const { solucion, triangular } = resolverPorEliminacion(
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
      {
        titulo: 'Triangulo el sistema eliminando hacia abajo',
        tex: `\\left[\\begin{array}{ccc|c} ${tex(triangular[0][0])} & ${tex(triangular[0][1])} & ${tex(triangular[0][2])} & ${tex(triangular[0][3])} \\\\ 0 & ${tex(triangular[1][1])} & ${tex(triangular[1][2])} & ${tex(triangular[1][3])} \\\\ 0 & 0 & ${tex(triangular[2][2])} & ${tex(triangular[2][3])} \\end{array}\\right]`,
      },
      {
        titulo: 'Sustitución hacia atrás · coeficiente cuadrático',
        tex: `a_3 = \\dfrac{${tex(triangular[2][3])}}{${tex(triangular[2][2])}} = ${tex(a3, 6)}`,
      },
      {
        titulo: 'Sustitución hacia atrás · coeficiente lineal',
        tex: `a_2 = \\dfrac{${tex(triangular[1][3])} - ${tex(triangular[1][2])} \\cdot a_3}{${tex(triangular[1][1])}} = ${tex(a2, 4)}`,
      },
      {
        titulo: 'Sustitución hacia atrás · coeficiente independiente',
        tex: `a_1 = \\dfrac{${tex(triangular[0][3])} - ${tex(triangular[0][1])} \\cdot a_2 - ${tex(triangular[0][2])} \\cdot a_3}{${tex(triangular[0][0])}} = ${tex(a1, 2)}`,
      },
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

  const sustitucion = resolver2x2PorSustitucion(n, sInvX, sInvXX, sInvY, sInvXY);
  const invA = sustitucion.a1;
  const bSobreA = sustitucion.a2;
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
      ...pasosSustitucion2x2(
        { n, sx: sInvX, sxx: sInvXX, sy: sInvY, sxy: sInvXY },
        {
          a: '\\tfrac{1}{a}',
          b: '\\tfrac{b}{a}',
          sx: '\\sum \\tfrac{1}{x_i}',
          sxx: '\\sum \\left(\\tfrac{1}{x_i}\\right)^2',
          sy: '\\sum \\tfrac{1}{y_i}',
          sxy: '\\sum \\tfrac{1}{x_i}\\tfrac{1}{y_i}',
        },
        sustitucion,
        10,
        6
      ),
      { titulo: 'Recupero a invirtiendo el primer coeficiente', tex: `a = \\dfrac{1}{\\tfrac{1}{a}} = ${tex(a, 2)}` },
      { titulo: 'Recupero b multiplicando por a', tex: `b = \\tfrac{b}{a} \\cdot a = ${tex(b, 4)}` },
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
