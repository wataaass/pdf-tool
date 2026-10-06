import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAngle, rotatePages } from '../js/rotate.js';
import { makePdf, pageMarks, pageRotations } from './helpers.js';

test('normalizeAngle は 0〜359 にそろえる', () => {
  assert.equal(normalizeAngle(-90), 270);
  assert.equal(normalizeAngle(360), 0);
  assert.equal(normalizeAngle(450), 90);
});

test('指定したページだけを回転し、ページの順番は変えない', async () => {
  const result = await rotatePages(await makePdf(3), { 2: 90 });
  assert.deepEqual(await pageRotations(result), [0, 90, 0]);
  assert.deepEqual(await pageMarks(result), [101, 102, 103]);
});

test('元からの回転に足す（270 + 90 = 0）', async () => {
  const result = await rotatePages(await makePdf(1, { rotations: { 1: 270 } }), { 1: 90 });
  assert.deepEqual(await pageRotations(result), [0]);
});

test('左回り（-90）は 270 になる', async () => {
  const result = await rotatePages(await makePdf(1), { 1: -90 });
  assert.deepEqual(await pageRotations(result), [270]);
});
