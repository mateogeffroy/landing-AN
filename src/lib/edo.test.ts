// Ejecutar con: npm run test:edo
import test from 'node:test';
import assert from 'node:assert/strict';
import { PROBLEMAS, resolver, valorFinal, type ClaveMetodo } from './edo.ts';

const [p2xy] = PROBLEMAS;

// Valores del apunte de Amiconi (redondeados a 4 decimales en el apunte).
test('Taylor y RK2 reproducen los ejemplos resueltos del apunte', () => {
  const taylor = resolver('taylor', p2xy).map((i) => i.siguiente);
  [1.23, 1.5426, 1.9727].forEach((v, i) => assert.ok(Math.abs(taylor[i] - v) < 1e-3));

  const rk2 = resolver('rk2', p2xy).map((i) => i.siguiente);
  [1.231, 1.5452, 1.9779].forEach((v, i) => assert.ok(Math.abs(rk2[i] - v) < 1e-3));
});

// El apunte da y(1) = 1.4843 porque en la segunda iteración usa y1 − h·y1' como
// predictor; con el signo correcto es 1.390625 (exacta: x + e^{-x} = 1.3679).
test('Euler Mejorado reproduce el ejemplo del apunte', () => {
  const p = { ...p2xy, f: (x: number, y: number) => -y + x + 1, x0: 0, y0: 1, xf: 1, h: 0.5 };
  const em = resolver('eulerMejorado', p).map((i) => i.siguiente);
  [1.125, 1.390625].forEach((v, i) => assert.ok(Math.abs(em[i] - v) < 1e-3));
});

test('los tres métodos son de orden 2: dividir h por 2 divide el error por ≈ 4', () => {
  for (const p of PROBLEMAS) {
    for (const m of ['taylor', 'eulerMejorado', 'rk2'] as ClaveMetodo[]) {
      const e1 = Math.abs(valorFinal(m, p, p.h) - p.exacta(p.xf));
      const e2 = Math.abs(valorFinal(m, p, p.h / 2) - p.exacta(p.xf));
      const cociente = e1 / e2;
      assert.ok(cociente > 3.5 && cociente < 4.5, `${p.clave}/${m}: cociente ${cociente}`);
    }
  }
});
