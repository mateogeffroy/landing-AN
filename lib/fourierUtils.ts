'use client';

export interface FourierCoefficients {
  a0: number;
  an: number[];
  bn: number[];
}

// Calcula los coeficientes de Fourier usando integración numérica (Simpson)
export function calculateFourierCoefficients(
  func: (x: number) => number,
  period: number = 2 * Math.PI,
  numHarmonics: number = 10,
  numPoints: number = 1000
): FourierCoefficients {
  const L = period / 2; // Semi-periodo
  
  // Integración por Simpson
  const simpson = (
    f: (x: number) => number,
    a: number,
    b: number,
    n: number = numPoints
  ): number => {
    const h = (b - a) / n;
    let sum = f(a) + f(b);
    
    for (let i = 1; i < n; i++) {
      const x = a + i * h;
      sum += (i % 2 === 0 ? 2 : 4) * f(x);
    }
    
    return (h / 3) * sum;
  };

  // Calcula a_0
  const a0 = simpson((x) => func(x), -L, L, numPoints) / L;

  // Calcula a_n y b_n
  const an: number[] = [];
  const bn: number[] = [];

  for (let n = 1; n <= numHarmonics; n++) {
    an[n] = simpson(
      (x) => func(x) * Math.cos((n * Math.PI * x) / L),
      -L,
      L,
      numPoints
    ) / L;

    bn[n] = simpson(
      (x) => func(x) * Math.sin((n * Math.PI * x) / L),
      -L,
      L,
      numPoints
    ) / L;
  }

  return { a0, an, bn };
}

// Evalúa la serie de Fourier en un punto x
export function evaluateFourierSeries(
  x: number,
  coefficients: FourierCoefficients,
  period: number = 2 * Math.PI
): number {
  const L = period / 2;
  let result = coefficients.a0 / 2;

  for (let n = 1; n < coefficients.an.length; n++) {
    result +=
      coefficients.an[n] * Math.cos((n * Math.PI * x) / L) +
      coefficients.bn[n] * Math.sin((n * Math.PI * x) / L);
  }

  return result;
}

// Genera puntos para la gráfica
export function generateFourierData(
  originalFunc: (x: number) => number,
  coefficients: FourierCoefficients,
  period: number = 2 * Math.PI,
  numPoints: number = 500
) {
  const L = period / 2;
  const data: Array<{
    x: number;
    original: number;
    fourier: number;
  }> = [];

  for (let i = 0; i <= numPoints; i++) {
    const x = -L + (2 * L * i) / numPoints;
    const original = originalFunc(x);
    const fourier = evaluateFourierSeries(x, coefficients, period);

    data.push({
      x: parseFloat(x.toFixed(3)),
      original: parseFloat(original.toFixed(6)),
      fourier: parseFloat(fourier.toFixed(6)),
    });
  }

  return data;
}

// Extrae el rango de x de una condición (ej: "-1 <= x <= 1" o "0 < x < 1")
export function extractXRange(condition: string): { min: number; max: number } | null {
  const absPattern = /\|\s*x\s*\|\s*([<>=]+)\s*([\d.]+)/;
  const absMatch = condition.match(absPattern);
  
  if (absMatch) {
    const operator = absMatch[1];
    const value = parseFloat(absMatch[2]);
    if (operator.includes('=')) {
      return { min: -value, max: value };
    } else {
      return { min: -value + 0.001, max: value - 0.001 };
    }
  }

  // Patrón: a <= x <= b, a < x < b, etc.
  const pattern = /([-\d.]+)\s*([<>=]+)\s*x\s*([<>=]+)\s*([-\d.]+)/;
  const match = condition.match(pattern);
  
  if (match) {
    const min = parseFloat(match[1]);
    const max = parseFloat(match[4]);
    return { min: Math.min(min, max), max: Math.max(min, max) };
  }

  return null;
}

// Extrae todos los rangos de un array de condiciones
export function extractPeriodFromConditions(
  conditions: string[]
): { min: number; max: number; period: number; L: number } {
  let globalMin = Infinity;
  let globalMax = -Infinity;

  for (const condition of conditions) {
    const range = extractXRange(condition);
    if (range) {
      globalMin = Math.min(globalMin, range.min);
      globalMax = Math.max(globalMax, range.max);
    }
  }

  // Si no se encontró rango, usar [-π, π]
  if (globalMin === Infinity || globalMax === -Infinity) {
    globalMin = -Math.PI;
    globalMax = Math.PI;
  }

  const period = globalMax - globalMin;
  const L = period / 2;

  return { min: globalMin, max: globalMax, period, L };
}

// Evalúa una condición para un valor x
export function evaluateCondition(condition: string, x: number): boolean {
  try {
    // Reemplazar |x| con abs(x) para mathjs
    let normalizedCondition = condition.replace(/\|\s*x\s*\|/g, 'abs(x)');
    
    // Reemplazar x con el valor
    normalizedCondition = normalizedCondition.replace(/x/g, `(${x})`);
    
    // Evaluar la condición
    const result = eval(normalizedCondition);
    return Boolean(result);
  } catch {
    return false;
  }
}

// Crea una función evaluadora para funciones a trozos
export function createPiecewiseFunction(
  parts: Array<{ condition: string; expression: string }>,
  mathjs: any
): (x: number) => number {
  const compiledParts = parts.map((part) => ({
    condition: part.condition,
    expression: mathjs.compile(part.expression),
  }));

  return (x: number) => {
    for (const part of compiledParts) {
      if (evaluateCondition(part.condition, x)) {
        try {
          const result = part.expression.evaluate({ x });
          return typeof result === 'number' ? result : 0;
        } catch {
          return 0;
        }
      }
    }
    return 0;
  };
}
