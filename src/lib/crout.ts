// Algoritmo de Crout (A = L·U con diagonal de U fijada en 1) que además registra,
// paso por paso, la fórmula usada, el reemplazo numérico y el resultado de cada entrada.

export interface PasoCrout {
  clave: string;
  grupo: string;
  tex: string;
}

export interface ResultadoCrout {
  deltas: number[];
  factorizable: boolean;
  motivo?: string;
  L: number[][];
  U: number[][];
  y: number[];
  x: number[];
  pasosFactorizacion: PasoCrout[];
  pasosY: PasoCrout[];
  pasosX: PasoCrout[];
}

const EPSILON = 1e-7;

// Determinante por expansión de cofactores. Con n <= 5 el costo (factorial) es irrelevante.
export function determinante(m: number[][]): number {
  const n = m.length;
  if (n === 1) return m[0][0];
  if (n === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];
  let resultado = 0;
  for (let j = 0; j < n; j++) {
    const menor = m.slice(1).map((fila) => fila.filter((_, c) => c !== j));
    resultado += (j % 2 === 0 ? 1 : -1) * m[0][j] * determinante(menor);
  }
  return resultado;
}

export function menoresPrincipales(A: number[][]): number[] {
  return A.map((_, k) => determinante(A.slice(0, k + 1).map((fila) => fila.slice(0, k + 1))));
}

export const redondear = (v: number) => {
  const r = Math.round(v * 1e4) / 1e4;
  return Object.is(r, -0) ? 0 : r;
};

const num = (v: number) => String(redondear(v));

// Los operandos negativos se muestran entre paréntesis para que la resta encadenada se lea sin ambigüedad.
const operando = (v: number) => (v < 0 ? `(${num(v)})` : num(v));

export function resolverCrout(A: number[][], b: number[]): ResultadoCrout {
  const n = A.length;
  const deltas = menoresPrincipales(A);

  const vacio: ResultadoCrout = {
    deltas,
    factorizable: false,
    L: [], U: [], y: [], x: [],
    pasosFactorizacion: [], pasosY: [], pasosX: [],
  };

  const nulo = deltas.findIndex((d) => Math.abs(d) < EPSILON);
  if (nulo !== -1) {
    return {
      ...vacio,
      motivo: `El menor principal Δ${nulo + 1} es cero, por lo que no existe la factorización L·U sin pivotaje: el algoritmo dividiría por cero al calcular la fila ${nulo + 1} de U.`,
    };
  }

  const L: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  const U: number[][] = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
  const pasosFactorizacion: PasoCrout[] = [];

  for (let k = 0; k < n; k++) {
    for (let i = k; i < n; i++) {
      const terminos = Array.from({ length: k }, (_, p) => ({ l: L[i][p], u: U[p][k] }));
      const suma = terminos.reduce((acumulado, t) => acumulado + t.l * t.u, 0);
      L[i][k] = A[i][k] - suma;

      const sub = `${i + 1}${k + 1}`;
      const formula = terminos.length
        ? `l_{${sub}} = a_{${sub}} - ${terminos.map((_, p) => `l_{${i + 1}${p + 1}}u_{${p + 1}${k + 1}}`).join(' - ')}`
        : `l_{${sub}} = a_{${sub}}`;
      const reemplazo = terminos.length
        ? ` = ${operando(A[i][k])} - ${terminos.map((t) => `${operando(t.l)} \\cdot ${operando(t.u)}`).join(' - ')}`
        : '';
      pasosFactorizacion.push({
        clave: `l-${sub}`,
        grupo: `Columna ${k + 1} de L`,
        tex: `${formula}${reemplazo} = ${num(L[i][k])}`,
      });
    }

    for (let j = k + 1; j < n; j++) {
      const terminos = Array.from({ length: k }, (_, p) => ({ l: L[k][p], u: U[p][j] }));
      const suma = terminos.reduce((acumulado, t) => acumulado + t.l * t.u, 0);
      U[k][j] = (A[k][j] - suma) / L[k][k];

      const sub = `${k + 1}${j + 1}`;
      const numerador = terminos.length
        ? `a_{${sub}} - ${terminos.map((_, p) => `l_{${k + 1}${p + 1}}u_{${p + 1}${j + 1}}`).join(' - ')}`
        : `a_{${sub}}`;
      const numeroReemplazo = terminos.length
        ? `${operando(A[k][j])} - ${terminos.map((t) => `${operando(t.l)} \\cdot ${operando(t.u)}`).join(' - ')}`
        : operando(A[k][j]);
      pasosFactorizacion.push({
        clave: `u-${sub}`,
        grupo: `Fila ${k + 1} de U`,
        tex: `u_{${sub}} = \\frac{${numerador}}{l_{${k + 1}${k + 1}}} = \\frac{${numeroReemplazo}}{${num(L[k][k])}} = ${num(U[k][j])}`,
      });
    }
  }

  const y = Array(n).fill(0);
  const pasosY: PasoCrout[] = [];
  for (let i = 0; i < n; i++) {
    const terminos = Array.from({ length: i }, (_, j) => ({ l: L[i][j], y: y[j], j }));
    const suma = terminos.reduce((acumulado, t) => acumulado + t.l * t.y, 0);
    y[i] = (b[i] - suma) / L[i][i];

    const numerador = terminos.length
      ? `b_{${i + 1}} - ${terminos.map((t) => `l_{${i + 1}${t.j + 1}}y_{${t.j + 1}}`).join(' - ')}`
      : `b_{${i + 1}}`;
    const numeroReemplazo = terminos.length
      ? `${operando(b[i])} - ${terminos.map((t) => `${operando(t.l)} \\cdot ${operando(t.y)}`).join(' - ')}`
      : operando(b[i]);
    pasosY.push({
      clave: `y-${i + 1}`,
      grupo: `Fila ${i + 1}`,
      tex: `y_{${i + 1}} = \\frac{${numerador}}{l_{${i + 1}${i + 1}}} = \\frac{${numeroReemplazo}}{${num(L[i][i])}} = ${num(y[i])}`,
    });
  }

  const x = Array(n).fill(0);
  const pasosX: PasoCrout[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const terminos = Array.from({ length: n - 1 - i }, (_, indice) => {
      const j = i + 1 + indice;
      return { u: U[i][j], x: x[j], j };
    });
    const suma = terminos.reduce((acumulado, t) => acumulado + t.u * t.x, 0);
    x[i] = y[i] - suma;

    const formula = terminos.length
      ? `x_{${i + 1}} = y_{${i + 1}} - ${terminos.map((t) => `u_{${i + 1}${t.j + 1}}x_{${t.j + 1}}`).join(' - ')}`
      : `x_{${i + 1}} = y_{${i + 1}}`;
    const reemplazo = terminos.length
      ? ` = ${operando(y[i])} - ${terminos.map((t) => `${operando(t.u)} \\cdot ${operando(t.x)}`).join(' - ')}`
      : '';
    pasosX.push({
      clave: `x-${i + 1}`,
      grupo: `Fila ${i + 1}`,
      tex: `${formula}${reemplazo} = ${num(x[i])}`,
    });
  }

  return {
    deltas,
    factorizable: true,
    L: L.map((fila) => fila.map(redondear)),
    U: U.map((fila) => fila.map(redondear)),
    y: y.map(redondear),
    x: x.map(redondear),
    pasosFactorizacion,
    pasosY,
    pasosX,
  };
}
