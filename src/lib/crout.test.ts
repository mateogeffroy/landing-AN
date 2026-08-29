// Ejecutar con: npm run test:crout
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolverCrout } from './crout.ts';

// L y U se devuelven redondeadas a 4 decimales, así que la tolerancia acompaña ese redondeo.
const TOLERANCIA = 1e-3;

const casos: { A: number[][]; b: number[] }[] = [
  { A: [[5]], b: [10] },
  { A: [[2, 1, 1], [4, 1, 0], [-2, 2, 1]], b: [3, 6, 1] },
  { A: [[4, -2, 1, 0], [-2, 4, -2, 1], [1, -2, 4, -2], [0, 1, -2, 4]], b: [11, -16, 17, -14] },
];

test('L·U reconstruye A y x resuelve A·x = b', () => {
  for (const { A, b } of casos) {
    const n = A.length;
    const r = resolverCrout(A, b);
    assert.ok(r.factorizable);

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const producto = r.L[i].reduce((acumulado, l, k) => acumulado + l * r.U[k][j], 0);
        assert.ok(Math.abs(producto - A[i][j]) < TOLERANCIA, `L·U ≠ A en (${i},${j})`);
      }
    }

    for (let i = 0; i < n; i++) {
      const producto = A[i].reduce((acumulado, a, j) => acumulado + a * r.x[j], 0);
      assert.ok(Math.abs(producto - b[i]) < TOLERANCIA, `A·x ≠ b en la fila ${i}`);
    }
  }
});

test('rechaza matrices con un menor principal nulo', () => {
  const r = resolverCrout([[1, 2], [2, 4]], [1, 2]);
  assert.equal(r.factorizable, false);
  assert.match(r.motivo ?? '', /Δ2/);
});

test('la cantidad de pasos cubre todas las incógnitas', () => {
  const { A, b } = casos[1];
  const r = resolverCrout(A, b);
  assert.equal(r.pasosFactorizacion.length, 6 + 3); // 6 entradas de L + 3 de U en 3×3
  assert.equal(r.pasosY.length, 3);
  assert.equal(r.pasosX.length, 3);
});
