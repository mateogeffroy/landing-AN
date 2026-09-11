// Ejecutar con: npm run test:minimos
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ajustarLineal,
  ajustarExponencial,
  ajustarPotencial,
  ajustarPolinomico2,
  ajustarCociente,
  ajustarTodos,
  tiempoDeDuplicacion,
} from './minimosCuadrados.ts';
import { CLUSTERES } from './datosCaso2.ts';

const cerca = (obtenido: number, esperado: number, tolerancia: number, mensaje: string) =>
  assert.ok(Math.abs(obtenido - esperado) < tolerancia, `${mensaje}: ${obtenido} vs ${esperado}`);

test('el ajuste lineal recupera exactamente una recta sin ruido', () => {
  const x = [1, 2, 3, 4, 5];
  const y = x.map((v) => 3 + 2 * v);
  const a = ajustarLineal({ x, y });
  cerca(a.parametros[0].valor, 3, 1e-9, 'a1');
  cerca(a.parametros[1].valor, 2, 1e-9, 'a2');
  cerca(a.r2, 1, 1e-9, 'r2');
});

test('el ajuste exponencial recupera los parámetros de datos generados sin ruido', () => {
  const x = Array.from({ length: 20 }, (_, i) => i * 5);
  const y = x.map((v) => 1500 * Math.exp(0.02 * v));
  const a = ajustarExponencial({ x, y });
  cerca(a.parametros[0].valor, 1500, 1e-6, 'a');
  cerca(a.parametros[1].valor, 0.02, 1e-12, 'b');
  cerca(a.r2, 1, 1e-12, 'r2');
});

test('el ajuste potencial recupera los parámetros de datos generados sin ruido', () => {
  const x = Array.from({ length: 15 }, (_, i) => i + 1);
  const y = x.map((v) => 4 * v ** 1.5);
  const a = ajustarPotencial({ x, y });
  cerca(a.parametros[0].valor, 4, 1e-9, 'a');
  cerca(a.parametros[1].valor, 1.5, 1e-12, 'b');
});

test('el ajuste polinómico recupera exactamente una parábola', () => {
  const x = [-2, -1, 0, 1, 2, 3];
  const y = x.map((v) => 5 - 3 * v + 2 * v * v);
  const a = ajustarPolinomico2({ x, y });
  cerca(a.parametros[0].valor, 5, 1e-8, 'a1');
  cerca(a.parametros[1].valor, -3, 1e-8, 'a2');
  cerca(a.parametros[2].valor, 2, 1e-8, 'a3');
  cerca(a.r2, 1, 1e-9, 'r2');
});

test('el ajuste del cociente recupera los parámetros de datos generados sin ruido', () => {
  const x = [1, 2, 2.5, 4, 6, 8, 8.5];
  const y = x.map((v) => (2 * v) / (3 + v));
  const a = ajustarCociente({ x, y });
  cerca(a.parametros[0].valor, 2, 1e-8, 'a');
  cerca(a.parametros[1].valor, 3, 1e-8, 'b');
});

test('los modelos descartan puntos fuera de su dominio sin romperse', () => {
  const x = [0, 1, 2, 3];
  const y = [1, 2, 4, 8];
  const potencial = ajustarPotencial({ x, y });
  assert.ok(potencial.valido);
  assert.match(potencial.motivo ?? '', /x = 0/);

  const negativos = ajustarExponencial({ x: [1, 2, 3], y: [1, -2, 3] });
  assert.equal(negativos.valido, false);
});

test('r² queda entre 0 y 1 para todos los modelos en los cuatro clústeres del caso', () => {
  for (const cluster of CLUSTERES) {
    for (const ajuste of ajustarTodos({ x: cluster.x, y: cluster.y })) {
      if (!ajuste.valido) continue;
      assert.ok(ajuste.r2 >= 0 && ajuste.r2 <= 1, `${cluster.codigo}/${ajuste.clave}: r² = ${ajuste.r2}`);
    }
  }
});

// Valores de referencia del informe del grupo (Caso 2), para detectar cualquier
// desvío entre lo que muestra la página y lo que se entregó por escrito.
const REFERENCIA: Record<string, { a: number; b: number; r2: number; duplicacion: number }> = {
  ECOL: { a: 16954.8, b: 0.025544, r2: 0.9999, duplicacion: 27.1 },
  BSUB: { a: 14730.1, b: 0.018393, r2: 0.9996, duplicacion: 37.7 },
  LACI: { a: 18011.5, b: 0.013795, r2: 0.9993, duplicacion: 50.2 },
  PFLU: { a: 15516.4, b: 0.010449, r2: 0.9988, duplicacion: 66.3 },
};

test('el ajuste exponencial coincide con los valores del informe en los cuatro clústeres', () => {
  for (const cluster of CLUSTERES) {
    const esperado = REFERENCIA[cluster.codigo];
    const a = ajustarExponencial({ x: cluster.x, y: cluster.y });
    cerca(a.parametros[0].valor, esperado.a, 0.5, `${cluster.codigo} · a`);
    cerca(a.parametros[1].valor, esperado.b, 1e-6, `${cluster.codigo} · b`);
    cerca(a.r2, esperado.r2, 5e-4, `${cluster.codigo} · r²`);
    cerca(tiempoDeDuplicacion(a.parametros[1].valor), esperado.duplicacion, 0.1, `${cluster.codigo} · t½`);
  }
});

test('el exponencial es el mejor modelo en los cuatro clústeres', () => {
  for (const cluster of CLUSTERES) {
    const ajustes = ajustarTodos({ x: cluster.x, y: cluster.y }).filter((a) => a.valido);
    const mejor = ajustes.reduce((a, b) => (b.r2 > a.r2 ? b : a));
    assert.equal(mejor.clave, 'exponencial', `${cluster.codigo}: ganó ${mejor.clave}`);
  }
});

test('cada clúster del caso tiene 61 mediciones equiespaciadas cada 5 minutos', () => {
  assert.equal(CLUSTERES.length, 4);
  for (const cluster of CLUSTERES) {
    assert.equal(cluster.x.length, 61);
    assert.equal(cluster.y.length, 61);
    assert.equal(cluster.x[0], 0);
    assert.equal(cluster.x[60], 300);
    for (let i = 1; i < cluster.x.length; i++) {
      assert.equal(cluster.x[i] - cluster.x[i - 1], 5);
    }
  }
});
