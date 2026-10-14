// Métodos de paso simple para problemas de valor inicial y' = f(x, y), y(x0) = y0,
// tal como los presenta el apunte de cátedra: Taylor de grado 2, Euler Mejorado y
// Runge-Kutta de grado 2. Cada iteración guarda sus valores intermedios para poder
// mostrar la sustitución numérica, no sólo el resultado.

export type ClaveMetodo = 'taylor' | 'eulerMejorado' | 'rk2';

export interface Problema {
  clave: string;
  ecuacionTex: string;
  condicionTex: string;
  origen: string; // ejercicios de la práctica donde aparece
  x0: number;
  y0: number;
  xf: number;
  h: number;
  f: (x: number, y: number) => number;
  // Derivada total y'' = f_x + f_y · f, que Taylor necesita de forma analítica.
  segunda: (x: number, y: number) => number;
  segundaTex: string;
  exacta: (x: number) => number;
  exactaTex: string;
  resolucionExactaTex: string[];
}

export interface Iteracion {
  n: number;
  x: number;
  y: number;
  intermedios: { simbolo: string; valor: number }[];
  siguiente: number;
}

export const PROBLEMAS: Problema[] = [
  {
    clave: '2xy',
    ecuacionTex: "y' = 2xy",
    condicionTex: 'y(1) = 1 \\; , \\quad h = 0.1 \\; , \\quad \\text{hallar } y(1.5)',
    origen: 'Taylor 1-c · Euler Mejorado 3-a · RK2 1-c',
    x0: 1,
    y0: 1,
    xf: 1.5,
    h: 0.1,
    f: (x, y) => 2 * x * y,
    segunda: (x, y) => 2 * y + 4 * x * x * y,
    segundaTex: "y'' = f_x + f_y \\cdot y' = 2y + (2x)(2xy) = 2y + 4x^2 y",
    exacta: (x) => Math.exp(x * x - 1),
    exactaTex: 'y(x) = e^{x^2 - 1}',
    resolucionExactaTex: [
      '\\frac{dy}{y} = 2x \\, dx',
      '\\ln|y| = x^2 + C',
      'y(1) = 1 \\;\\Rightarrow\\; C = -1 \\;\\Rightarrow\\; y = e^{x^2 - 1}',
    ],
  },
  {
    clave: '3x2y',
    ecuacionTex: "y' = 3x^2 y",
    condicionTex: 'y(0) = 3 \\; , \\quad h = 0.1 \\; , \\quad \\text{hallar } y(0.5)',
    origen: 'Taylor 1-a · RK2 1-a',
    x0: 0,
    y0: 3,
    xf: 0.5,
    h: 0.1,
    f: (x, y) => 3 * x * x * y,
    segunda: (x, y) => 6 * x * y + 9 * x ** 4 * y,
    segundaTex: "y'' = f_x + f_y \\cdot y' = 6xy + (3x^2)(3x^2 y) = 6xy + 9x^4 y",
    exacta: (x) => 3 * Math.exp(x ** 3),
    exactaTex: 'y(x) = 3 \\, e^{x^3}',
    resolucionExactaTex: [
      '\\frac{dy}{y} = 3x^2 \\, dx',
      '\\ln|y| = x^3 + C',
      'y(0) = 3 \\;\\Rightarrow\\; C = \\ln 3 \\;\\Rightarrow\\; y = 3 \\, e^{x^3}',
    ],
  },
  {
    clave: '1+y2',
    ecuacionTex: "y' = \\tfrac{1}{4}\\left(1 + y^2\\right)",
    condicionTex: 'y(0) = 1 \\; , \\quad h = 0.1 \\; , \\quad \\text{hallar } y(0.5)',
    origen: 'Taylor 1-b · RK2 1-b',
    x0: 0,
    y0: 1,
    xf: 0.5,
    h: 0.1,
    f: (_x, y) => (1 + y * y) / 4,
    segunda: (_x, y) => (y * (1 + y * y)) / 8,
    segundaTex: "y'' = f_x + f_y \\cdot y' = 0 + \\tfrac{y}{2} \\cdot \\tfrac{1}{4}(1 + y^2) = \\tfrac{1}{8} \\, y \\, (1 + y^2)",
    exacta: (x) => Math.tan(x / 4 + Math.PI / 4),
    exactaTex: 'y(x) = \\tan\\!\\left(\\tfrac{x}{4} + \\tfrac{\\pi}{4}\\right)',
    resolucionExactaTex: [
      '\\frac{dy}{1 + y^2} = \\tfrac{1}{4} \\, dx',
      '\\arctan(y) = \\tfrac{x}{4} + C',
      'y(0) = 1 \\;\\Rightarrow\\; C = \\tfrac{\\pi}{4} \\;\\Rightarrow\\; y = \\tan\\!\\left(\\tfrac{x}{4} + \\tfrac{\\pi}{4}\\right)',
    ],
  },
];

// Un paso de cada método, a partir de (x, y). Devuelve y_{n+1} y los valores intermedios.
function paso(metodo: ClaveMetodo, p: Problema, x: number, y: number, h: number) {
  if (metodo === 'taylor') {
    const d1 = p.f(x, y);
    const d2 = p.segunda(x, y);
    return { siguiente: y + h * d1 + (h * h / 2) * d2, intermedios: [{ simbolo: "y_n'", valor: d1 }, { simbolo: "y_n''", valor: d2 }] };
  }
  if (metodo === 'eulerMejorado') {
    const d1 = p.f(x, y);
    const predictor = y + h * d1;
    const pendienteFinal = p.f(x + h, predictor);
    return {
      siguiente: y + (h / 2) * (d1 + pendienteFinal),
      intermedios: [
        { simbolo: "y_n'", valor: d1 },
        { simbolo: "y_n + h \\, y_n'", valor: predictor },
        { simbolo: "f(x_{n+1}, \\, y_n + h \\, y_n')", valor: pendienteFinal },
      ],
    };
  }
  const k1 = h * p.f(x, y);
  const pendienteMedia = p.f(x + h / 2, y + k1 / 2);
  return {
    siguiente: y + h * pendienteMedia,
    intermedios: [
      { simbolo: 'k_1', valor: k1 },
      { simbolo: 'f(x_n + \\tfrac{h}{2}, \\, y_n + \\tfrac{k_1}{2})', valor: pendienteMedia },
    ],
  };
}

// La cantidad de pasos se redondea para que 0.1 · 5 no quede en 4.9999 iteraciones.
export const cantidadDePasos = (p: Problema, h: number) => Math.round((p.xf - p.x0) / h);

export function resolver(metodo: ClaveMetodo, p: Problema, h = p.h): Iteracion[] {
  const iteraciones: Iteracion[] = [];
  let y = p.y0;
  for (let n = 0; n < cantidadDePasos(p, h); n++) {
    const x = p.x0 + n * h;
    const r = paso(metodo, p, x, y, h);
    iteraciones.push({ n, x, y, ...r });
    y = r.siguiente;
  }
  return iteraciones;
}

// Aproximación final y(x_f) de un método con paso h.
export const valorFinal = (metodo: ClaveMetodo, p: Problema, h = p.h) => {
  const it = resolver(metodo, p, h);
  return it.length ? it[it.length - 1].siguiente : p.y0;
};
