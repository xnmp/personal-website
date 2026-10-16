import { expect, test } from 'bun:test';
import { extendUnderlayUnderMetal, scaleField } from '../scripts/framed-pane.mjs';

test('enamel support under opaque logical metal fills a native translucent inner edge', () => {
  const layer = new Float32Array(5 * 4);
  layer.set([100, 60, 20, 255], 2 * 4);
  layer.set([100, 60, 20, 255], 3 * 4);
  const extended = extendUnderlayUnderMetal(layer, new Float32Array([1, 1, 0, 0, 0]), 5, 1);
  const nativeLayer = scaleField(extended, 5, 1, 4, 2);
  // This device sample lies under a logically opaque edge. The real metal is
  // only half covered, so the explicit hidden enamel must supply the remainder.
  const p = 3 * 4, metalAlpha = 0.5;
  expect(metalAlpha + nativeLayer[p + 3] / 255 * (1 - metalAlpha)).toBe(1);
  expect(200 * metalAlpha + nativeLayer[p] * (1 - metalAlpha)).toBe(150);
});

test('hidden underpaint support does not expand into exterior clear pixels or flood the metal', () => {
  const layer = new Float32Array(7 * 4);
  layer.set([100, 60, 20, 255], 3 * 4);
  const original = Float32Array.from(layer);
  const result = extendUnderlayUnderMetal(layer, new Float32Array([1, 1, 1, 0, 0, 0, 0]), 7, 1);
  expect([...result.slice(2 * 4, 3 * 4)]).toEqual([100, 60, 20, 255]);
  expect([...result.slice(0, 2 * 4)]).toEqual(Array(8).fill(0));
  expect([...result.slice(4 * 4)]).toEqual(Array(12).fill(0));
  expect(layer).toEqual(original);
});
